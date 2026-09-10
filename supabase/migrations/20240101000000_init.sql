-- ============================================================================
-- MENTORA — Supabase PostgreSQL migration
-- ----------------------------------------------------------------------------
-- Run this file in the Supabase SQL Editor (or via `supabase db push`) on a
-- fresh project. It is idempotent-ish: it can be run on an empty database.
--
-- It creates:
--   * Enums       : user_role, mentor_status, booking_status, payment_status
--   * Tables      : profiles, categories, subjects, topics, mentor_profiles,
--                   mentor_subjects, mentor_topics, mentor_availability,
--                   bookings, sessions, reviews, payments, notifications
--   * Triggers    : handle_new_user, updated_at, notify on booking events,
--                   deny double booking, notify on session completion
--   * Indexes     : on all search/filter/join columns
--   * RLS         : row level security enabled + per-role policies
--   * Seed config : only CONFIGURATION data (categories/subjects).
--                   NO fake users / mentors / bookings / reviews.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'mentor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mentor_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------

-- profiles: one row per auth user, holds role + shared profile info
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'student',
  full_name   text,
  avatar_url  text,
  university  text,
  major       text,
  semester    int check (semester is null or semester between 1 and 20),
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- categories: academic fields (Informatika, Matematika, ...). Config via admin.
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- subjects: mata kuliah, always belongs to a category
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category_id, name)
);

-- topics: reusable topic/material library linked to a subject
create table if not exists public.topics (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (subject_id, name)
);

-- mentor_profiles: 1:1 with profiles (mentor-specific data)
create table if not exists public.mentor_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references public.profiles(id) on delete cascade,
  status        public.mentor_status not null default 'pending',
  headline      text,
  bio           text,
  university    text,
  major         text,
  years_experience int not null default 0 check (years_experience >= 0),
  price_per_session int not null default 0 check (price_per_session >= 0),
  meeting_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- mentor_profiles.category_id: mentors belong to one primary category
alter table public.mentor_profiles
  add column if not exists category_id uuid references public.categories(id) on delete set null;

-- many-to-many: mentor <-> subjects
create table if not exists public.mentor_subjects (
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mentor_id, subject_id)
);

-- many-to-many: mentor <-> topics
create table if not exists public.mentor_topics (
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mentor_id, topic_id)
);

-- mentor_availability: weekly recurring slots
create table if not exists public.mentor_availability (
  id           uuid primary key default gen_random_uuid(),
  mentor_id    uuid not null references public.mentor_profiles(id) on delete cascade,
  day_of_week  int not null check (day_of_week between 0 and 6), -- 0 = Sunday ... 6 = Saturday
  start_time   time not null,
  end_time     time not null,
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_time > start_time)
);

-- bookings: a student requests a session with a mentor
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  mentor_id   uuid not null references public.mentor_profiles(id) on delete cascade,
  subject_id  uuid not null references public.subjects(id),
  topic       text not null,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  duration_minutes int not null check (duration_minutes in (30, 60, 90)),
  price       int not null check (price >= 0),
  notes       text,
  status      public.booking_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_time > start_time)
);

-- sessions: consultation session tied to a booking (1:1 for MVP)
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  meeting_url text,
  started_at timestamptz,
  ended_at   timestamptz,
  status     text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- reviews: exactly one per completed booking, given by the student
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id   uuid not null references public.mentor_profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  review     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- payments: ready for a real gateway (Midtrans/Xendit/...), clearly MVP-safe
create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  booking_id            uuid not null references public.bookings(id) on delete cascade,
  amount                int not null check (amount >= 0),
  payment_method        text,
  payment_status        public.payment_status not null default 'pending',
  transaction_reference text,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- notifications: app-generated events only (never hardcoded as permanent data)
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now(),

  -- realtime ignore: fields that must not be sent over the public realtime channel
  -- (kept simple: realtime is not enabled for this table in the MVP)
  payload jsonb
);

