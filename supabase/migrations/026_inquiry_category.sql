-- 1:1 문의 종류: 수정 문의 / 탈퇴 문의 / 기타 문의 (관리자가 먼저 보낸 메시지는 null)
alter table public.inquiries add column if not exists category text
  check (category is null or category in ('수정 문의', '탈퇴 문의', '기타 문의'));

-- 관리자 알림에 문의 종류 표시
create or replace function public.on_inquiry_message_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text; adm boolean; t text; c text;
begin
  select nickname, is_admin into who, adm from public.profiles where id = new.sender_id;
  if coalesce(adm, false) then return null; end if;   -- 관리자가 보낸 답장은 알리지 않음
  select title, category into t, c from public.inquiries where id = new.inquiry_id;
  perform public.notify_admin(
    format(E'💌 새 문의 메시지%s\n보낸 사람: %s\n제목: %s\n내용: %s',
      case when c is null then '' else ' (' || c || ')' end,
      coalesce(who, '-'), coalesce(t, '-'), left(new.body, 80)),
    '/inquiry');
  return null;
end $$;
revoke execute on function public.on_inquiry_message_notify() from public, anon, authenticated;
