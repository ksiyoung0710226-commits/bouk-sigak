-- 퀴즈 유형: 객관식(choice) / 주관식(short). 아직 퀴즈가 없어서 표를 새 구조로 다시 만든다(있으면 옮김).
create table public.quizzes_new (
  id bigint generated always as identity primary key,
  qtype text not null default 'choice' check (qtype in ('choice', 'short')),
  category text not null default '기타' check (char_length(category) between 1 and 20),
  question text not null check (char_length(question) between 1 and 300),
  choices text[],            -- 객관식 보기(2~5개)
  answer smallint,           -- 객관식 정답 번호(0부터)
  answers text[],            -- 주관식 정답(여러 표현 허용, 1~5개)
  explanation text check (explanation is null or char_length(explanation) <= 1000),
  published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (qtype = 'choice' and array_length(choices, 1) between 2 and 5 and answer >= 0 and answer < array_length(choices, 1) and answers is null)
    or (qtype = 'short' and array_length(answers, 1) between 1 and 5 and choices is null and answer is null)
  )
);
insert into public.quizzes_new (qtype, category, question, choices, answer, explanation, published, created_by, created_at)
  select 'choice', category, question, choices, answer, explanation, published, created_by, created_at from public.quizzes order by id;
drop table public.quizzes;
alter table public.quizzes_new rename to quizzes;

alter table public.quizzes enable row level security;
create policy quizzes_read_anon on public.quizzes for select to anon using (published);
create policy quizzes_read on public.quizzes for select to authenticated using (published or public.is_admin());
create policy quizzes_admin_write on public.quizzes for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.quizzes to anon, authenticated;
grant insert (qtype, category, question, choices, answer, answers, explanation, published, created_by),
  update (qtype, category, question, choices, answer, answers, explanation, published), delete
  on public.quizzes to authenticated;
