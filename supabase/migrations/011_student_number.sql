-- 재학생 학번 (선택 입력). 공개 여부와 상관없이 본인과 관리자만 볼 수 있도록 별도 표에 보관.

create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  student_no text check (student_no is null or student_no ~ '^[0-9A-Za-z-]{4,20}$'),
  updated_at timestamptz not null default now()
);
alter table public.profile_private enable row level security;

create policy profile_private_read on public.profile_private for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy profile_private_insert_own on public.profile_private for insert to authenticated
  with check (user_id = auth.uid());
create policy profile_private_update_own on public.profile_private for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.profile_private from anon;
revoke insert, update, delete on public.profile_private from authenticated;
grant insert (user_id, student_no) on public.profile_private to authenticated;
grant update (student_no, updated_at) on public.profile_private to authenticated;

-- 가입 트리거: 학번도 저장 (재학생 + 형식에 맞을 때만)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  k text := case when m->>'kind' = 'teacher' then 'teacher' else 'student' end;
  v_school text := left(nullif(btrim(m->>'school'), ''), 50);
  v_major text := left(nullif(btrim(m->>'major'), ''), 50);
  v_region text := nullif(m->>'region', '');
  v_center text := nullif(m->>'center_type', '');
  v_no text := nullif(btrim(m->>'student_no'), '');
begin
  insert into public.profiles (id, nickname, kind)
  values (new.id, left(coalesce(nullif(trim(m->>'nickname'), ''), '익명'), 20), k);

  if v_region not in ('서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주') then
    v_region := null;
  end if;
  if v_center not in ('국공립','사회복지법인','법인·단체등','민간','가정','협동','직장','기타') then
    v_center := null;
  end if;
  if k <> 'student' or v_no !~ '^[0-9A-Za-z-]{4,20}$' then
    v_no := null;
  end if;

  insert into public.profile_details (user_id, school, major, region, center_type, is_public)
  values (
    new.id,
    case when k = 'student' then v_school end,
    case when k = 'student' then v_major end,
    case when k = 'teacher' then v_region end,
    case when k = 'teacher' then v_center end,
    coalesce((m->>'info_public')::boolean, true)
  );
  insert into public.profile_private (user_id, student_no) values (new.id, v_no);
  return new;
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

insert into public.profile_private (user_id) select id from public.profiles on conflict do nothing;

-- 관리자 회원 목록에 학번 추가
drop function public.admin_list_members();
create function public.admin_list_members()
returns table (
  id uuid, email text, nickname text, kind text, teacher_verified boolean, is_admin boolean,
  created_at timestamptz, last_sign_in_at timestamptz, post_count bigint, comment_count bigint,
  school text, major text, school_verified boolean, student_no text, region text, center_type text, info_public boolean
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
           d.school, d.major, coalesce(d.school_verified, false), pp.student_no,
           d.region, d.center_type, coalesce(d.is_public, true)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profile_details d on d.user_id = p.id
    left join public.profile_private pp on pp.user_id = p.id
    order by p.created_at desc;
end $$;
revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
