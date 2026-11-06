-- 퀴즈 묶음(○○ 퀴즈) + 서버 채점 + 참여 기록(회원 추첨 대상으로 사용)
-- 정답·해설·정답 비율은 관리자만 본다. 회원은 문제와 보기만 받고, 답은 RPC로 제출(문제당 1번).

create table if not exists public.quiz_sets (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 40),
  description text check (description is null or char_length(description) <= 300),
  starts_at timestamptz not null default now(),  -- 이벤트 시작
  ends_at timestamptz,                            -- 이벤트 마감(없으면 계속 이벤트). 지나면 '연습 모드': 누구나 무제한으로 풀기(기록 없음)
  published boolean not null default true,        -- 목록에 보임
  created_at timestamptz not null default now()
);
alter table public.quiz_sets enable row level security;
create policy quiz_sets_read_anon on public.quiz_sets for select to anon using (published);
create policy quiz_sets_read on public.quiz_sets for select to authenticated using (published or public.is_admin());
create policy quiz_sets_admin_write on public.quiz_sets for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.quiz_sets to anon, authenticated;
grant insert (title, description, starts_at, ends_at, published), update (title, description, starts_at, ends_at, published), delete on public.quiz_sets to authenticated;

-- 기존 퀴즈는 '기본 퀴즈' 묶음으로
alter table public.quizzes add column if not exists set_id bigint references public.quiz_sets(id) on delete cascade;
do $$
declare sid bigint;
begin
  if exists (select 1 from public.quizzes where set_id is null) then
    insert into public.quiz_sets (title) values ('기본 퀴즈') returning id into sid;
    update public.quizzes set set_id = sid where set_id is null;
  end if;
end $$;
alter table public.quizzes alter column set_id set not null;
grant insert (set_id) , update (set_id) on public.quizzes to authenticated;

-- 정답·해설은 열 권한에서 빼서 일반 조회로는 못 읽게 함(관리자는 아래 RPC로 봄)
revoke select on public.quizzes from anon, authenticated;
grant select (id, set_id, qtype, category, question, choices, published, created_at) on public.quizzes to anon, authenticated;

create table if not exists public.quiz_attempts (
  id bigint generated always as identity primary key,
  quiz_id bigint not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice smallint,
  text_answer text check (text_answer is null or char_length(text_answer) <= 100),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (quiz_id, user_id)
);
alter table public.quiz_attempts enable row level security;   -- 정책 없음 = 직접 접근 불가(RPC만)

create or replace function public.quiz_norm(s text) returns text language sql immutable as $$
  select regexp_replace(lower(coalesce(s, '')), '[[:space:].·,!?]', '', 'g')
$$;

-- 답 제출 → 결과(정답 여부·정답·해설)를 돌려줌. 이미 제출했으면 처음 제출한 결과를 그대로 돌려줌(다시 풀기 불가).
create or replace function public.submit_quiz_answer(qid bigint, pick smallint, txt text)
returns table (is_correct boolean, answer smallint, answers text[], explanation text)
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
  return query select a.is_correct, q.answer, q.answers, q.explanation
    from public.quiz_attempts a where a.quiz_id = qid and a.user_id = auth.uid();
end $$;

-- 연습 모드(마감 후): 누구나 몇 번이든 채점만(기록하지 않음)
create or replace function public.practice_quiz_answer(qid bigint, pick smallint, txt text)
returns table (is_correct boolean, answer smallint, answers text[], explanation text)
language plpgsql stable security definer set search_path = public as $$
declare q public.quizzes; s public.quiz_sets;
begin
  select * into q from public.quizzes where id = qid and published;
  if not found then raise exception 'quiz not found'; end if;
  select * into s from public.quiz_sets where id = q.set_id;
  if not s.published or s.ends_at is null or now() < s.ends_at then raise exception 'not practice'; end if;
  return query select
    case when q.qtype = 'choice' then pick = q.answer
         else exists (select 1 from unnest(q.answers) x where public.quiz_norm(x) = public.quiz_norm(txt)) end,
    q.answer, q.answers, q.explanation;
end $$;
revoke execute on function public.practice_quiz_answer(bigint, smallint, text) from public;
grant execute on function public.practice_quiz_answer(bigint, smallint, text) to anon, authenticated;

-- 내가 이미 제출한 문제의 결과(다시 들어와도 결과가 보이도록)
create or replace function public.my_quiz_answers()
returns table (quiz_id bigint, choice smallint, text_answer text, is_correct boolean, answer smallint, answers text[], explanation text)
language sql stable security definer set search_path = public as $$
  select a.quiz_id, a.choice, a.text_answer, a.is_correct, q.answer, q.answers, q.explanation
  from public.quiz_attempts a join public.quizzes q on q.id = a.quiz_id
  where a.user_id = auth.uid()
$$;

-- 관리자: 정답·해설·참여 통계
create or replace function public.admin_quiz_stats() returns table (
  id bigint, set_id bigint, answer smallint, answers text[], explanation text,
  attempts bigint, correct bigint, choice_counts bigint[]
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select q.id, q.set_id, q.answer, q.answers, q.explanation,
      (select count(*) from public.quiz_attempts a where a.quiz_id = q.id),
      (select count(*) from public.quiz_attempts a where a.quiz_id = q.id and a.is_correct),
      case when q.qtype = 'choice' then
        array(select (select count(*) from public.quiz_attempts a where a.quiz_id = q.id and a.choice = g)
              from generate_series(0, coalesce(array_length(q.choices, 1), 0) - 1) g)
      end
    from public.quizzes q;
end $$;

-- 관리자: ○○ 퀴즈 참여자(한 문제 이상 제출) — 회원 추첨 대상
create or replace function public.admin_quiz_participants(sid bigint) returns table (user_id uuid, answered bigint, correct bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select a.user_id, count(*), count(*) filter (where a.is_correct)
    from public.quiz_attempts a join public.quizzes q on q.id = a.quiz_id
    where q.set_id = sid group by a.user_id;
end $$;

revoke execute on function public.submit_quiz_answer(bigint, smallint, text), public.my_quiz_answers(),
  public.admin_quiz_stats(), public.admin_quiz_participants(bigint) from public, anon;
grant execute on function public.submit_quiz_answer(bigint, smallint, text), public.my_quiz_answers(),
  public.admin_quiz_stats(), public.admin_quiz_participants(bigint) to authenticated;
