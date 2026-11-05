-- 1) 회원 추가 정보 (재학생: 학교 / 교사: 근무 지역·어린이집 유형)
--    공개 여부(is_public)를 끄면 본인과 관리자만 볼 수 있다(RLS가 행 단위로 숨김).

create table public.profile_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  school text check (school is null or char_length(school) between 1 and 50),
  region text check (region is null or region in (
    '서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주')),
  center_type text check (center_type is null or center_type in (
    '국공립','사회복지법인','법인·단체등','민간','가정','협동','직장','기타')),
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.profile_details enable row level security;

create policy profile_details_read on public.profile_details for select to authenticated
  using (is_public or user_id = auth.uid() or public.is_admin());
create policy profile_details_insert_own on public.profile_details for insert to authenticated
  with check (user_id = auth.uid());
create policy profile_details_update_own on public.profile_details for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.profile_details from anon;
revoke update, insert on public.profile_details from authenticated;
grant insert (user_id, school, region, center_type, is_public) on public.profile_details to authenticated;
grant update (school, region, center_type, is_public, updated_at) on public.profile_details to authenticated;

-- 가입 트리거: 가입 때 입력한 정보도 함께 저장 (잘못된 값은 저장하지 않음)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  k text := case when m->>'kind' = 'teacher' then 'teacher' else 'student' end;
  v_school text := left(nullif(btrim(m->>'school'), ''), 50);
  v_region text := nullif(m->>'region', '');
  v_center text := nullif(m->>'center_type', '');
begin
  insert into public.profiles (id, nickname, kind)
  values (new.id, left(coalesce(nullif(trim(m->>'nickname'), ''), '익명'), 20), k);

  if v_region not in ('서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주') then
    v_region := null;
  end if;
  if v_center not in ('국공립','사회복지법인','법인·단체등','민간','가정','협동','직장','기타') then
    v_center := null;
  end if;

  insert into public.profile_details (user_id, school, region, center_type, is_public)
  values (
    new.id,
    case when k = 'student' then v_school end,
    case when k = 'teacher' then v_region end,
    case when k = 'teacher' then v_center end,
    coalesce((m->>'info_public')::boolean, true)
  );
  return new;
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- 기존 회원에게도 빈 정보 행 만들기
insert into public.profile_details (user_id) select id from public.profiles on conflict do nothing;

-- 관리자 회원 목록에 추가 정보 포함 (반환 형식이 바뀌므로 다시 만듦)
drop function public.admin_list_members();
create function public.admin_list_members()
returns table (
  id uuid, email text, nickname text, kind text, teacher_verified boolean, is_admin boolean,
  created_at timestamptz, last_sign_in_at timestamptz, post_count bigint, comment_count bigint,
  school text, region text, center_type text, info_public boolean
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select p.id, u.email::text, p.nickname, p.kind, p.teacher_verified, p.is_admin,
           p.created_at, u.last_sign_in_at,
           (select count(*) from public.posts po where po.author_id = p.id),
           (select count(*) from public.comments c where c.author_id = p.id),
           d.school, d.region, d.center_type, coalesce(d.is_public, true)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profile_details d on d.user_id = p.id
    order by p.created_at desc;
end $$;
revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;


-- 2) 회원 간 1:1 채팅 (수락제)
--    요청(멘트 포함) → 상대가 수락해야 메시지를 주고받을 수 있다. 대화는 두 사람만 볼 수 있다.

create table public.dm_threads (
  id bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  intro text not null check (char_length(intro) between 1 and 300),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  requester_read_at timestamptz not null default now(),
  recipient_read_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id)
);
-- 같은 두 사람 사이에는 대화방이 하나만 (거절된 경우 다시 요청할 수 없음 → 원치 않는 반복 요청 방지)
create unique index dm_threads_pair on public.dm_threads (least(requester_id, recipient_id), greatest(requester_id, recipient_id));
create index dm_threads_recipient on public.dm_threads (recipient_id, status);

create table public.dm_messages (
  id bigint generated always as identity primary key,
  thread_id bigint not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index dm_messages_thread on public.dm_messages (thread_id, created_at);

alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;

create policy dm_threads_read on public.dm_threads for select to authenticated
  using (auth.uid() in (requester_id, recipient_id));
create policy dm_threads_insert on public.dm_threads for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

create function public.is_dm_member(tid bigint, must_be_accepted boolean) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.dm_threads
    where id = tid and auth.uid() in (requester_id, recipient_id)
      and (not must_be_accepted or status = 'accepted')
  )
$$;

create policy dm_messages_read on public.dm_messages for select to authenticated
  using (public.is_dm_member(thread_id, false));
create policy dm_messages_insert on public.dm_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_dm_member(thread_id, true));

revoke all on public.dm_threads, public.dm_messages from anon;
revoke update, delete on public.dm_threads, public.dm_messages from authenticated;
revoke insert on public.dm_threads from authenticated;
grant insert (requester_id, recipient_id, intro) on public.dm_threads to authenticated;

-- 수락/거절: 받은 사람만, 대기 중인 요청만
create function public.respond_dm(tid bigint, accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_threads
     set status = case when accept then 'accepted' else 'declined' end,
         responded_at = now(), recipient_read_at = now()
   where id = tid and recipient_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'not allowed';
  end if;
end $$;

-- 읽음 처리
create function public.mark_dm_read(tid bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_threads set requester_read_at = now() where id = tid and requester_id = auth.uid();
  update public.dm_threads set recipient_read_at = now() where id = tid and recipient_id = auth.uid();
end $$;

-- 새 메시지 → 대화방 최근 시각 갱신
create function public.on_dm_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_threads
     set last_message_at = new.created_at,
         requester_read_at = case when requester_id = new.sender_id then new.created_at else requester_read_at end,
         recipient_read_at = case when recipient_id = new.sender_id then new.created_at else recipient_read_at end
   where id = new.thread_id;
  return new;
end $$;
create trigger dm_message_after_insert after insert on public.dm_messages
for each row execute function public.on_dm_message();

revoke execute on function public.is_dm_member(bigint, boolean), public.respond_dm(bigint, boolean),
  public.mark_dm_read(bigint) from public, anon;
grant execute on function public.is_dm_member(bigint, boolean), public.respond_dm(bigint, boolean),
  public.mark_dm_read(bigint) to authenticated;
revoke execute on function public.on_dm_message() from public, anon, authenticated;
