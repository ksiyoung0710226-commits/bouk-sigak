-- 교사의 근무 어린이집 이름 (본인·관리자만 조회: profile_private)
alter table public.profile_private add column center_name text
  check (center_name is null or char_length(center_name) between 2 and 60);
grant insert (center_name) on public.profile_private to authenticated;
grant update (center_name) on public.profile_private to authenticated;

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
  v_center_name text := left(nullif(btrim(m->>'center_name'), ''), 60);
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
  if k <> 'teacher' or char_length(v_center_name) < 2 then
    v_center_name := null;
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
  insert into public.profile_private (user_id, student_no, center_name) values (new.id, v_no, v_center_name);
  return new;
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop function public.admin_list_members();
create function public.admin_list_members()
returns table (
  id uuid, email text, nickname text, kind text, teacher_verified boolean, is_admin boolean,
  created_at timestamptz, last_sign_in_at timestamptz, post_count bigint, comment_count bigint,
  school text, major text, school_verified boolean, student_no text,
  region text, center_type text, center_name text, info_public boolean
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
           d.region, d.center_type, pp.center_name, coalesce(d.is_public, true)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profile_details d on d.user_id = p.id
    left join public.profile_private pp on pp.user_id = p.id
    order by p.created_at desc;
end $$;
revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
