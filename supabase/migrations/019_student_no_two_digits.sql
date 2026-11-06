-- 학번은 개인정보 최소화를 위해 숫자 두 자리(입학 연도, 예: 24)만 받는다.
-- 기존 값: 앞 4자리가 19xx/20xx 연도면 뒤 두 자리, 아니면 앞 두 자리 숫자, 그것도 없으면 지움.
alter table public.profile_private drop constraint if exists profile_private_student_no_check;
update public.profile_private set student_no = case
    when student_no ~ '^(19|20)[0-9]{2}' and length(student_no) >= 6 then substr(student_no, 3, 2)
    when student_no ~ '^[0-9]{2}' then substr(student_no, 1, 2)
    else null end
  where student_no is not null and student_no !~ '^[0-9]{2}$';
alter table public.profile_private add constraint profile_private_student_no_check
  check (student_no is null or student_no ~ '^[0-9]{2}$');

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
