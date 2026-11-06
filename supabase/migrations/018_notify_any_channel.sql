-- 관리자 알림: 카카오가 연결되지 않아도 사이트로 보낸다(사이트가 카카오 또는 메일로 전달).
create or replace function public.notify_admin(msg text, path text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s text;
begin
  select value into s from public.app_secrets where key = 'notify_secret';
  if s is null then return; end if;
  perform net.http_post(
    url := 'https://boyuk-insight.vercel.app/api/notify',
    body := jsonb_build_object('text', msg, 'path', path),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', s),
    timeout_milliseconds := 10000
  );
exception when others then
  raise warning 'notify_admin failed: %', sqlerrm;
end $$;
revoke execute on function public.notify_admin(text, text) from public, anon, authenticated;
