-- 관리자: 추첨 기록 삭제(당첨자 목록·쿠폰번호도 함께 지워짐 — coupon_winners on delete cascade)
create or replace function public.admin_delete_coupon_event(eid bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  delete from public.coupon_events where id = eid;
  if not found then raise exception 'event not found'; end if;
end $$;
revoke execute on function public.admin_delete_coupon_event(bigint) from public, anon;
grant execute on function public.admin_delete_coupon_event(bigint) to authenticated;
