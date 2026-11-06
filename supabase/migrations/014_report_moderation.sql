-- 신고 관리: 관리자가 신고 이유·내용을 보고 처분(경고/글 삭제/이용 정지/강제 탈퇴)을 정한 뒤 '처리 완료'
-- 처리 완료 후 신고자에게 안내 메일을 보낸다(메일 발송은 서버 /api/admin/reports 가 담당).
--
-- 1) 신고 당시 내용을 그대로 저장(스냅숏): 글이 지워지거나 작성자가 탈퇴해도 처리 근거가 남도록.
-- 2) 글·댓글이 지워져도 신고는 남도록 FK 를 on delete set null 로 바꾼다.

alter table public.reports drop constraint if exists reports_check;
alter table public.reports drop constraint if exists reports_post_id_fkey;
alter table public.reports drop constraint if exists reports_comment_id_fkey;
alter table public.reports
  add constraint reports_post_id_fkey foreign key (post_id) references public.posts(id) on delete set null,
  add constraint reports_comment_id_fkey foreign key (comment_id) references public.comments(id) on delete set null;

alter table public.reports
  add column target_type text check (target_type in ('post','comment')),
  add column target_author_id uuid,              -- FK 없음: 강제 탈퇴 후에도 기록 유지
  add column target_author_nickname text,
  add column target_board text,
  add column target_title text,
  add column target_body text,
  add column status text not null default 'open' check (status in ('open','resolved')),
  add column action text check (action in ('none','warning','delete_content','suspend_7','suspend_30','suspend_forever','expel')),
  add column admin_note text check (char_length(admin_note) <= 1000),
  add column resolved_at timestamptz,
  add column resolved_by uuid references public.profiles(id) on delete set null,
  add column notified_at timestamptz;

create index reports_status_created on public.reports (status, created_at desc);

-- 회원은 대상·사유만 넣을 수 있다(처리 상태·스냅숏은 DB가 채움)
revoke insert, update on public.reports from authenticated;
grant insert (post_id, comment_id, reporter_id, reason) on public.reports to authenticated;

create function public.on_report_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.post_id is null) = (new.comment_id is null) then
    raise exception 'report needs exactly one target';
  end if;
  if new.post_id is not null then
    select 'post', p.author_id, pr.nickname, p.board, p.title, p.body
      into new.target_type, new.target_author_id, new.target_author_nickname, new.target_board, new.target_title, new.target_body
      from public.posts p left join public.profiles pr on pr.id = p.author_id where p.id = new.post_id;
  else
    select 'comment', c.author_id, pr.nickname, p.board, p.title, c.body
      into new.target_type, new.target_author_id, new.target_author_nickname, new.target_board, new.target_title, new.target_body
      from public.comments c join public.posts p on p.id = c.post_id
      left join public.profiles pr on pr.id = c.author_id where c.id = new.comment_id;
  end if;
  if new.target_type is null then
    raise exception 'target not found';
  end if;
  if new.target_author_id = new.reporter_id then
    raise exception 'cannot report self';
  end if;
  new.status := 'open';
  new.action := null; new.admin_note := null; new.resolved_at := null; new.resolved_by := null; new.notified_at := null;
  return new;
end $$;
revoke execute on function public.on_report_insert() from public, anon, authenticated;

create trigger reports_before_insert before insert on public.reports
for each row execute function public.on_report_insert();

-- 3) 이용 정지 ---------------------------------------------------------------
alter table public.profiles add column suspended_until timestamptz;  -- null = 정상, 'infinity' = 영구 정지

create function public.is_suspended() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select suspended_until > now() from public.profiles where id = auth.uid()), false)
$$;
revoke execute on function public.is_suspended() from public, anon;
grant execute on function public.is_suspended() to authenticated;

-- 정지 중에는 글·댓글·1:1 채팅 쓰기 불가(1:1 문의로 관리자에게 연락하는 것은 허용)
create policy posts_not_suspended on public.posts as restrictive for insert to authenticated
  with check (not public.is_suspended());
create policy comments_not_suspended on public.comments as restrictive for insert to authenticated
  with check (not public.is_suspended());
create policy dm_threads_not_suspended on public.dm_threads as restrictive for insert to authenticated
  with check (not public.is_suspended());
create policy dm_messages_not_suspended on public.dm_messages as restrictive for insert to authenticated
  with check (not public.is_suspended());

