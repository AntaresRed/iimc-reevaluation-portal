-- ============================================================================
--  RESET — deletes every portal table, function and trigger.
--
--  ⚠️  Only for a fresh setup. This permanently deletes all requests, windows,
--      deactivations and faculty in the database. Question photos in Google
--      Drive are not touched, but nothing would point at them any more.
--
--  Then run 01_schema.sql and 02_seed.sql again.
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;

-- These take a table row as input, so they go before the tables do
drop function if exists public.can_see_request(public.requests) cascade;
drop function if exists public.window_state(public.windows) cascade;

drop table if exists public.request_history cascade;
drop table if exists public.question_photos cascade;
drop table if exists public.question_items  cascade;
drop table if exists public.requests        cascade;
drop table if exists public.blocks          cascade;
drop table if exists public.windows         cascade;
drop table if exists public.course_sections cascade;
drop table if exists public.faculty         cascade;
drop table if exists public.app_admins      cascade;
drop table if exists public.profiles        cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.requests_before_insert() cascade;
drop function if exists public.requests_after_insert() cascade;
drop function if exists public.requests_before_update() cascade;
drop function if exists public.requests_after_update() cascade;
drop function if exists public.blocks_before_write() cascade;
drop function if exists public.am_i_blocked() cascade;
drop function if exists public.is_blocked(text, text) cascade;
drop function if exists public.norm_reg_no(text) cascade;
drop function if exists public.my_role() cascade;
drop function if exists public.my_prof_name() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.current_email() cascade;
