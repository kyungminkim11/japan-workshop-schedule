-- Japan Workshop Schedule - Supabase setup
-- Run in Supabase Dashboard > SQL Editor > New query.
--
-- Before running:
--   1. Replace CHANGE_ADMIN_PIN with your real admin PIN.
--   2. Replace CHANGE_FAMILY_PIN with your real family read-only PIN.
--   3. Do not paste service_role keys, secret keys, or database passwords into frontend files.

create extension if not exists pgcrypto;

create table if not exists public.workshop_pins (
  role text primary key check (role in ('admin', 'family')),
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_sessions (
  token_hash text primary key,
  role text not null check (role in ('admin', 'family')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.workshop_login_attempts (
  id bigint generated always as identity primary key,
  ok boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.workshop_state (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.workshop_photos (
  id uuid primary key default gen_random_uuid(),
  item_id text not null check (char_length(item_id) between 1 and 32),
  file_name text not null default 'photo.jpg',
  mime_type text not null default 'image/jpeg',
  data_url text not null,
  shared_with_family boolean not null default true,
  created_at timestamptz not null default now(),
  constraint workshop_photos_data_url_check check (
    data_url like 'data:image/%;base64,%'
    and char_length(data_url) <= 1600000
  )
);

alter table public.workshop_pins enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.workshop_login_attempts enable row level security;
alter table public.workshop_state enable row level security;
alter table public.workshop_photos enable row level security;

revoke all on table public.workshop_pins from anon, authenticated;
revoke all on table public.workshop_sessions from anon, authenticated;
revoke all on table public.workshop_login_attempts from anon, authenticated;
revoke all on table public.workshop_state from anon, authenticated;
revoke all on table public.workshop_photos from anon, authenticated;
revoke all on sequence public.workshop_login_attempts_id_seq from anon, authenticated;

insert into public.workshop_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Replace the placeholders below before running this file.
do $$
declare
  v_admin_pin text := 'CHANGE_ADMIN_PIN';
  v_family_pin text := 'CHANGE_FAMILY_PIN';
begin
  if v_admin_pin = 'CHANGE_ADMIN_PIN'
    or v_family_pin = 'CHANGE_FAMILY_PIN'
    or length(v_admin_pin) < 6
    or length(v_family_pin) < 6 then
    raise exception 'Replace CHANGE_ADMIN_PIN and CHANGE_FAMILY_PIN with real PINs of at least 6 characters before running schema.sql.';
  end if;

  insert into public.workshop_pins (role, pin_hash)
  values
    ('admin', crypt('admin:' || v_admin_pin, gen_salt('bf', 12))),
    ('family', crypt('family:' || v_family_pin, gen_salt('bf', 12)))
  on conflict (role) do update
  set pin_hash = excluded.pin_hash,
      updated_at = now();
end $$;

create or replace function public.workshop_login(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_token text;
  v_token_hash text;
  v_failed_attempts integer;
begin
  delete from public.workshop_sessions
  where expires_at < now();

  delete from public.workshop_login_attempts
  where created_at < now() - interval '1 day';

  select count(*) into v_failed_attempts
  from public.workshop_login_attempts
  where ok = false
    and created_at > now() - interval '1 minute';

  if v_failed_attempts >= 30 then
    return jsonb_build_object('ok', false, 'message', 'PIN 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
  end if;

  if p_pin is null or length(trim(p_pin)) < 4 or length(trim(p_pin)) > 128 then
    insert into public.workshop_login_attempts(ok) values (false);
    return jsonb_build_object('ok', false, 'message', 'PIN을 확인해주세요.');
  end if;

  select role into v_role
  from public.workshop_pins
  where pin_hash = crypt(role || ':' || trim(p_pin), pin_hash)
  limit 1;

  if v_role is null then
    insert into public.workshop_login_attempts(ok) values (false);
    return jsonb_build_object('ok', false, 'message', 'PIN이 올바르지 않습니다.');
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.workshop_sessions(token_hash, role, expires_at)
  values (v_token_hash, v_role, now() + interval '14 days');

  insert into public.workshop_login_attempts(ok) values (true);

  return jsonb_build_object('ok', true, 'token', v_token, 'role', v_role);
end;
$$;

create or replace function public.workshop_logout(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.workshop_sessions
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.workshop_get_state(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_data jsonb;
  v_photos jsonb;
begin
  delete from public.workshop_sessions
  where expires_at < now();

  select role into v_role
  from public.workshop_sessions
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and expires_at > now();

  if v_role is null then
    return jsonb_build_object('ok', false, 'message', '세션이 만료되었습니다. 다시 로그인해주세요.');
  end if;

  select coalesce(data, '{}'::jsonb) into v_data
  from public.workshop_state
  where id = 'main';

  v_data := coalesce(v_data, '{}'::jsonb);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'itemId', item_id,
        'fileName', file_name,
        'mimeType', mime_type,
        'dataUrl', data_url,
        'sharedWithFamily', shared_with_family,
        'createdAt', created_at
      )
      order by created_at
    ),
    '[]'::jsonb
  )
  into v_photos
  from public.workshop_photos
  where v_role = 'admin' or shared_with_family = true;

  if v_role = 'admin' then
    return jsonb_build_object(
      'ok', true,
      'role', v_role,
      'data', v_data,
      'photos', v_photos
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'role', v_role,
    'data', jsonb_build_object(
      'familyStatus', coalesce(v_data->'familyStatus', '{}'::jsonb),
      'checkins', coalesce(v_data->'checkins', '[]'::jsonb),
      'visitDone', coalesce(v_data->'visitDone', '{}'::jsonb)
    ),
    'photos', v_photos
  );
end;
$$;

create or replace function public.workshop_save_state(p_token text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_input jsonb := coalesce(p_data, '{}'::jsonb);
  v_clean jsonb;
begin
  delete from public.workshop_sessions
  where expires_at < now();

  select role into v_role
  from public.workshop_sessions
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and expires_at > now();

  if v_role is null then
    return jsonb_build_object('ok', false, 'message', '세션이 만료되었습니다. 다시 로그인해주세요.');
  end if;

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'message', '관리자만 저장할 수 있습니다.');
  end if;

  v_clean := jsonb_build_object(
    'notes', case when jsonb_typeof(v_input->'notes') = 'object' then v_input->'notes' else '{}'::jsonb end,
    'shopping', case when jsonb_typeof(v_input->'shopping') = 'object' then v_input->'shopping' else '{}'::jsonb end,
    'visitDone', case when jsonb_typeof(v_input->'visitDone') = 'object' then v_input->'visitDone' else '{}'::jsonb end,
    'checkins', case when jsonb_typeof(v_input->'checkins') = 'array' then v_input->'checkins' else '[]'::jsonb end,
    'familyStatus', case when jsonb_typeof(v_input->'familyStatus') = 'object' then v_input->'familyStatus' else '{}'::jsonb end
  );

  if pg_column_size(v_clean) > 2000000 then
    return jsonb_build_object('ok', false, 'message', '저장 데이터가 너무 큽니다. 사진은 사진 업로드 기능으로 저장해주세요.');
  end if;

  insert into public.workshop_state(id, data, updated_at)
  values ('main', v_clean, now())
  on conflict (id) do update
    set data = excluded.data,
        updated_at = now();

  return jsonb_build_object('ok', true, 'updatedAt', now());
end;
$$;

create or replace function public.workshop_add_photo(
  p_token text,
  p_item_id text,
  p_file_name text,
  p_mime_type text,
  p_data_url text,
  p_shared_with_family boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_photo public.workshop_photos;
begin
  delete from public.workshop_sessions
  where expires_at < now();

  select role into v_role
  from public.workshop_sessions
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and expires_at > now();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'message', '관리자만 사진을 업로드할 수 있습니다.');
  end if;

  if p_item_id is null or length(trim(p_item_id)) < 1 or length(trim(p_item_id)) > 32 then
    return jsonb_build_object('ok', false, 'message', '장소 ID가 올바르지 않습니다.');
  end if;

  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    return jsonb_build_object('ok', false, 'message', '지원하지 않는 이미지 형식입니다.');
  end if;

  if p_data_url is null
    or p_data_url not like 'data:image/%;base64,%'
    or char_length(p_data_url) > 1600000 then
    return jsonb_build_object('ok', false, 'message', '사진 데이터가 너무 크거나 올바르지 않습니다.');
  end if;

  insert into public.workshop_photos(item_id, file_name, mime_type, data_url, shared_with_family)
  values (
    trim(p_item_id),
    left(coalesce(nullif(trim(p_file_name), ''), 'photo.jpg'), 180),
    p_mime_type,
    p_data_url,
    coalesce(p_shared_with_family, true)
  )
  returning * into v_photo;

  return jsonb_build_object(
    'ok', true,
    'photo', jsonb_build_object(
      'id', v_photo.id,
      'itemId', v_photo.item_id,
      'fileName', v_photo.file_name,
      'mimeType', v_photo.mime_type,
      'dataUrl', v_photo.data_url,
      'sharedWithFamily', v_photo.shared_with_family,
      'createdAt', v_photo.created_at
    )
  );
end;
$$;

create or replace function public.workshop_delete_photo(p_token text, p_photo_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  delete from public.workshop_sessions
  where expires_at < now();

  select role into v_role
  from public.workshop_sessions
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and expires_at > now();

  if v_role <> 'admin' then
    return jsonb_build_object('ok', false, 'message', '관리자만 사진을 삭제할 수 있습니다.');
  end if;

  delete from public.workshop_photos
  where id = p_photo_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.workshop_login(text) from public;
revoke execute on function public.workshop_logout(text) from public;
revoke execute on function public.workshop_get_state(text) from public;
revoke execute on function public.workshop_save_state(text, jsonb) from public;
revoke execute on function public.workshop_add_photo(text, text, text, text, text, boolean) from public;
revoke execute on function public.workshop_delete_photo(text, uuid) from public;

grant usage on schema public to anon, authenticated;
grant execute on function public.workshop_login(text) to anon, authenticated;
grant execute on function public.workshop_logout(text) to anon, authenticated;
grant execute on function public.workshop_get_state(text) to anon, authenticated;
grant execute on function public.workshop_save_state(text, jsonb) to anon, authenticated;
grant execute on function public.workshop_add_photo(text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.workshop_delete_photo(text, uuid) to anon, authenticated;