-- 4) 관리자용 함수 -------------------------------------------------------------
create function public.admin_list_reports()
returns table (
  id bigint, created_at timestamptz, reason text,
  reporter_id uuid, reporter_nickname text, reporter_email text,
  target_type text, post_id bigint, comment_id bigint, target_exists boolean,
  target_author_id uuid, target_author_nickname text, target_author_email text, target_author_exists boolean,
  target_author_suspended_until timestamptz, target_author_report_count bigint,
  target_board text, target_title text, target_body text,
  status text, action text, admin_note text, resolved_at timestamptz, notified_at timestamptz
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select r.id, r.created_at, r.reason,
           r.reporter_id, rp.nickname, ru.email::text,
           r.target_type, r.post_id, r.comment_id, (r.post_id is not null or r.comment_id is not null),
           r.target_author_id, coalesce(tp.nickname, r.target_author_nickname), tu.email::text, (tp.id is not null),
           tp.suspended_until,
           (select count(*) from public.reports r2 where r2.target_author_id = r.target_author_id),
           r.target_board, r.target_title, r.target_body,
           r.status, r.action, r.admin_note, r.resolved_at, r.notified_at
    from public.reports r
    left join public.profiles rp on rp.id = r.reporter_id
    left join auth.users ru on ru.id = r.reporter_id
    left join public.profiles tp on tp.id = r.target_author_id
    left join auth.users tu on tu.id = r.target_author_id
    order by (r.status = 'open') desc, r.created_at desc;
end $$;

-- 처분 실행 + 처리 완료. 신고자에게 보낼 메일 정보를 돌려준다.
create function public.admin_resolve_report(report_id bigint, act text, note text, delete_content boolean)
returns table (reporter_email text, reporter_nickname text, action text, target_type text)
language plpgsql security definer set search_path = public, auth as $$
declare r public.reports%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if act not in ('none','warning','delete_content','suspend_7','suspend_30','suspend_forever','expel') then
    raise exception 'bad action';
  end if;
  select * into r from public.reports where id = report_id for update;
  if not found then raise exception 'report not found'; end if;
  if r.status = 'resolved' then raise exception 'already resolved'; end if;

  if act in ('suspend_7','suspend_30','suspend_forever','expel') and r.target_author_id is not null then
    if r.target_author_id = auth.uid() or exists (select 1 from public.profiles where id = r.target_author_id and is_admin) then
      raise exception 'cannot punish admin';
    end if;
  end if;

  -- 글/댓글 삭제 (처분이 '글 삭제'이거나, 다른 처분과 함께 삭제를 골랐을 때)
  if act = 'delete_content' or coalesce(delete_content, false) then
    if r.post_id is not null then delete from public.posts where id = r.post_id; end if;
    if r.comment_id is not null then delete from public.comments where id = r.comment_id; end if;
  end if;

  if act in ('suspend_7','suspend_30','suspend_forever') and r.target_author_id is not null then
    update public.profiles
       set suspended_until = greatest(coalesce(suspended_until, now()),
             case act when 'suspend_7' then now() + interval '7 days'
                      when 'suspend_30' then now() + interval '30 days'
                      else 'infinity'::timestamptz end)
     where id = r.target_author_id;
  elsif act = 'expel' and r.target_author_id is not null then
    delete from auth.users where id = r.target_author_id;  -- 글·댓글 등 cascade 삭제, 신고 기록(스냅숏)은 남음
  end if;

  -- 같은 글·댓글에 대한 다른 대기 중 신고도 같은 처분으로 함께 처리(각 신고자에게 메일)
  return query
    with done as (
      update public.reports x
         set status = 'resolved', action = act, admin_note = nullif(btrim(note), ''),
             resolved_at = now(), resolved_by = auth.uid()
       where x.id = r.id
          or (x.status = 'open' and x.target_type = r.target_type
              and ((r.post_id is not null and x.post_id = r.post_id) or (r.comment_id is not null and x.comment_id = r.comment_id)
                   or (x.post_id is null and x.comment_id is null and x.target_author_id = r.target_author_id
                       and x.target_body = r.target_body)))
      returning x.reporter_id, x.action, x.target_type
    )
    select u.email::text, p.nickname, d.action, d.target_type
      from done d join public.profiles p on p.id = d.reporter_id join auth.users u on u.id = d.reporter_id;
end $$;

-- 메일 발송 완료 표시(같은 신고자·같은 처리 묶음)
create function public.admin_mark_reports_notified(report_ids bigint[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update public.reports set notified_at = now() where id = any(report_ids) and status = 'resolved';
end $$;

-- 메일 다시 보내기용 정보
create function public.admin_report_mail_info(report_id bigint)
returns table (id bigint, reporter_email text, reporter_nickname text, action text, target_type text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select r.id, u.email::text, p.nickname, r.action, r.target_type
      from public.reports r join public.profiles p on p.id = r.reporter_id join auth.users u on u.id = r.reporter_id
     where r.id = report_id and r.status = 'resolved';
end $$;

-- 정지 해제
create function public.admin_unsuspend(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update public.profiles set suspended_until = null where id = target;
end $$;

-- 처리 안 된 신고 수(헤더 배지)
create function public.admin_open_report_count() returns bigint
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then return 0; end if;
  return (select count(*) from public.reports where status = 'open');
end $$;

revoke execute on function public.admin_list_reports(), public.admin_resolve_report(bigint, text, text, boolean),
  public.admin_mark_reports_notified(bigint[]), public.admin_report_mail_info(bigint),
  public.admin_unsuspend(uuid), public.admin_open_report_count() from public, anon;
grant execute on function public.admin_list_reports(), public.admin_resolve_report(bigint, text, text, boolean),
  public.admin_mark_reports_notified(bigint[]), public.admin_report_mail_info(bigint),
  public.admin_unsuspend(uuid), public.admin_open_report_count() to authenticated;

-- 5) 보관 기간: 처리 완료 후 1년 지난 신고 기록은 매일 자동 파기(개인정보 처리방침과 일치)
create extension if not exists pg_cron;
select cron.schedule('purge-old-reports', '30 18 * * *',
  $$delete from public.reports where status = 'resolved' and resolved_at < now() - interval '1 year'$$);
