-- 관리자가 회원에게 먼저 보내는 1:1 메시지 (상품 전달 안내 등)
-- 1:1 문의(inquiries)와 같은 대화방을 쓰되, 관리자가 시작한 방은 started_by_admin = true

alter table public.inquiries add column started_by_admin boolean not null default false;

create function public.admin_start_inquiry(target uuid, title text, body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare iid bigint;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if target = auth.uid() then
    raise exception 'cannot message self';
  end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'member not found';
  end if;
  insert into public.inquiries (user_id, title, started_by_admin, admin_unread)
  values (target, btrim(title), true, false)
  returning id into iid;
  -- 메시지 트리거가 user_unread = true, status = 'answered' 로 바꿈
  insert into public.inquiry_messages (inquiry_id, sender_id, body) values (iid, auth.uid(), btrim(body));
  return iid;
end $$;

revoke execute on function public.admin_start_inquiry(uuid, text, text) from public, anon;
grant execute on function public.admin_start_inquiry(uuid, text, text) to authenticated;
