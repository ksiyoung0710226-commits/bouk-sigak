-- 016: 1:1 채팅 신고·차단
--
-- 차단: 대화방(dm_threads)에 blocked_by(차단한 사람)를 기록한다. 차단된 방에서는 두 사람 모두 메시지를 보낼 수 없고,
--       같은 두 사람 사이에는 방이 하나뿐이므로 다시 채팅을 요청할 수도 없다. 차단한 사람만 차단을 풀 수 있다.
-- 신고: 상대가 보낸 채팅 메시지(dm_message_id) 또는 처음 받은 요청 멘트(dm_thread_id)를 신고할 수 있다.
--       관리자는 평소 대화를 볼 수 없고, 신고된 그 메시지 한 개만 신고 당시 내용(스냅숏)으로 보게 된다.

-- 1) 차단 ----------------------------------------------------------------------
alter table public.dm_threads
  add column blocked_by uuid references public.profiles(id) on delete set null,
  add column blocked_at timestamptz;

create or replace function public.is_dm_member(tid bigint, must_be_accepted boolean) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.dm_threads
    where id = tid and auth.uid() in (requester_id, recipient_id)
      and (not must_be_accepted or (status = 'accepted' and blocked_by is null))
  )
$$;

-- 차단: 대화방의 두 사람 누구나. 대기 중인 요청을 받은 사람이 차단하면 거절도 함께 된다.
create function public.block_dm(tid bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_threads
     set blocked_by = auth.uid(), blocked_at = now(),
         status = case when status = 'pending' and recipient_id = auth.uid() then 'declined' else status end,
         responded_at = case when status = 'pending' and recipient_id = auth.uid() then now() else responded_at end
   where id = tid and auth.uid() in (requester_id, recipient_id) and blocked_by is null;
  if not found then raise exception 'not allowed'; end if;
end $$;

-- 차단 풀기: 차단한 사람만
create function public.unblock_dm(tid bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.dm_threads set blocked_by = null, blocked_at = null
   where id = tid and blocked_by = auth.uid();
  if not found then raise exception 'not allowed'; end if;
end $$;

revoke execute on function public.block_dm(bigint), public.unblock_dm(bigint) from public, anon;
grant execute on function public.block_dm(bigint), public.unblock_dm(bigint) to authenticated;

-- 2) 채팅 신고 ------------------------------------------------------------------
alter table public.reports
  add column dm_message_id bigint references public.dm_messages(id) on delete set null,
  add column dm_thread_id bigint references public.dm_threads(id) on delete set null;
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('post','comment','dm'));

revoke insert on public.reports from authenticated;
grant insert (post_id, comment_id, dm_message_id, dm_thread_id, reporter_id, reason) on public.reports to authenticated;

create or replace function public.on_report_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.post_id is not null)::int + (new.comment_id is not null)::int
     + (new.dm_message_id is not null)::int + (new.dm_thread_id is not null)::int <> 1 then
    raise exception 'report needs exactly one target';
  end if;
  if new.post_id is not null then
    select 'post', p.author_id, pr.nickname, p.board, p.title, p.body
      into new.target_type, new.target_author_id, new.target_author_nickname, new.target_board, new.target_title, new.target_body
      from public.posts p left join public.profiles pr on pr.id = p.author_id where p.id = new.post_id;
  elsif new.comment_id is not null then
    select 'comment', c.author_id, pr.nickname, p.board, p.title, c.body
      into new.target_type, new.target_author_id, new.target_author_nickname, new.target_board, new.target_title, new.target_body
      from public.comments c join public.posts p on p.id = c.post_id
      left join public.profiles pr on pr.id = c.author_id where c.id = new.comment_id;
  elsif new.dm_message_id is not null then
    -- 신고자는 그 대화방의 참여자여야 한다(남의 대화는 신고할 수 없음)
    select 'dm', m.sender_id, pr.nickname, 'dm', null, m.body
      into new.target_type, new.target_author_id, new.target_author_nickname, new.target_board, new.target_title, new.target_body
      from public.dm_messages m join public.dm_threads t on t.id = m.thread_id
      left join public.profiles pr on pr.id = m.sender_id
     where m.id = new.dm_message_id and new.reporter_id in (t.requester_id, t.recipient_id);
  else
    -- 요청 멘트: 요청을 받은 사람만 신고 가능
    select 'dm', t.requester_id, pr.nickname, 'dm', '채팅 요청 멘트', t.intro
      into new.target_type, new.target_author_id, new.target_author_nickname, new.target_board, new.target_title, new.target_body
      from public.dm_threads t left join public.profiles pr on pr.id = t.requester_id
     where t.id = new.dm_thread_id and t.recipient_id = new.reporter_id;
  end if;
  if new.target_type is null then
    raise exception 'target not found';
  end if;
  if new.target_author_id = new.reporter_id then
    raise exception 'cannot report self';
  end if;
  new.status := 'open';
  new.action := null; new.admin_note := null; new.resolved_at := null; new.resolved_by := null; new.notified_at := null;
  new.content_deleted := false;
  return new;