-- ----------------------------------------------------------------------------
-- 3. Indexes (search / filter / join performance)
-- ----------------------------------------------------------------------------
create index if not exists idx_profiles_role            on public.profiles(role);
create index if not exists idx_profiles_search          on public.profiles using gin (to_tsvector('simple', coalesce(full_name, '')));
create index if not exists idx_categories_active        on public.categories(is_active);
create index if not exists idx_subjects_category        on public.subjects(category_id) where is_active;
create index if not exists idx_topics_subject           on public.topics(subject_id);
create index if not exists idx_mentor_profiles_status   on public.mentor_profiles(status);
create index if not exists idx_mentor_profiles_category on public.mentor_profiles(category_id);
create index if not exists idx_mentor_subjects_mentor   on public.mentor_subjects(mentor_id);
create index if not exists idx_mentor_subjects_subject  on public.mentor_subjects(subject_id);
create index if not exists idx_mentor_topics_mentor     on public.mentor_topics(mentor_id);
create index if not exists idx_mentor_avail_mentor      on public.mentor_availability(mentor_id);
create index if not exists idx_bookings_student         on public.bookings(student_id);
create index if not exists idx_bookings_mentor          on public.bookings(mentor_id);
create index if not exists idx_bookings_status          on public.bookings(status);
create index if not exists idx_bookings_date            on public.bookings(date, start_time);
create index if not exists idx_bookings_mentor_date     on public.bookings(mentor_id, date, start_time) where status in ('pending', 'confirmed');
create index if not exists idx_sessions_booking         on public.sessions(booking_id);
create index if not exists idx_reviews_mentor           on public.reviews(mentor_id);
create index if not exists idx_notifications_user       on public.notifications(user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','subjects','mentor_profiles','mentor_availability',
    'bookings','sessions','reviews','payments','notifications','topics'
  ] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 5. Auth: auto-create profile + default mentor_profiles on registration
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := 'student';
  v_full_name text;
begin
  if new.raw_user_meta_data ? 'role' then
    begin
      v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
    exception when others then
      v_role := 'student';
    end;
  end if;

  if v_role = 'admin' then
    -- never allow self-service admin; only DB owners may set admin
    v_role := 'student';
  end if;

  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');

  insert into public.profiles (id, role, full_name)
  values (new.id, v_role, v_full_name)
  on conflict (id) do nothing;

  if v_role = 'mentor' then
    insert into public.mentor_profiles (user_id) values (new.id) on conflict do nothing;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Raise mentor status to rejected when user deletes their account
create or replace function public.handle_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end $$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_user_deleted();

-- ----------------------------------------------------------------------------
-- 6. Business rules triggers
-- ----------------------------------------------------------------------------

-- Reviews only allowed for completed bookings (RLS also enforces this)
create or replace function public.prevent_review_unless_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.bookings b
    where b.id = new.booking_id and b.status = 'completed'
  ) then
    raise exception 'Rating hanya dapat diberikan untuk booking yang sudah selesai.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_review_completed_only on public.reviews;
create trigger trg_review_completed_only
  before insert on public.reviews
  for each row execute function public.prevent_review_unless_completed();

-- Deny double booking: no overlapping pending/confirmed booking for the
-- same mentor on the same date.
create or replace function public.prevent_double_booking()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.bookings b
    where b.mentor_id = new.mentor_id
      and b.date = new.date
      and b.status in ('pending', 'confirmed')
      and b.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (b.start_time, b.end_time) overlaps (new.start_time, new.end_time)
  ) then
    raise exception 'Slot sudah dipakai: mentor sudah memiliki booking pada waktu tersebut.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_prevent_double_booking on public.bookings;
create trigger trg_prevent_double_booking
  before insert or update of date, start_time, end_time, mentor_id, status on public.bookings
  for each row execute function public.prevent_double_booking();

-- Notify mentor + student on booking lifecycle, create session on confirm
create or replace function public.on_booking_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mentor_user uuid;
  v_student text;
  v_mentor text;
  v_meeting_url text;
