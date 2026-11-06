-- 회원 유형: 재학생(student) / 예비 재학생(prospective) / 교사(teacher)
-- 교사는 근무 기관(어린이집 | 유치원)을 반드시 고르고, 닉네임 옆에 항상 표시한다(공개 설정과 무관 → profiles 에 보관).
-- 기관 분류: 어린이집 = 기존 목록, 유치원 = 국립·공립·사립(유아교육법상 구분).

alter table public.profiles drop constraint if exists profiles_kind_check;
alter table public.profiles add constraint profiles_kind_check check (kind in ('student', 'prospective', 'teacher'));

alter table public.profiles add column if not exists teacher_org text
  check (teacher_org is null or teacher_org in ('어린이집', '유치원'));
alter table public.profiles drop constraint if exists profiles_teacher_org_kind;
alter table public.profiles add constraint profiles_teacher_org_kind check (teacher_org is null or kind = 'teacher');

-- 기존 교사: 지금까지는 어린이집 분류만 받았으므로 어린이집으로 채움
update public.profiles p set teacher_org = '어린이집'
  where p.kind = 'teacher' and p.teacher_org is null;

-- 본인이 고칠 수 있는 칸: 닉네임 + (교사) 근무 기관
grant update (nickname, teacher_org) on public.profiles to authenticated;
-- 비회원도 게시판에서 볼 수 있게
grant select (teacher_org) on public.profiles to anon;

alter table public.profile_details drop constraint if exists profile_details_center_type_check;
alter table public.profile_details add constraint profile_details_center_type_check check (center_type is null or center_type in (
  '국공립','사회복지법인','법인·단체등','민간','가정','협동','직장','국립','공립','사립','기타'));

-- 가입 트리거
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  k text := case when m->>'kind' in ('teacher', 'prospective') then m->>'kind' else 'student' end;
  v_org text := nullif(m->>'teacher_org', '');
  v_school text := left(nullif(btrim(m->>'school'), ''), 50);
  v_major text := left(nullif(btrim(m->>'major'), ''), 50);
  v_region text := nullif(m->>'region', '');
  v_center text := nullif(m->>'center_type', '');
  v_no text := nullif(btrim(m->>'student_no'), '');
begin
  if k <> 'teacher' or v_org not in ('어린이집', '유치원') then
    v_org := null;
  end if;
  if k = 'teacher' and v_org is null then
    v_org := '어린이집';
  end if;

  insert into public.profiles (id, nickname, kind, teacher_org)
  values (new.id, left(coalesce(nullif(trim(m->>'nickname'), ''), '익명'), 20), k, v_org);

  if v_region not in ('서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주') then
    v_region := null;
  end if;
  if (v_org = '어린이집' and v_center not in ('국공립','사회복지법인','법인·단체등','민간','가정','협동','직장','기타'))
     or (v_org = '유치원' and v_center not in ('국립','공립','사립','기타'))
     or v_org is null then
    v_center := null;
  end if;
  if k <> 'student' or v_no !~ '^[0-9]{2}$' then
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

-- 관리자 알림 문구
create or replace function public.on_profile_created_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin(
    format(E'🆕 새 회원가입\n닉네임: %s (%s)', new.nickname,
      case new.kind when 'teacher' then coalesce(new.teacher_org, '') || ' 교사' when 'prospective' then '예비 재학생' else '재학생' end),
    '/profile#admin-members');
  return null;
end $$;
revoke execute on function public.on_profile_created_notify() from public, anon, authenticated;

-- 관리자 회원 목록에 근무 기관 추가
drop function public.admin_list_members();
create function public.admin_list_members()
returns table (
  id uuid, email text, nickname text, kind text, teacher_verified boolean, is_admin boolean,
  created_at timestamptz, last_sign_in_at timestamptz, post_count bigint, comment_count bigint,
  school text, major text, school_verified boolean, student_no text, region text, center_type text, info_public boolean,
  teacher_org text
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
           d.region, d.center_type, coalesce(d.is_public, true),
           p.teacher_org
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profile_details d on d.user_id = p.id
    left join public.profile_private pp on pp.user_id = p.id
    order by p.created_at desc;
end $$;
revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
