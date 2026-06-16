-- Japan Workshop Schedule - secure Supabase setup
-- Run in Supabase Dashboard > SQL Editor > New query.
-- Replace these placeholders before running:
--   CHANGE_ADMIN_CODE
--   CHANGE_GIRLFRIEND_CODE
--   CHANGE_FAMILY_CODE
-- Access codes are case-insensitive and whitespace-insensitive.
-- Do not commit real access codes to GitHub.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.workshop_normalize_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(lower(coalesce(p_code, '')), '\s+', '', 'g')
$$;

create table if not exists public.workshop_pins (
  role text primary key,
  code_hash text,
  pin_hash text,
  display_code text,
  updated_at timestamptz not null default now()
);
alter table public.workshop_pins alter column pin_hash drop not null;
alter table public.workshop_pins add column if not exists code_hash text;
alter table public.workshop_pins add column if not exists display_code text;
alter table public.workshop_pins drop constraint if exists workshop_pins_role_check;
alter table public.workshop_pins add constraint workshop_pins_role_check check (role in ('admin', 'girlfriend', 'family'));

create table if not exists public.workshop_sessions (
  token_hash text primary key,
  role text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.workshop_sessions drop constraint if exists workshop_sessions_role_check;
alter table public.workshop_sessions add constraint workshop_sessions_role_check check (role in ('admin', 'girlfriend', 'family'));
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'workshop_sessions' and column_name = 'token')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'workshop_sessions' and column_name = 'token_hash') then
    alter table public.workshop_sessions rename column token to token_hash;
  end if;
end $$;

