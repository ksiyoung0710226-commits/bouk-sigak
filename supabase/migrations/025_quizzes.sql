-- 퀴즈: 관리자가 만들고, 누구나(비회원 포함) 풀 수 있다. 풀이 기록은 저장하지 않는다(브라우저에서만 채점).
create table if not exists public.quizzes (
  id bigint generated always as identity primary key,
  category text not null default '기타' check (char_length(category) between 1 and 20),
  question text not null check (char_length(question) between 1 and 300),
  choices text[] not null check (array_length(choices, 1) between 2 and 5),
  answer smallint not null,
  explanation text check (explanation is null or char_length(explanation) <= 1000),
  published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (answer >= 0 and answer < array_length(choices, 1))
);
alter table public.quizzes enable row level security;

drop policy if exists quizzes_read on public.quizzes;
drop policy if exists quizzes_read_anon on public.quizzes;
create policy quizzes_read_anon on public.quizzes for select to anon using (published);
create policy quizzes_read on public.quizzes for select to authenticated
  using (published or public.is_admin());
drop policy if exists quizzes_admin_write on public.quizzes;
create policy quizzes_admin_write on public.quizzes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.quizzes to anon, authenticated;
grant insert (category, question, choices, answer, explanation, published, created_by), update (category, question, choices, answer, explanation, published), delete
  on public.quizzes to authenticated;
