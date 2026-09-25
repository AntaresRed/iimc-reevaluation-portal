-- ============================================================================
--  IIM Calcutta Re-Evaluation Portal — database schema
--  Run this once in the Supabase SQL editor, then 02_seed.sql.
--
--  The browser talks to this database directly with the public anon key, so
--  every rule lives here: row level security decides what each signed-in person
--  may read or change, and triggers enforce the things policies can't express
--  (window open, section belongs to the window, student not deactivated).
-- ============================================================================

-- ----------------------------------------------------------------- who is who
-- One row per signed-in person. Roles are NOT stored here: they are looked up
-- live from app_admins / faculty, so adding a professor takes effect at once.
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null unique,
  full_name   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.app_admins (
  email       text primary key,
  note        text,
  added_at    timestamptz not null default now()
);

create table if not exists public.faculty (
  email       text primary key,
  name        text not null unique,
  added_by    text,
  added_at    timestamptz not null default now()
);

-- Which professor marks which section of which subject.
-- A co-taught section simply has more than one row (e.g. Morphologies of the Social).
create table if not exists public.course_sections (
  subject         text not null,
  section         text not null check (section in ('A','B','C','D','E','F')),
  professor_name  text not null references public.faculty(name) on update cascade,
  primary key (subject, section, professor_name)
);

-- --------------------------------------------------------------- the helpers
create or replace function public.current_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins a where a.email = public.current_email());
$$;

-- The professor's canonical name, or null if the caller isn't faculty
create or replace function public.my_prof_name()
returns text language sql stable security definer set search_path = public as $$
  select f.name from public.faculty f where f.email = public.current_email();
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select case
    when public.is_admin() then 'admin'
    when public.my_prof_name() is not null then 'professor'
    else 'student'
  end;
$$;

-- "MBA/0042/62", " mba / 42 / 62 " and "MBA/042/62" all become "MBA/42/62"
create or replace function public.norm_reg_no(value text)
returns text language sql immutable as $$
  select regexp_replace(upper(regexp_replace(coalesce(value, ''), '\s', '', 'g')), '/0+(\d)', '/\1', 'g');
$$;

-- ------------------------------------------------------- re-evaluation windows
create table if not exists public.windows (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  course_code  text default '',
  exam_type    text not null,
  sections     text[] not null default '{}',
  professor    text default '',            -- used only when sections is empty
  term         text not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  closed_at    timestamptz,
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_by   text,
  updated_at   timestamptz,
  constraint window_closes_after_opening check (ends_at > starts_at),
  constraint window_needs_a_professor check (array_length(sections, 1) is not null or professor <> '')
);

create or replace function public.window_state(w public.windows)
returns text language sql stable as $$
  select case
    when w.closed_at is not null and w.closed_at <= now() then 'closed'
    when now() < w.starts_at then 'scheduled'
    when now() >= w.ends_at then 'closed'
    else 'open'
  end;
$$;

-- ------------------------------------------------------ deactivated students
-- Matched on email AND registration number, so switching one doesn't get around it.
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  emails      text[] not null default '{}',
  reg_nos     text[] not null default '{}',
  name        text,
  reason      text not null check (length(reason) >= 5),
  blocked_by  text,
  blocked_at  timestamptz not null default now(),
  lifted_at   timestamptz,
  lifted_by   text,
  lift_note   text
);

create or replace function public.is_blocked(p_email text, p_reg_no text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks b
    where b.lifted_at is null
      and (lower(coalesce(p_email, '')) = any (b.emails)
        or (coalesce(p_reg_no, '') <> '' and public.norm_reg_no(p_reg_no) = any (b.reg_nos)))
  );
$$;

-- A student may ask whether they themselves are deactivated, but not why
create or replace function public.am_i_blocked()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_blocked(public.current_email(), null);
$$;

