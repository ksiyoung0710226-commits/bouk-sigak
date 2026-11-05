-- 보육시각 초기 스키마
-- 원칙: 로그인하지 않은 사람(anon)은 커뮤니티/교사 노하우 데이터를 전혀 읽을 수 없다.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  kind text not null check (kind in ('student','teacher')),
  teacher_verified boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 교사 초대코드 (아무 정책도 없어 클라이언트에서 직접 읽을 수 없음)
create table public.app_secrets (
  key text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;

create table public.posts (
  id bigint generated always as identity primary key,
  board text not null check (board in ('community','tips')),
  category text not null,
  title text not null check (char_length(title) between 1 and 100),
  body text not null check (char_length(body) between 1 and 5000),
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index posts_board_created on public.posts (board, created_at desc);

create table public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index comments_post on public.comments (post_id, created_at);

create table public.reports (
  id bigint generated always as identity primary key,
  post_id bigint references public.posts(id) on delete cascade,
  comment_id bigint references public.comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  check ((post_id is not null) <> (comment_id is not null))
);

-- 관리자/교사 확인 헬퍼 (RLS 재귀 방지를 위해 security definer)
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create function public.can_write_tips() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin or (kind = 'teacher' and teacher_verified)
                   from public.profiles where id = auth.uid()), false)
$$;

-- 가입 시 프로필 자동 생성 (kind는 student/teacher만 허용, 그 외는 student)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, kind)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'nickname'), ''), '익명'), 20),
    case when new.raw_user_meta_data->>'kind' = 'teacher' then 'teacher' else 'student' end
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 교사 초대코드 입력 → teacher_verified
create function public.redeem_teacher_code(code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if auth.uid() is null then return false; end if;
  select exists (select 1 from public.app_secrets where key = 'teacher_code' and value = trim(code)) into ok;
  if ok then
    update public.profiles set teacher_verified = true where id = auth.uid() and kind = 'teacher';
    return found;
  end if;
  return false;
end $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy posts_read on public.posts for select to authenticated using (true);
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (board = 'community' or public.can_write_tips()));
create policy posts_delete on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy reports_read on public.reports for select to authenticated
  using (public.is_admin());
create policy reports_delete on public.reports for delete to authenticated
  using (public.is_admin());

-- 권한: anon은 아무것도 못 하게, 일반 회원은 필요한 컬럼만 수정 가능
revoke all on public.profiles, public.posts, public.comments, public.reports, public.app_secrets from anon;
revoke all on public.app_secrets from authenticated;
revoke update on public.profiles from authenticated;
grant update (nickname) on public.profiles to authenticated;
revoke execute on function public.redeem_teacher_code(text) from anon, public;
grant execute on function public.redeem_teacher_code(text) to authenticated;
revoke execute on function public.is_admin(), public.can_write_tips() from anon, public;
grant execute on function public.is_admin(), public.can_write_tips() to authenticated;
