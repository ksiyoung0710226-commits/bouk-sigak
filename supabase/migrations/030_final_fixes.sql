-- 최종 점검 수정 (2026-11-06)

-- 1) 퀴즈 문제는 '문제 공개 + 묶음 공개 + 시작됨'일 때만 보이게(시작 전·숨긴 묶음 문제가 미리 새지 않도록). 관리자는 모두 봄.
drop policy if exists quizzes_read_anon on public.quizzes;
drop policy if exists quizzes_read on public.quizzes;
create policy quizzes_read_anon on public.quizzes for select to anon using (
  published and exists (select 1 from public.quiz_sets s where s.id = set_id and s.published and s.starts_at <= now()));
create policy quizzes_read on public.quizzes for select to authenticated using (
  public.is_admin() or (published and exists (select 1 from public.quiz_sets s where s.id = set_id and s.published and s.starts_at <= now())));

-- 2) 마감은 시작보다 뒤
alter table public.quiz_sets drop constraint if exists quiz_sets_period_check;
alter table public.quiz_sets add constraint quiz_sets_period_check check (ends_at is null or ends_at > starts_at);

-- 3) 제출 결과에 '실제로 제출했던 답'도 돌려줌(다른 탭에서 먼저 낸 경우 정확히 표시)
drop function if exists public.submit_quiz_answer(bigint, smallint, text);
create function public.submit_quiz_answer(qid bigint, pick smallint, txt text)
returns table (is_correct boolean, answer smallint, answers text[], explanation text, choice smallint, text_answer text)
language plpgsql security definer set search_path = public as $$
declare q public.quizzes; s public.quiz_sets; ok boolean;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into q from public.quizzes where id = qid and published;
  if not found then raise exception 'quiz not found'; end if;
  if not exists (select 1 from public.quiz_attempts a where a.quiz_id = qid and a.user_id = auth.uid()) then
    select * into s from public.quiz_sets where id = q.set_id;
    if not s.published or now() < s.starts_at then raise exception 'quiz not started'; end if;
    if s.ends_at is not null and now() >= s.ends_at then raise exception 'quiz closed'; end if;
    if q.qtype = 'choice' then
      if pick is null then raise exception 'no answer'; end if;
      ok := pick = q.answer;
    else
      if coalesce(btrim(txt), '') = '' then raise exception 'no answer'; end if;
      ok := exists (select 1 from unnest(q.answers) x where public.quiz_norm(x) = public.quiz_norm(txt));
    end if;
    insert into public.quiz_attempts (quiz_id, user_id, choice, text_answer, is_correct)
    values (qid, auth.uid(), case when q.qtype = 'choice' then pick end, case when q.qtype = 'short' then left(btrim(txt), 100) end, ok)
    on conflict (quiz_id, user_id) do nothing;
  end if;
  return query select a.is_correct, q.answer, q.answers, q.explanation, a.choice, a.text_answer
    from public.quiz_attempts a where a.quiz_id = qid and a.user_id = auth.uid();
end $$;
revoke execute on function public.submit_quiz_answer(bigint, smallint, text) from public, anon;
grant execute on function public.submit_quiz_answer(bigint, smallint, text) to authenticated;

-- 4) 추첨용 참여자 집계는 공개된 문제만
create or replace function public.admin_quiz_participants(sid bigint) returns table (user_id uuid, answered bigint, correct bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select a.user_id, count(*), count(*) filter (where a.is_correct)
    from public.quiz_attempts a join public.quizzes q on q.id = a.quiz_id
    where q.set_id = sid and q.published group by a.user_id;
end $$;

-- 5) AI 답변 생성이 실패하면 오늘 사용량 1회 돌려주기
create or replace function public.ai_refund_quota() returns void
language sql security definer set search_path = public as $$
  update public.ai_usage set count = greatest(count - 1, 0)
   where user_id = auth.uid() and day = (now() at time zone 'Asia/Seoul')::date
$$;
revoke execute on function public.ai_refund_quota() from public, anon;
grant execute on function public.ai_refund_quota() to authenticated;

-- 6) 쿠폰번호 접두어 BOYUK- → EDU- (이미 발급된 번호는 그대로)
create or replace function public.admin_draw_coupons(title text, coupon text, candidates uuid[], n int) returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare eid bigint; pool int;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  select count(*) into pool from public.profiles p where p.id = any(candidates) and not p.is_admin;
  if pool = 0 then raise exception 'no candidates'; end if;
  if n < 1 or n > pool then raise exception 'invalid winner count'; end if;

  insert into public.coupon_events (title, coupon, candidate_count, winner_count, created_by)
  values (btrim(title), btrim(coupon), pool, n, auth.uid())
  returning id into eid;

  insert into public.coupon_winners (event_id, user_id, code)
  select eid, p.id,
         'EDU-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 4)) || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 4))
  from public.profiles p
  where p.id = any(candidates) and not p.is_admin
  order by random()
  limit n;
  return eid;
end $$;