-- -------------------------------------------------------------- the requests
create table if not exists public.requests (
  id                uuid primary key default gen_random_uuid(),
  window_id         uuid not null references public.windows(id) on delete restrict,
  student_id        uuid not null references public.profiles(id) on delete restrict,
  student_email     text not null,
  student_name      text not null,
  reg_no            text not null,
  section           text default '',
  -- every professor who may see and decide this request (two for a co-taught section)
  professor_names   text[] not null check (array_length(professor_names, 1) is not null),
  -- copied from the window when the request is created, so later edits can't rewrite history
  subject           text not null,
  course_code       text default '',
  exam_type         text not null,
  term              text not null,
  status            text not null default 'Pending'
                    check (status in ('Pending','Under Review','Resolved - Marks Increased',
                                      'Resolved - Marks Decreased','Resolved - No Change')),
  -- one entry per question: {question, original, max, updated, remark}; the two text
  -- columns below are generated from it ("Q2: 6/10, Q4: 10/15")
  question_marks    jsonb,
  original_marks    text,
  updated_marks     text,
  professor_remarks text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  unique (window_id, student_id)          -- one request per student per window
);

-- Added after the first release; brings an existing database up to date
alter table public.requests add column if not exists original_marks text;
alter table public.requests add column if not exists question_marks jsonb;

create table if not exists public.question_items (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  position    int not null,
  question    text not null,
  reason      text not null,
  unique (request_id, position)
);

-- One row per photo; the file itself lives in Google Drive
create table if not exists public.question_photos (
  id                uuid primary key default gen_random_uuid(),
  question_item_id  uuid not null references public.question_items(id) on delete cascade,
  position          int not null,
  file_name         text not null,
  drive_id          text,
  created_at        timestamptz not null default now(),
  unique (question_item_id, position)
);

create table if not exists public.request_history (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  at          timestamptz not null default now(),
  event       text not null,
  by_email    text,
  from_status text,
  to_status   text,
  note        text
);

-- Can the caller see this request at all?
create or replace function public.can_see_request(r public.requests)
returns boolean language sql stable security definer set search_path = public as $$
  select r.student_id = auth.uid()
      or public.my_prof_name() = any (r.professor_names)
      or public.is_admin();
$$;

-- ------------------------------------------------- rules that policies can't express
-- Everything a student sends is checked here: the window must be open, the section
-- must belong to it, and they must not be deactivated. Exam details are copied from
-- the window so the browser can't choose them.
create or replace function public.requests_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  w public.windows;
  state text;
  profs text[];
begin
  select * into w from public.windows where id = new.window_id;
  if not found then
    raise exception 'This re-evaluation window no longer exists.';
  end if;

  state := public.window_state(w);
  if state <> 'open' then
    raise exception '%', case when state = 'scheduled'
      then 'This re-evaluation window has not opened yet.'
      else 'This re-evaluation window has closed.' end;
  end if;

  new.student_id    := auth.uid();
  new.student_email := public.current_email();

  if public.is_blocked(new.student_email, new.reg_no) then
    raise exception 'Re-evaluation has been deactivated for your account. Please contact the MBA office.';
  end if;

  if array_length(w.sections, 1) is not null then
    if new.section is null or not (new.section = any (w.sections)) then
      raise exception 'Section % is not part of this re-evaluation window.', coalesce(new.section, '—');
    end if;
    -- Everyone who teaches this section — one professor, or both for a co-taught course
    select array_agg(cs.professor_name order by cs.professor_name) into profs
      from public.course_sections cs
     where cs.subject = w.subject and cs.section = new.section;
    if profs is null then
      raise exception 'No professor is assigned to % for section %.', w.subject, new.section;
    end if;
  else
    new.section := '';
    profs := array[w.professor];
  end if;

  new.professor_names := profs;
  new.subject     := w.subject;
  new.course_code := w.course_code;
  new.exam_type   := w.exam_type;
  new.term        := w.term;
  new.status      := 'Pending';
  new.question_marks := null;
  new.original_marks := null;
  new.updated_marks := null;
  new.professor_remarks := null;
  new.reviewed_at := null;
  new.created_at  := now();
  return new;
end;
$$;

create or replace function public.requests_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.request_history (request_id, event, by_email, note)
  values (new.id, 'Submitted', new.student_email, '');
  return new;
end;
$$;

