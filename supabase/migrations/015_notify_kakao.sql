-- 015: 신고 처리 기록 보완 + 관리자 카카오톡 알림(새 회원가입·신고·문의)

-- 1) '정지/경고 + 게시물 삭제'를 같이 골랐는지 기록(다시 보내기 메일 문구용)
alter table public.reports add column content_deleted boolean not null default false;

drop function public.admin_resolve_report(bigint, text, text, boolean);
create function public.admin_resolve_report(report_id bigint, act text, note text, delete_content boolean)
returns table (id bigint, reporter_email text, reporter_nickname text, action text, target_type text, content_deleted boolean)
language plpgsql security definer set search_path = public, auth as $$
declare r public.reports%rowtype; del boolean;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if act not in ('none','warning','delete_content','suspend_7','suspend_30','suspend_forever','expel') then
    raise exception 'bad action';
  end if;
  select * into r from public.reports x where x.id = report_id for update;
  if not found then raise exception 'report not found'; end if;
  if r.status = 'resolved' then raise exception 'already resolved'; end if;

  if act in ('suspend_7','suspend_30','suspend_forever','expel') and r.target_author_id is not null then
    if r.target_author_id = auth.uid() or exists (select 1 from public.profiles p where p.id = r.target_author_id and p.is_admin) then
      raise exception 'cannot punish admin';
    end if;
  end if;

  del := act in ('delete_content','expel') or (coalesce(delete_content, false) and act in ('warning','suspend_7','suspend_30','suspend_forever'));
  if act = 'delete_content' or del then
    if r.post_id is not null then delete from public.posts p where p.id = r.post_id; end if;
    if r.comment_id is not null then delete from public.comments c where c.id = r.comment_id; end if;
  end if;

  if act in ('suspend_7','suspend_30','suspend_forever') and r.target_author_id is not null then
    update public.profiles p
       set suspended_until = greatest(coalesce(p.suspended_until, now()),
             case act when 'suspend_7' then now() + interval '7 days'
                      when 'suspend_30' then now() + interval '30 days'
                      else 'infinity'::timestamptz end)
     where p.id = r.target_author_id;
  elsif act = 'expel' and r.target_author_id is not null then
    delete from auth.users u where u.id = r.target_author_id;
  end if;

  -- 같은 글·댓글에 대한 다른 대기 중 신고도 함께 처리(각 신고자에게 메일)
  return query
    with done as (
      update public.reports x
         set status = 'resolved', action = act, admin_note = nullif(btrim(note), ''),
             resolved_at = now(), resolved_by = auth.uid(), content_deleted = del
       where x.id = r.id
          or (x.status = 'open' and x.target_type = r.target_type
              and ((r.post_id is not null and x.post_id = r.post_id)
                   or (r.comment_id is not null and x.comment_id = r.comment_id)
                   or (x.post_id is null and x.comment_id is null
                       and x.target_author_id is not distinct from r.target_author_id and x.target_body = r.target_body)))
      returning x.id, x.reporter_id, x.action, x.target_type, x.content_deleted
    )
    select d.id, u.email::text, p.nickname, d.action, d.target_type, d.content_deleted
      from done d join public.profiles p on p.id = d.reporter_id join auth.users u on u.id = d.reporter_id;
end $$;

