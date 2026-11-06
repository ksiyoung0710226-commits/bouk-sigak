-- 가입 완료(이메일 인증 완료) 시 환영 메일: DB → pg_net → 사이트 /api/welcome (NOTIFY_SECRET 확인) → Gmail
create or replace function public.send_welcome_mail() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare s text; nick text;
begin
  select value into s from public.app_secrets where key = 'notify_secret';
  if s is null or new.email is null then return null; end if;
  select nickname into nick from public.profiles where id = new.id;
  perform net.http_post(
    url := 'https://educare-insight.vercel.app/api/welcome',
    body := jsonb_build_object('email', new.email,
      'nickname', coalesce(nick, nullif(trim(new.raw_user_meta_data->>'nickname'), ''), '회원')),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', s),
    timeout_milliseconds := 10000
  );
  return null;
exception when others then
  raise warning 'send_welcome_mail failed: %', sqlerrm;
  return null;
end $$;
revoke execute on function public.send_welcome_mail() from public, anon, authenticated;

-- 이메일 인증을 마친 순간(한 번만)
drop trigger if exists welcome_mail_on_confirm on auth.users;
create trigger welcome_mail_on_confirm after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.send_welcome_mail();

-- 이메일 인증이 꺼져 있어 가입과 동시에 인증된 경우
drop trigger if exists welcome_mail_on_insert on auth.users;
create trigger welcome_mail_on_insert after insert on auth.users
  for each row when (new.email_confirmed_at is not null)
  execute function public.send_welcome_mail();