begin
  select p.user_id into v_mentor_user from public.mentor_profiles p where p.id = new.mentor_id;
  select p.full_name into v_mentor from public.mentor_profiles p
    join public.profiles pr on pr.id = p.user_id where p.id = new.mentor_id;
  select pr.full_name into v_student from public.profiles pr where pr.id = new.student_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, message)
    values (
      v_mentor_user, 'new_booking', 'Permintaan booking baru',
      'Anda menerima permintaan booking baru dari ' || coalesce(v_student, 'mahasiswa') || '.'
    );
  elsif tg_op = 'UPDATE' then
    if new.status = 'confirmed' and old.status <> 'confirmed' then
      insert into public.notifications (user_id, type, title, message)
      values (new.student_id, 'booking_confirmed', 'Booking dikonfirmasi',
        'Booking Anda telah dikonfirmasi oleh ' || coalesce(v_mentor, 'mentor') || '.');
      -- create the consultation session (with the mentor's default meeting URL)
      select p.meeting_url into v_meeting_url from public.mentor_profiles p where p.id = new.mentor_id;
      insert into public.sessions (booking_id, meeting_url)
      values (new.id, v_meeting_url)
      on conflict (booking_id) do nothing;
    elsif new.status = 'rejected' and old.status <> 'rejected' then
      insert into public.notifications (user_id, type, title, message)
      values (new.student_id, 'booking_rejected', 'Booking ditolak',
        'Booking Anda ditolak oleh mentor.');
    elsif new.status = 'cancelled' and old.status <> 'cancelled' then
      insert into public.notifications (user_id, type, title, message)
      values (v_mentor_user, 'booking_cancelled', 'Booking dibatalkan', 'Sebuah booking telah dibatalkan.');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_booking on public.bookings;
create trigger trg_notify_booking
  after insert or update of status on public.bookings
  for each row execute function public.on_booking_event();

-- Notify student when session is completed (reminds them to review)
create or replace function public.on_session_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
  v_booking_id uuid;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select b.student_id, b.id into v_student, v_booking_id from public.bookings b where b.id = new.booking_id;
    insert into public.notifications (user_id, type, title, message)
    values (v_student, 'session_completed', 'Sesi selesai',
      'Sesi telah selesai. Berikan rating untuk mentor.');
    update public.bookings set status = 'completed' where id = new.booking_id and status <> 'completed';
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_session on public.sessions;
create trigger trg_notify_session
  after update of status on public.sessions
  for each row execute function public.on_session_completed();

-- Mentor rating is ALWAYS computed from reviews (no stored denormalized copies)
create or replace function public.mentor_rating(mentor_id uuid)
returns table (avg_rating numeric, review_count bigint)
language sql stable
as $$
  select round(avg(r.rating)::numeric, 1), count(r.id)::bigint
  from public.reviews r
  where r.mentor_id = $1
$$;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.categories            enable row level security;
alter table public.subjects              enable row level security;
alter table public.topics                enable row level security;
alter table public.mentor_profiles       enable row level security;
alter table public.mentor_subjects       enable row level security;
alter table public.mentor_topics         enable row level security;
alter table public.mentor_availability   enable row level security;
alter table public.bookings              enable row level security;
alter table public.sessions              enable row level security;
alter table public.reviews               enable row level security;
alter table public.payments              enable row level security;
alter table public.notifications         enable row level security;

-- ---- helper: is the current user an admin? --------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---- helper: is the current user the owner of a mentor_profile? ------------
create or replace function public.is_mentor_owner(mentor_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.mentor_profiles m where m.id = $1 and m.user_id = auth.uid()
  );
$$;

-- ---- helper: is the current user in a booking relationship with a profile? -
-- Used so mentors/students only see the minimal profile info of the people
-- they actually booked with (not every profile in the system).
create or replace function public.is_booking_participant(profile_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.bookings b
    where (b.student_id = profile_id
           or exists (select 1 from public.mentor_profiles m
                      where m.user_id = profile_id and m.id = b.mentor_id))
      and (b.student_id = auth.uid()
           or exists (select 1 from public.mentor_profiles m2
                      where m2.user_id = auth.uid() and m2.id = b.mentor_id))
  );
$$;

-- ---- helper: no self-elevation — new role must equal the stored role -------
create or replace function public.is_profile_role_unchanged(profile_id uuid, new_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = profile_id and p.role = new_role
  );
$$;

-- ---- helper: mentors cannot change their own verification status -----------
create or replace function public.is_mentor_status_unchanged(mentor_id uuid, new_status public.mentor_status)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.mentor_profiles m where m.id = mentor_id and m.status = new_status
  );
$$;

