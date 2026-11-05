-- 회원 탈퇴: 로그인한 본인 계정만 삭제.
-- auth.users 삭제 → profiles → posts / comments / reports 가 on delete cascade 로 모두 삭제된다.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