create table if not exists public.workshop_login_attempts (
  id bigint generated always as identity primary key,
  ok boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.workshop_access_logs (
  id bigint generated always as identity primary key,
  role text not null check (role in ('admin', 'girlfriend', 'family')),
  client_info text,
  created_at timestamptz not null default now()
);
create table if not exists public.workshop_state (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.workshop_photos (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id text not null check (char_length(item_id) between 1 and 32),
  file_name text not null default 'photo.jpg',
  mime_type text not null default 'image/jpeg',
  data_url text not null,
  shared_with_family boolean not null default true,
  shared_with_girlfriend boolean not null default true,
  created_at timestamptz not null default now(),
  constraint workshop_photos_data_url_check check (data_url like 'data:image/%;base64,%' and char_length(data_url) <= 1600000)
);
alter table public.workshop_photos add column if not exists shared_with_girlfriend boolean not null default true;

alter table public.workshop_pins enable row level security;
alter table public.workshop_sessions enable row level security;
alter table public.workshop_login_attempts enable row level security;
alter table public.workshop_access_logs enable row level security;
alter table public.workshop_state enable row level security;
alter table public.workshop_photos enable row level security;

revoke all on table public.workshop_pins from anon, authenticated;
revoke all on table public.workshop_sessions from anon, authenticated;
revoke all on table public.workshop_login_attempts from anon, authenticated;
revoke all on table public.workshop_access_logs from anon, authenticated;
revoke all on table public.workshop_state from anon, authenticated;
revoke all on table public.workshop_photos from anon, authenticated;
revoke all on sequence public.workshop_login_attempts_id_seq from anon, authenticated;
revoke all on sequence public.workshop_access_logs_id_seq from anon, authenticated;

insert into public.workshop_state (id, data) values ('main', '{}'::jsonb) on conflict (id) do nothing;
update public.workshop_state set data = jsonb_set(coalesce(data, '{}'::jsonb), '{notes}', coalesce(data->'notes', '{}'::jsonb), true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{schedule}', case when jsonb_typeof(data->'schedule') = 'array' then data->'schedule' else '[]'::jsonb end, true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{expenses}', case when jsonb_typeof(data->'expenses') = 'array' then data->'expenses' else '[]'::jsonb end, true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{shoppingItems}', case when jsonb_typeof(data->'shoppingItems') = 'array' then data->'shoppingItems' else '[]'::jsonb end, true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{shopping}', coalesce(data->'shopping', '{}'::jsonb), true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{girlfriendRequests}', case when jsonb_typeof(data->'girlfriendRequests') = 'array' then data->'girlfriendRequests' else '[]'::jsonb end, true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{visitDone}', coalesce(data->'visitDone', '{}'::jsonb), true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{checkins}', case when jsonb_typeof(data->'checkins') = 'array' then data->'checkins' else '[]'::jsonb end, true) where id = 'main';
update public.workshop_state set data = jsonb_set(data, '{familyStatus}', coalesce(data->'familyStatus', '{}'::jsonb), true) where id = 'main';

do $$
declare
  v_admin_code text := 'CHANGE_ADMIN_CODE';
  v_girlfriend_code text := 'CHANGE_GIRLFRIEND_CODE';
  v_family_code text := 'CHANGE_FAMILY_CODE';
begin
  if v_admin_code = 'CHANGE_ADMIN_CODE'
     or v_girlfriend_code = 'CHANGE_GIRLFRIEND_CODE'
     or v_family_code = 'CHANGE_FAMILY_CODE'
     or length(public.workshop_normalize_code(v_admin_code)) < 4
     or length(public.workshop_normalize_code(v_girlfriend_code)) < 4
     or length(public.workshop_normalize_code(v_family_code)) < 4 then
    raise exception 'Replace CHANGE_ADMIN_CODE, CHANGE_GIRLFRIEND_CODE, and CHANGE_FAMILY_CODE with real access codes. Normalized code must be at least 4 characters.';
  end if;

  insert into public.workshop_pins (role, code_hash, pin_hash, display_code)
  values
    ('admin', extensions.crypt('admin:' || public.workshop_normalize_code(v_admin_code), extensions.gen_salt('bf', 12)), null, v_admin_code),
    ('girlfriend', extensions.crypt('girlfriend:' || public.workshop_normalize_code(v_girlfriend_code), extensions.gen_salt('bf', 12)), null, v_girlfriend_code),
    ('family', extensions.crypt('family:' || public.workshop_normalize_code(v_family_code), extensions.gen_salt('bf', 12)), null, v_family_code)
  on conflict (role) do update
  set code_hash = excluded.code_hash,
      pin_hash = null,
      display_code = excluded.display_code,
      updated_at = now();
end $$;

drop function if exists public.workshop_login(text);
drop function if exists public.workshop_login(text, text);
create or replace function public.workshop_login(p_code text, p_client_info text default null)
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
  v_code text := public.workshop_normalize_code(p_code);
begin
  delete from public.workshop_sessions where expires_at < now();
  delete from public.workshop_login_attempts where created_at < now() - interval '1 day';
  delete from public.workshop_access_logs where created_at < now() - interval '90 days';
  select count(*) into v_failed_attempts from public.workshop_login_attempts where ok = false and created_at > now() - interval '1 minute';
  if v_failed_attempts >= 30 then
    return jsonb_build_object('ok', false, 'message', '접속 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
  end if;
  if length(v_code) < 4 or length(coalesce(p_code, '')) > 128 then
    insert into public.workshop_login_attempts(ok) values (false);
    return jsonb_build_object('ok', false, 'message', '접속 코드를 확인해주세요.');
  end if;
  select role into v_role from public.workshop_pins
  where code_hash = extensions.crypt(role || ':' || v_code, code_hash)
     or (code_hash is null and pin_hash = extensions.crypt(role || ':' || v_code, pin_hash))
  limit 1;
  if v_role is null then
    insert into public.workshop_login_attempts(ok) values (false);
    return jsonb_build_object('ok', false, 'message', '접속 코드가 올바르지 않습니다.');
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  insert into public.workshop_sessions(token_hash, role, expires_at) values (v_token_hash, v_role, now() + interval '14 days');
  insert into public.workshop_login_attempts(ok) values (true);
  insert into public.workshop_access_logs(role, client_info) values (v_role, left(coalesce(p_client_info, ''), 500));
  return jsonb_build_object('ok', true, 'token', v_token, 'role', v_role);
end;
$$;

create or replace function public.workshop_logout(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  delete from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.workshop_get_state(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_data jsonb;
  v_photos jsonb;
begin
  delete from public.workshop_sessions where expires_at < now();
  select role into v_role from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
  if v_role is null then
    return jsonb_build_object('ok', false, 'message', '세션이 만료되었습니다. 다시 접속해주세요.');
  end if;
  select coalesce(data, '{}'::jsonb) into v_data from public.workshop_state where id = 'main';
  v_data := coalesce(v_data, '{}'::jsonb);
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'itemId', item_id, 'fileName', file_name, 'mimeType', mime_type, 'dataUrl', data_url, 'sharedWithFamily', shared_with_family, 'sharedWithGirlfriend', shared_with_girlfriend, 'createdAt', created_at) order by created_at), '[]'::jsonb)
  into v_photos from public.workshop_photos
  where v_role = 'admin' or (v_role = 'family' and shared_with_family = true) or (v_role = 'girlfriend' and shared_with_girlfriend = true);
  if v_role = 'admin' then
    return jsonb_build_object('ok', true, 'role', v_role, 'data', v_data, 'photos', v_photos);
  end if;
  if v_role = 'girlfriend' then
    return jsonb_build_object('ok', true, 'role', v_role, 'data', jsonb_build_object('schedule', coalesce(v_data->'schedule', '[]'::jsonb), 'familyStatus', coalesce(v_data->'familyStatus', '{}'::jsonb), 'checkins', coalesce(v_data->'checkins', '[]'::jsonb), 'visitDone', coalesce(v_data->'visitDone', '{}'::jsonb), 'girlfriendRequests', coalesce(v_data->'girlfriendRequests', '[]'::jsonb)), 'photos', v_photos);
  end if;
  return jsonb_build_object('ok', true, 'role', v_role, 'data', jsonb_build_object('schedule', coalesce(v_data->'schedule', '[]'::jsonb), 'familyStatus', coalesce(v_data->'familyStatus', '{}'::jsonb), 'checkins', coalesce(v_data->'checkins', '[]'::jsonb), 'visitDone', coalesce(v_data->'visitDone', '{}'::jsonb)), 'photos', v_photos);
end;
$$;

create or replace function public.workshop_save_state(p_token text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_input jsonb := coalesce(p_data, '{}'::jsonb);
  v_clean jsonb;
begin
  delete from public.workshop_sessions where expires_at < now();
  select role into v_role from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
  if v_role is null then return jsonb_build_object('ok', false, 'message', '세션이 만료되었습니다. 다시 접속해주세요.'); end if;
  if v_role <> 'admin' then return jsonb_build_object('ok', false, 'message', '관리자만 저장할 수 있습니다.'); end if;
  v_clean := jsonb_build_object(
    'notes', case when jsonb_typeof(v_input->'notes') = 'object' then v_input->'notes' else '{}'::jsonb end,
    'schedule', case when jsonb_typeof(v_input->'schedule') = 'array' then v_input->'schedule' else '[]'::jsonb end,
    'expenses', case when jsonb_typeof(v_input->'expenses') = 'array' then v_input->'expenses' else '[]'::jsonb end,
    'shoppingItems', case when jsonb_typeof(v_input->'shoppingItems') = 'array' then v_input->'shoppingItems' else '[]'::jsonb end,
    'shopping', case when jsonb_typeof(v_input->'shopping') = 'object' then v_input->'shopping' else '{}'::jsonb end,
    'girlfriendRequests', case when jsonb_typeof(v_input->'girlfriendRequests') = 'array' then v_input->'girlfriendRequests' else '[]'::jsonb end,
    'visitDone', case when jsonb_typeof(v_input->'visitDone') = 'object' then v_input->'visitDone' else '{}'::jsonb end,
    'checkins', case when jsonb_typeof(v_input->'checkins') = 'array' then v_input->'checkins' else '[]'::jsonb end,
    'familyStatus', case when jsonb_typeof(v_input->'familyStatus') = 'object' then v_input->'familyStatus' else '{}'::jsonb end
  );
  if pg_column_size(v_clean) > 2000000 then return jsonb_build_object('ok', false, 'message', '저장 데이터가 너무 큽니다. 이미지는 사진 업로드 기능을 사용해주세요.'); end if;
  insert into public.workshop_state(id, data, updated_at) values ('main', v_clean, now()) on conflict (id) do update set data = excluded.data, updated_at = now();
  return jsonb_build_object('ok', true, 'updatedAt', now());
end;
$$;

create or replace function public.workshop_update_code(p_token text, p_role text, p_new_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_target_role text := lower(trim(coalesce(p_role, '')));
  v_code_raw text := trim(coalesce(p_new_code, ''));
  v_code text := public.workshop_normalize_code(p_new_code);
begin
  delete from public.workshop_sessions where expires_at < now();
  select role into v_role from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
  if v_role <> 'admin' then return jsonb_build_object('ok', false, 'message', '관리자만 접속 코드를 변경할 수 있습니다.'); end if;
  if v_target_role not in ('admin', 'girlfriend', 'family') then return jsonb_build_object('ok', false, 'message', '접속 코드 역할이 올바르지 않습니다.'); end if;
  if length(v_code) < 4 or length(v_code_raw) > 64 then return jsonb_build_object('ok', false, 'message', '접속 코드는 공백 제외 4자 이상, 전체 64자 이하로 입력해주세요.'); end if;
  insert into public.workshop_pins(role, code_hash, pin_hash, display_code, updated_at)
  values (v_target_role, extensions.crypt(v_target_role || ':' || v_code, extensions.gen_salt('bf', 12)), null, v_code_raw, now())
  on conflict (role) do update
    set code_hash = excluded.code_hash,
        pin_hash = null,
        display_code = excluded.display_code,
        updated_at = now();
  delete from public.workshop_sessions where role = v_target_role;
  return jsonb_build_object('ok', true, 'role', v_target_role, 'updatedAt', now());
end;
$$;

create or replace function public.workshop_get_admin_overview(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_codes jsonb;
  v_recent jsonb;
begin
  delete from public.workshop_sessions where expires_at < now();
  select role into v_role from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
  if v_role <> 'admin' then return jsonb_build_object('ok', false, 'message', '관리자만 접속 현황을 볼 수 있습니다.'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('role', role, 'displayCode', display_code, 'updatedAt', updated_at) order by case role when 'admin' then 1 when 'girlfriend' then 2 else 3 end), '[]'::jsonb) into v_codes from public.workshop_pins;
  select coalesce(jsonb_agg(jsonb_build_object('role', role, 'clientInfo', client_info, 'createdAt', created_at) order by created_at desc), '[]'::jsonb) into v_recent from (select role, client_info, created_at from public.workshop_access_logs order by created_at desc limit 30) recent;
  return jsonb_build_object('ok', true, 'codes', v_codes, 'recentAccess', v_recent);
end;
$$;

create or replace function public.workshop_add_photo(p_token text, p_item_id text, p_file_name text, p_mime_type text, p_data_url text, p_shared_with_family boolean default true, p_shared_with_girlfriend boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
  v_photo public.workshop_photos;
begin
  delete from public.workshop_sessions where expires_at < now();
  select role into v_role from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
  if v_role <> 'admin' then return jsonb_build_object('ok', false, 'message', '관리자만 사진을 업로드할 수 있습니다.'); end if;
  if p_item_id is null or length(trim(p_item_id)) < 1 or length(trim(p_item_id)) > 32 then return jsonb_build_object('ok', false, 'message', '장소 ID가 올바르지 않습니다.'); end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then return jsonb_build_object('ok', false, 'message', '지원하지 않는 이미지 형식입니다.'); end if;
  if p_data_url is null or p_data_url not like 'data:image/%;base64,%' or char_length(p_data_url) > 1600000 then return jsonb_build_object('ok', false, 'message', '사진 데이터가 너무 크거나 올바르지 않습니다.'); end if;
  insert into public.workshop_photos(item_id, file_name, mime_type, data_url, shared_with_family, shared_with_girlfriend) values (trim(p_item_id), left(coalesce(nullif(trim(p_file_name), ''), 'photo.jpg'), 180), p_mime_type, p_data_url, coalesce(p_shared_with_family, true), coalesce(p_shared_with_girlfriend, true)) returning * into v_photo;
  return jsonb_build_object('ok', true, 'photo', jsonb_build_object('id', v_photo.id, 'itemId', v_photo.item_id, 'fileName', v_photo.file_name, 'mimeType', v_photo.mime_type, 'dataUrl', v_photo.data_url, 'sharedWithFamily', v_photo.shared_with_family, 'sharedWithGirlfriend', v_photo.shared_with_girlfriend, 'createdAt', v_photo.created_at));
end;
$$;

create or replace function public.workshop_delete_photo(p_token text, p_photo_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_role text;
begin
  delete from public.workshop_sessions where expires_at < now();
  select role into v_role from public.workshop_sessions where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and expires_at > now();
  if v_role <> 'admin' then return jsonb_build_object('ok', false, 'message', '관리자만 사진을 삭제할 수 있습니다.'); end if;
  delete from public.workshop_photos where id = p_photo_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.workshop_normalize_code(text) from public;
revoke execute on function public.workshop_login(text, text) from public;
revoke execute on function public.workshop_logout(text) from public;
revoke execute on function public.workshop_get_state(text) from public;
revoke execute on function public.workshop_save_state(text, jsonb) from public;
revoke execute on function public.workshop_update_code(text, text, text) from public;
revoke execute on function public.workshop_get_admin_overview(text) from public;
revoke execute on function public.workshop_add_photo(text, text, text, text, text, boolean, boolean) from public;
revoke execute on function public.workshop_delete_photo(text, uuid) from public;
do $$ begin
  begin revoke execute on function public.workshop_update_pin(text, text, text) from public; exception when undefined_function then null; end;
  begin revoke execute on function public.workshop_login(text) from public; exception when undefined_function then null; end;
end $$;

grant usage on schema public to anon, authenticated;
grant execute on function public.workshop_login(text, text) to anon, authenticated;
grant execute on function public.workshop_logout(text) to anon, authenticated;
grant execute on function public.workshop_get_state(text) to anon, authenticated;
grant execute on function public.workshop_save_state(text, jsonb) to anon, authenticated;
grant execute on function public.workshop_update_code(text, text, text) to anon, authenticated;
grant execute on function public.workshop_get_admin_overview(text) to anon, authenticated;
grant execute on function public.workshop_add_photo(text, text, text, text, text, boolean, boolean) to anon, authenticated;
grant execute on function public.workshop_delete_photo(text, uuid) to anon, authenticated;