-- Only a professor of the request may record a decision (admins can see it but not change it),
-- and only the decision fields may change.
create or replace function public.requests_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not (public.my_prof_name() = any (old.professor_names)) then
    raise exception 'Only a professor for this request can record a decision.';
  end if;
  if new.window_id <> old.window_id or new.student_id <> old.student_id
     or new.subject <> old.subject or new.exam_type <> old.exam_type
     or new.term <> old.term or new.section is distinct from old.section
     or new.professor_names <> old.professor_names or new.reg_no <> old.reg_no then
    raise exception 'Only the marks, remarks and status of a request can change.';
  end if;
  -- Marks for every question, as numbers of 0 or more, never above "out of"
  if jsonb_typeof(new.question_marks) is distinct from 'array'
     or jsonb_array_length(new.question_marks)
        <> (select count(*) from public.question_items qi where qi.request_id = new.id) then
    raise exception 'Enter the marks for every question.';
  end if;
  if exists (select 1 from jsonb_array_elements(new.question_marks) q
              where jsonb_typeof(q -> 'original') is distinct from 'number'
                 or (q ->> 'original')::numeric < 0
                 or (jsonb_typeof(q -> 'updated') = 'number' and (q ->> 'updated')::numeric < 0)
                 or (jsonb_typeof(q -> 'max') = 'number' and ((q ->> 'original')::numeric > (q ->> 'max')::numeric
                     or (jsonb_typeof(q -> 'updated') = 'number' and (q ->> 'updated')::numeric > (q ->> 'max')::numeric)))) then
    raise exception 'Original marks are required for every question, and no mark can be negative or above its maximum.';
  end if;
  -- A final decision needs every updated mark, and its status follows from the totals
  if new.status like 'Resolved%' then
    if exists (select 1 from jsonb_array_elements(new.question_marks) q
                where jsonb_typeof(q -> 'updated') is distinct from 'number') then
      raise exception 'Updated marks are required for every question before a final decision.';
    end if;
    select case sign(sum((q ->> 'updated')::numeric) - sum((q ->> 'original')::numeric))
             when 1 then 'Resolved - Marks Increased'
             when -1 then 'Resolved - Marks Decreased'
             else 'Resolved - No Change' end
      into new.status
      from jsonb_array_elements(new.question_marks) q;
  end if;
  new.original_marks := (select string_agg((q ->> 'question') || ': ' || (q ->> 'original')
                                  || coalesce('/' || (q ->> 'max'), ''), ', ' order by n)
                           from jsonb_array_elements(new.question_marks) with ordinality as e(q, n));
  new.updated_marks := case when exists (select 1 from jsonb_array_elements(new.question_marks) q
                                           where jsonb_typeof(q -> 'updated') is distinct from 'number')
                            then null
                            else (select string_agg((q ->> 'question') || ': ' || (q ->> 'updated')
                                         || coalesce('/' || (q ->> 'max'), ''), ', ' order by n)
                                    from jsonb_array_elements(new.question_marks) with ordinality as e(q, n)) end;
  if coalesce(new.professor_remarks, '') = '' then
    raise exception 'Remarks are required.';
  end if;
  new.reviewed_at := now();
  return new;
end;
$$;

create or replace function public.requests_after_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.request_history (request_id, event, by_email, from_status, to_status, note)
  values (new.id,
          case when old.status = new.status then 'Remarks updated' else 'Status changed' end,
          public.current_email(), old.status, new.status, new.professor_remarks);
  return new;
end;
$$;

drop trigger if exists requests_before_insert on public.requests;
create trigger requests_before_insert before insert on public.requests
  for each row execute function public.requests_before_insert();

drop trigger if exists requests_after_insert on public.requests;
create trigger requests_after_insert after insert on public.requests
  for each row execute function public.requests_after_insert();

drop trigger if exists requests_before_update on public.requests;
create trigger requests_before_update before update on public.requests
  for each row execute function public.requests_before_update();

drop trigger if exists requests_after_update on public.requests;
create trigger requests_after_update after update on public.requests
  for each row execute function public.requests_after_update();

-- ------------------------------------------- a profile for every new sign-in
-- Also the domain gate: only @email.iimcal.ac.in accounts can exist at all.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) not like '%@email.iimcal.ac.in' then
    raise exception 'Only @email.iimcal.ac.in accounts can use this portal.';
  end if;
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  Row level security — nothing is readable or writable without a policy
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.app_admins      enable row level security;
alter table public.faculty         enable row level security;
alter table public.course_sections enable row level security;
alter table public.windows         enable row level security;
alter table public.requests        enable row level security;
alter table public.question_items  enable row level security;
alter table public.question_photos enable row level security;
alter table public.request_history enable row level security;
alter table public.blocks          enable row level security;

-- profiles: your own, plus everything for admins
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- the faculty directory and course mapping are readable by anyone signed in
drop policy if exists faculty_select on public.faculty;
create policy faculty_select on public.faculty for select to authenticated using (true);

