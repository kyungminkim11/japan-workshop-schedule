-- Add visibility-aware memo entries and short video media support.
-- Applied to project jnciddblcndmthmmvqrz on 2026-06-17.

alter table public.workshop_photos drop constraint if exists workshop_photos_data_url_check;

alter table public.workshop_photos
  add constraint workshop_photos_data_url_check check (
    (data_url like 'data:image/%;base64,%' and char_length(data_url) <= 1600000)
    or
    (data_url like 'data:video/%;base64,%' and char_length(data_url) <= 6000000)
  );

update public.workshop_state
set data = jsonb_set(
  coalesce(data, '{}'::jsonb),
  '{memoEntries}',
  case when jsonb_typeof(data->'memoEntries') = 'array' then data->'memoEntries' else '[]'::jsonb end,
  true
)
where id = 'main';

-- NOTE: The live database also has updated versions of:
-- - public.workshop_get_state(p_token text)
-- - public.workshop_save_state(p_token text, p_data jsonb)
-- - public.workshop_add_photo(...)
--
-- They now preserve memoEntries, filter memoEntries by role, and allow short video data URLs.
-- Keep supabase/schema.sql in sync before using it to rebuild a fresh project.