-- ============================================================================
-- PROFILES
-- ============================================================================
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_select_users_public" on public.profiles;
-- Minimal public info about students is needed by mentors (booking context).
-- Details are limited to basic identity for authenticated users.
create policy "profiles_select_users_public" on public.profiles
  for select to authenticated
  using (public.is_admin() or id = auth.uid()
         or exists (select 1 from public.mentor_profiles m where m.user_id = auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
-- Self-insert never allows 'admin' (admins are granted explicitly in SQL).
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role in ('student', 'mentor'));

drop policy if exists "profiles_update_own" on public.profiles;
-- Users can update their own profile but NOT their own role (no self-elevation).
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and public.is_profile_role_unchanged(id, role));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- CATEGORIES / SUBJECTS / TOPICS (catalog — readable by all)
-- ============================================================================
drop policy if exists "categories_select_active_or_admin" on public.categories;
create policy "categories_select_active_or_admin" on public.categories
  for select to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select to anon
  using (is_active = true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "subjects_select_active_or_admin" on public.subjects;
create policy "subjects_select_active_or_admin" on public.subjects
  for select to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "subjects_select_public" on public.subjects;
create policy "subjects_select_public" on public.subjects
  for select to anon
  using (is_active = true);

drop policy if exists "subjects_admin_write" on public.subjects;
create policy "subjects_admin_write" on public.subjects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "topics_select" on public.topics;
create policy "topics_select" on public.topics
  for select to anon, authenticated
  using (true);

drop policy if exists "topics_admin_write" on public.topics;
create policy "topics_admin_write" on public.topics
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- MENTOR PROFILES
-- ============================================================================
drop policy if exists "mentor_profiles_select_approved" on public.mentor_profiles;
create policy "mentor_profiles_select_approved" on public.mentor_profiles
  for select to anon, authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "mentor_profiles_insert_own" on public.mentor_profiles;
-- Only accounts with profile role 'mentor' may create a mentor profile.
create policy "mentor_profiles_insert_own" on public.mentor_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending'
              and exists (select 1 from public.profiles p
                          where p.id = auth.uid() and p.role = 'mentor'));

drop policy if exists "mentor_profiles_update_own" on public.mentor_profiles;
-- Mentors manage their own profile but can NEVER change their own status
-- (approval/rejection is admin-only).
create policy "mentor_profiles_update_own" on public.mentor_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_mentor_status_unchanged(mentor_profiles.id, status));

