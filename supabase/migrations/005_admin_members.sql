-- 관리자 회원 관리: 회원 목록 보기, 회원 탈퇴(강제 삭제)
-- 두 함수 모두 DB 안에서 관리자 여부를 확인하므로 화면을 우회해도 일반 회원은 쓸 수 없다.

-- 1) 회원 목록 (이메일은 auth.users에만 있으므로 security definer 함수로 관리자에게만 제공)
create function public.admin_list_members()
returns table (
  id uuid,
  email text,
  nickname text,
  kind text,
  teacher_verified boolean,
  is_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  post_count bigint,
  comment_count bigint
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
           (select count(*) from public.comments c where c.author_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end $$;

-- 2) 회원 강제 탈퇴. 본인(→ 내 정보에서 탈퇴)과 다른 관리자는 삭제할 수 없다(실수·권한 다툼 방지).
create function public.admin_delete_member(target uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if target = auth.uid() then
    raise exception 'cannot delete self';
  end if;
  if exists (select 1 from public.profiles where id = target and is_admin) then
    raise exception 'cannot delete admin';
  end if;
  delete from auth.users where id = target;
  if not found then
    raise exception 'member not found';
  end if;
end $$;

revoke execute on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;
revoke execute on function public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_delete_member(uuid) to authenticated;