drop function public.admin_report_mail_info(bigint);
create function public.admin_report_mail_info(report_id bigint)
returns table (id bigint, reporter_email text, reporter_nickname text, action text, target_type text, content_deleted boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select r.id, u.email::text, p.nickname, r.action, r.target_type, r.content_deleted
      from public.reports r join public.profiles p on p.id = r.reporter_id join auth.users u on u.id = r.reporter_id
     where r.id = report_id and r.status = 'resolved';
end $$;

revoke execute on function public.admin_resolve_report(bigint, text, text, boolean), public.admin_report_mail_info(bigint) from public, anon;
grant execute on function public.admin_resolve_report(bigint, text, text, boolean), public.admin_report_mail_info(bigint) to authenticated;

-- 2) 카카오 토큰 보관: app_secrets(아무도 직접 못 읽음). 서버는 NOTIFY_SECRET 을 알아야만 읽고 쓸 수 있다.
insert into public.app_secrets (key, value)
values ('notify_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

create function public.notify_secret_ok(secret text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_secrets where key = 'notify_secret' and value = secret and length(secret) >= 32)
$$;
revoke execute on function public.notify_secret_ok(text) from public, anon, authenticated;

create function public.notify_get_kakao(secret text)
returns table (access text, access_expires timestamptz, refresh text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.notify_secret_ok(secret) then raise exception 'forbidden'; end if;
  return query select
    (select value from public.app_secrets where key = 'kakao_access_token'),
    (select value::timestamptz from public.app_secrets where key = 'kakao_access_expires'),
    (select value from public.app_secrets where key = 'kakao_refresh_token');
end $$;

create function public.notify_save_kakao(secret text, access text, access_expires timestamptz, refresh text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.notify_secret_ok(secret) then raise exception 'forbidden'; end if;
  if access is not null then
    insert into public.app_secrets values ('kakao_access_token', access) on conflict (key) do update set value = excluded.value;
    insert into public.app_secrets values ('kakao_access_expires', access_expires::text) on conflict (key) do update set value = excluded.value;
  end if;
  if refresh is not null then
    insert into public.app_secrets values ('kakao_refresh_token', refresh) on conflict (key) do update set value = excluded.value;
  end if;
end $$;

revoke execute on function public.notify_get_kakao(text), public.notify_save_kakao(text, text, timestamptz, text) from public;
grant execute on function public.notify_get_kakao(text), public.notify_save_kakao(text, text, timestamptz, text) to anon, authenticated;

-- 관리자 화면에서 연결 여부만 확인
create function public.admin_kakao_connected() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then return false; end if;
  return exists (select 1 from public.app_secrets where key = 'kakao_refresh_token');
end $$;
revoke execute on function public.admin_kakao_connected() from public, anon;
grant execute on function public.admin_kakao_connected() to authenticated;

-- 3) 알림 보내기: DB → (pg_net, 비동기) → 사이트 /api/notify → 카카오톡
-- 알림이 실패해도 가입·신고·문의 저장은 절대 막지 않는다.
create extension if not exists pg_net;

create function public.notify_admin(msg text, path text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s text;
begin
  if not exists (select 1 from public.app_secrets where key = 'kakao_refresh_token') then return; end if;
  select value into s from public.app_secrets where key = 'notify_secret';
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

create function public.on_profile_created_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admin(
    format(E'🆕 새 회원가입\n닉네임: %s (%s)', new.nickname, case when new.kind = 'teacher' then '현장 교사' else '재학생' end),
    '/profile#admin-members');
  return null;
end $$;

create function public.on_report_created_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select nickname into who from public.profiles where id = new.reporter_id;
  perform public.notify_admin(
    format(E'🚩 새 신고 (%s)\n신고자: %s\n대상: %s\n사유: %s',
           case when new.target_type = 'comment' then '댓글' else '게시글' end,
           coalesce(who, '-'), coalesce(new.target_author_nickname, '-'), left(new.reason, 80)),
    '/profile#admin-reports');
  return null;
end $$;

create function public.on_inquiry_message_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text; adm boolean; t text;
begin
  select nickname, is_admin into who, adm from public.profiles where id = new.sender_id;
  if coalesce(adm, false) then return null; end if;   -- 관리자가 보낸 답장은 알리지 않음
  select title into t from public.inquiries where id = new.inquiry_id;
  perform public.notify_admin(
    format(E'💌 새 문의 메시지\n보낸 사람: %s\n제목: %s\n내용: %s', coalesce(who, '-'), coalesce(t, '-'), left(new.body, 80)),
    '/inquiry');
  return null;
end $$;

revoke execute on function public.on_profile_created_notify(), public.on_report_created_notify(),
  public.on_inquiry_message_notify() from public, anon, authenticated;

create trigger profiles_notify after insert on public.profiles
for each row execute function public.on_profile_created_notify();
create trigger reports_notify after insert on public.reports
for each row execute function public.on_report_created_notify();
create trigger inquiry_messages_notify after insert on public.inquiry_messages
for each row execute function public.on_inquiry_message_notify();
select cron.schedule('clear-expired-suspensions', '35 18 * * *',
  $$update public.profiles set suspended_until = null where suspended_until is not null and suspended_until < now()$$);