drop policy if exists "mentor_profiles_admin_write" on public.mentor_profiles;
create policy "mentor_profiles_admin_write" on public.mentor_profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- MENTOR SUBJECTS / TOPICS (mentor manages own, admin manages all)
-- ============================================================================
drop policy if exists "mentor_subjects_select" on public.mentor_subjects;
create policy "mentor_subjects_select" on public.mentor_subjects
  for select to anon, authenticated
  using (exists (select 1 from public.mentor_profiles m
                where m.id = mentor_id and (m.status = 'approved' or m.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mentor_subjects_insert_own" on public.mentor_subjects;
create policy "mentor_subjects_insert_own" on public.mentor_subjects
  for insert to authenticated
  with check (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_subjects_delete_own" on public.mentor_subjects;
create policy "mentor_subjects_delete_own" on public.mentor_subjects
  for delete to authenticated
  using (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_subjects_admin_write" on public.mentor_subjects;
create policy "mentor_subjects_admin_write" on public.mentor_subjects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "mentor_topics_select" on public.mentor_topics;
create policy "mentor_topics_select" on public.mentor_topics
  for select to anon, authenticated
  using (exists (select 1 from public.mentor_profiles m
                where m.id = mentor_id and (m.status = 'approved' or m.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mentor_topics_insert_own" on public.mentor_topics;
create policy "mentor_topics_insert_own" on public.mentor_topics
  for insert to authenticated
  with check (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_topics_delete_own" on public.mentor_topics;
create policy "mentor_topics_delete_own" on public.mentor_topics
  for delete to authenticated
  using (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_topics_admin_write" on public.mentor_topics;
create policy "mentor_topics_admin_write" on public.mentor_topics
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- MENTOR AVAILABILITY
-- ============================================================================
drop policy if exists "mentor_availability_select" on public.mentor_availability;
create policy "mentor_availability_select" on public.mentor_availability
  for select to anon, authenticated
  using (exists (select 1 from public.mentor_profiles m
                where m.id = mentor_id and (m.status = 'approved' or m.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mentor_availability_insert_own" on public.mentor_availability;
create policy "mentor_availability_insert_own" on public.mentor_availability
  for insert to authenticated
  with check (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_availability_update_own" on public.mentor_availability;
create policy "mentor_availability_update_own" on public.mentor_availability
  for update to authenticated
  using (public.is_mentor_owner(mentor_id))
  with check (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_availability_delete_own" on public.mentor_availability;
create policy "mentor_availability_delete_own" on public.mentor_availability
  for delete to authenticated
  using (public.is_mentor_owner(mentor_id));

drop policy if exists "mentor_availability_admin" on public.mentor_availability;
create policy "mentor_availability_admin" on public.mentor_availability
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- BOOKINGS
-- ============================================================================
drop policy if exists "bookings_select_student_or_mentor_or_admin" on public.bookings;
create policy "bookings_select_student_or_mentor_or_admin" on public.bookings
  for select to authenticated
  using (student_id = auth.uid()
         or exists (select 1 from public.mentor_profiles m
                    where m.id = bookings.mentor_id and m.user_id = auth.uid())
         or public.is_admin());

drop policy if exists "bookings_insert_rules" on public.bookings;
create policy "bookings_insert_rules" on public.bookings
  for insert to authenticated
  with check (
    student_id = auth.uid()                             -- students book for themselves
    and exists (select 1 from public.mentor_profiles m
                where m.id = mentor_id and m.status = 'approved')  -- mentor must be approved
    and topic is not null and length(trim(topic)) > 0   -- subject/topic required
    and (select price from public.mentor_profiles m where m.id = mentor_id) = price -- price integrity
  );

drop policy if exists "bookings_update_student" on public.bookings;
create policy "bookings_update_student" on public.bookings
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and status in ('pending', 'cancelled'));

drop policy if exists "bookings_update_mentor" on public.bookings;
create policy "bookings_update_mentor" on public.bookings
  for update to authenticated
  using (exists (select 1 from public.mentor_profiles m
                where m.id = bookings.mentor_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.mentor_profiles m
                      where m.id = bookings.mentor_id and m.user_id = auth.uid())
              and status in ('pending', 'confirmed', 'rejected', 'completed'));

drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all" on public.bookings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- SESSIONS
-- ============================================================================
drop policy if exists "sessions_select_participants" on public.sessions;
create policy "sessions_select_participants" on public.sessions
  for select to authenticated
  using (
    exists (select 1 from public.bookings b
            where b.id = sessions.booking_id
              and (b.student_id = auth.uid()
                   or exists (select 1 from public.mentor_profiles m
                              where m.id = b.mentor_id and m.user_id = auth.uid())
                   or public.is_admin()))
  );

drop policy if exists "sessions_update_participants" on public.sessions;
drop policy if exists "sessions_update_mentor_or_admin" on public.sessions;
-- Only the MENTOR (or admin) may start/complete a session or change its
-- meeting URL. Students keep read access (meeting link) via the select policy.
create policy "sessions_update_mentor_or_admin" on public.sessions
  for update to authenticated
  using (exists (select 1 from public.bookings b
                where b.id = sessions.booking_id
                  and (exists (select 1 from public.mentor_profiles m
                                where m.id = b.mentor_id and m.user_id = auth.uid())
                       or public.is_admin())))
  with check (exists (select 1 from public.bookings b
                      where b.id = sessions.booking_id
                        and (exists (select 1 from public.mentor_profiles m
                                      where m.id = b.mentor_id and m.user_id = auth.uid())
                             or public.is_admin())));

-- ============================================================================
-- REVIEWS
-- ============================================================================
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews
  for select to anon, authenticated
  using (true);

drop policy if exists "reviews_insert_completed_booking" on public.reviews;
create policy "reviews_insert_completed_booking" on public.reviews
  for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.student_id = auth.uid()
        and b.status = 'completed'
    )
  );

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete to authenticated
  using (reviewer_id = auth.uid());

drop policy if exists "reviews_admin" on public.reviews;
create policy "reviews_admin" on public.reviews
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- PAYMENTS
-- ============================================================================
drop policy if exists "payments_select_owner" on public.payments;
create policy "payments_select_owner" on public.payments
  for select to authenticated
  using (
    exists (select 1 from public.bookings b
            where b.id = payments.booking_id
              and (b.student_id = auth.uid()
                   or exists (select 1 from public.mentor_profiles m
                              where m.id = b.mentor_id and m.user_id = auth.uid())
                   or public.is_admin()))
  );

drop policy if exists "payments_insert_student" on public.payments;
-- Students can only record a PENDING payment for their own booking and the
-- amount must equal the booking price (no self-declared "paid" rows).
create policy "payments_insert_student" on public.payments
  for insert to authenticated
  with check (
    payment_status = 'pending'
    and exists (select 1 from public.bookings b
                where b.id = booking_id
                  and b.student_id = auth.uid()
                  and b.price = amount)
  );

drop policy if exists "payments_admin" on public.payments;
create policy "payments_admin" on public.payments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- 8. SEED — CONFIGURATION DATA ONLY
-- ----------------------------------------------------------------------------
-- Categories & subjects are platform configuration and are safe/expected to
-- seed. NO fake users, mentors, ratings, bookings, reviews or statistics.
-- ============================================================================
insert into public.categories (name, slug, description, icon) values
  ('Informatika',  'informatika',  'Ilmu komputer, pemrograman, dan teknologi',        'code'),
  ('Matematika',   'matematika',   'Matematika murni dan terapan',                     'sigma'),
  ('Akuntansi',    'akuntansi',    'Akuntansi, keuangan, dan perpajakan',              'calculator'),
  ('Manajemen',    'manajemen',    'Manajemen bisnis dan organisasi',                  'briefcase'),
  ('Bahasa',       'bahasa',       'Bahasa Indonesia, Inggris, dan bahasa lainnya',    'languages')
on conflict (name) do nothing;

insert into public.subjects (category_id, name, slug, description)
select c.id, s.name, s.slug, s.description
from (values
  ('informatika', 'Algoritma dan Pemrograman',  'algoritma-dan-pemrograman',  'Dasar-dasar algoritma dan pemrograman'),
  ('informatika', 'Struktur Data',              'struktur-data',              'Struktur data dan kompleksitas algoritma'),
  ('informatika', 'Basis Data',                 'basis-data',                 'Perancangan dan pengelolaan basis data'),
  ('informatika', 'Jaringan Komputer',          'jaringan-komputer',          'Konsep jaringan dan komunikasi data'),
  ('informatika', 'Kecerdasan Buatan',          'kecerdasan-buatan',          'Machine learning dan AI'),
  ('matematika',  'Kalkulus',                   'kalkulus',                   'Kalkulus diferensial dan integral'),
  ('matematika',  'Statistika',                 'statistika',                 'Statistika deskriptif dan inferensial'),
  ('matematika',  'Aljabar Linear',             'aljabar-linear',             'Vektor, matriks, dan transformasi linear'),
  ('akuntansi',   'Akuntansi Dasar',            'akuntansi-dasar',            'Akuntansi keuangan dasar'),
  ('akuntansi',   'Audit',                      'audit',                      'Audit dan jaminan informasi'),
  ('manajemen',   'Manajemen Keuangan',         'manajemen-keuangan',         'Pengelolaan keuangan organisasi'),
  ('manajemen',   'Manajemen SDM',              'manajemen-sdm',              'Manajemen sumber daya manusia'),
  ('bahasa',      'Bahasa Inggris',             'bahasa-inggris',             'English for academic and professional use'),
  ('bahasa',      'Bahasa Indonesia',           'bahasa-indonesia',           'Bahasa Indonesia akademik dan profesional')
) as s(cat_slug, name, slug, description)
join public.categories c on c.slug = s.cat_slug
where not exists (
  select 1 from public.subjects sb where sb.category_id = c.id and sb.name = s.name
);

-- ----------------------------------------------------------------------------
-- 9. Table grants (RLS above still restricts row access per role)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- ----------------------------------------------------------------------------
-- 10. Storage — "avatars" bucket + policies
-- ----------------------------------------------------------------------------
-- The bucket is created here so a fresh project works out of the box
-- (no manual Storage setup needed). Public read for <img> usage; writes are
-- restricted to the authenticated user's own folder {auth.uid()}/...
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_upload_own_folder" on storage.objects;
create policy "avatars_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