drop policy if exists faculty_write on public.faculty;
create policy faculty_write on public.faculty for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_sections_select on public.course_sections;
create policy course_sections_select on public.course_sections for select to authenticated using (true);

drop policy if exists course_sections_write on public.course_sections;
create policy course_sections_write on public.course_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- the admin list is visible only to admins
drop policy if exists app_admins_select on public.app_admins;
create policy app_admins_select on public.app_admins for select to authenticated
  using (public.is_admin());

-- windows: everyone signed in sees them; only admins create or change them
drop policy if exists windows_select on public.windows;
create policy windows_select on public.windows for select to authenticated using (true);

drop policy if exists windows_insert on public.windows;
create policy windows_insert on public.windows for insert to authenticated
  with check (public.is_admin());

drop policy if exists windows_update on public.windows;
create policy windows_update on public.windows for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- requests: your own, your students', or everything for admins
drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests for select to authenticated
  using (student_id = auth.uid() or public.my_prof_name() = any (professor_names) or public.is_admin());

drop policy if exists requests_insert on public.requests;
create policy requests_insert on public.requests for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists requests_update on public.requests;
create policy requests_update on public.requests for update to authenticated
  using (public.my_prof_name() = any (professor_names))
  with check (public.my_prof_name() = any (professor_names));

-- questions and photos follow whatever the parent request allows
drop policy if exists question_items_select on public.question_items;
create policy question_items_select on public.question_items for select to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id and public.can_see_request(r)));

drop policy if exists question_items_insert on public.question_items;
create policy question_items_insert on public.question_items for insert to authenticated
  with check (exists (select 1 from public.requests r where r.id = request_id and r.student_id = auth.uid()));

drop policy if exists question_photos_select on public.question_photos;
create policy question_photos_select on public.question_photos for select to authenticated
  using (exists (
    select 1 from public.question_items qi join public.requests r on r.id = qi.request_id
     where qi.id = question_item_id and public.can_see_request(r)));

drop policy if exists question_photos_insert on public.question_photos;
create policy question_photos_insert on public.question_photos for insert to authenticated
  with check (exists (
    select 1 from public.question_items qi join public.requests r on r.id = qi.request_id
     where qi.id = question_item_id and r.student_id = auth.uid()));

-- history is readable with the request, and only ever written by the triggers
drop policy if exists request_history_select on public.request_history;
create policy request_history_select on public.request_history for select to authenticated
  using (exists (select 1 from public.requests r where r.id = request_id and public.can_see_request(r)));

-- deactivations: only the office sees the list and the reasons
drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks for select to authenticated using (public.is_admin());

drop policy if exists blocks_insert on public.blocks;
create policy blocks_insert on public.blocks for insert to authenticated with check (public.is_admin());

drop policy if exists blocks_update on public.blocks;
create policy blocks_update on public.blocks for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------- deactivations are normalised
-- Emails lowercased and registration numbers put in one shape, so a block still
-- matches when the student types "mba/42/62" instead of "MBA/0042/62". Any other
-- email or reg. no. that student has used before is pulled in too.
create or replace function public.blocks_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  extra_emails text[];
  extra_regs   text[];
begin
  new.emails  := coalesce((select array_agg(distinct lower(e)) from unnest(new.emails) e where e <> ''), '{}');
  new.reg_nos := coalesce((select array_agg(distinct public.norm_reg_no(r)) from unnest(new.reg_nos) r where r <> ''), '{}');

  select coalesce(array_agg(distinct lower(r.student_email)), '{}'),
         coalesce(array_agg(distinct public.norm_reg_no(r.reg_no)) filter (where r.reg_no <> ''), '{}')
    into extra_emails, extra_regs
    from public.requests r
   where lower(r.student_email) = any (new.emails)
      or public.norm_reg_no(r.reg_no) = any (new.reg_nos);

  new.emails  := (select coalesce(array_agg(distinct x), '{}') from unnest(new.emails || extra_emails) x);
  new.reg_nos := (select coalesce(array_agg(distinct x), '{}') from unnest(new.reg_nos || extra_regs) x);
  return new;
end;
$$;

drop trigger if exists blocks_before_write on public.blocks;
create trigger blocks_before_write before insert or update on public.blocks
  for each row execute function public.blocks_before_write();