end $$;
revoke execute on function public.on_report_insert() from public, anon, authenticated;

-- 3) 처분: 채팅 메시지 삭제 지원, 같은 대상 묶음 처리에 채팅 포함 -------------------------
create or replace function public.admin_resolve_report(report_id bigint, act text, note text, delete_content boolean)
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
  if del then
    if r.post_id is not null then delete from public.posts p where p.id = r.post_id; end if;
    if r.comment_id is not null then delete from public.comments c where c.id = r.comment_id; end if;
    if r.dm_message_id is not null then delete from public.dm_messages m where m.id = r.dm_message_id; end if;
    if r.dm_thread_id is not null then
      update public.dm_threads t set intro = '(운영자가 삭제한 메시지입니다)' where t.id = r.dm_thread_id;
    end if;
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

  return query
    with done as (
      update public.reports x
         set status = 'resolved', action = act, admin_note = nullif(btrim(note), ''),
             resolved_at = now(), resolved_by = auth.uid(), content_deleted = del
       where x.id = r.id
          or (x.status = 'open' and x.target_type = r.target_type
              and ((r.post_id is not null and x.post_id = r.post_id)
                   or (r.comment_id is not null and x.comment_id = r.comment_id)
                   or (r.dm_message_id is not null and x.dm_message_id = r.dm_message_id)
                   or (r.dm_thread_id is not null and x.dm_thread_id = r.dm_thread_id)
                   or (x.post_id is null and x.comment_id is null and x.dm_message_id is null and x.dm_thread_id is null
                       and x.target_author_id is not distinct from r.target_author_id and x.target_body = r.target_body)))
      returning x.id, x.reporter_id, x.action, x.target_type, x.content_deleted
    )
    select d.id, u.email::text, p.nickname, d.action, d.target_type, d.content_deleted
      from done d join public.profiles p on p.id = d.reporter_id join auth.users u on u.id = d.reporter_id;
end $$;

-- 4) 관리자 목록: 채팅 메시지가 아직 남아 있는지도 반영 --------------------------------------
create or replace function public.admin_list_reports()
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
           r.target_type, r.post_id, r.comment_id,
           (r.post_id is not null or r.comment_id is not null or r.dm_message_id is not null
            or (r.dm_thread_id is not null and not r.content_deleted)),
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

-- 5) 카카오 알림 문구에 '1:1 채팅' 추가 ---------------------------------------------------
create or replace function public.on_report_created_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  select nickname into who from public.profiles where id = new.reporter_id;
  perform public.notify_admin(
    format(E'🚩 새 신고 (%s)\n신고자: %s\n대상: %s\n사유: %s',
           case new.target_type when 'comment' then '댓글' when 'dm' then '1:1 채팅' else '게시글' end,
           coalesce(who, '-'), coalesce(new.target_author_nickname, '-'), left(new.reason, 80)),
    '/profile#admin-reports');
  return null;
end $$;
revoke execute on function public.on_report_created_notify() from public, anon, authenticated;
