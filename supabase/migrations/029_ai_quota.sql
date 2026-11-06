-- AI 질문 하루 사용량(비용·남용 방지). 질문 내용은 저장하지 않고 횟수만 센다.
create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;  -- 정책 없음: 아래 함수로만 접근

-- 하루 max_count 번까지. 남은 횟수를 돌려주고, 다 썼으면 -1.
create or replace function public.ai_take_quota(max_count int) returns int
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Seoul')::date; c int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  insert into public.ai_usage (user_id, day, count) values (auth.uid(), d, 0) on conflict do nothing;
  update public.ai_usage set count = count + 1
   where user_id = auth.uid() and day = d and count < greatest(1, least(max_count, 100))
   returning count into c;
  if c is null then return -1; end if;
  return greatest(1, least(max_count, 100)) - c;
end $$;
revoke execute on function public.ai_take_quota(int) from public, anon;
grant execute on function public.ai_take_quota(int) to authenticated;

-- 1년 지난 사용량 기록은 매일 정리
select cron.schedule('clear-old-ai-usage', '50 18 * * *', $$delete from public.ai_usage where day < (now() at time zone 'Asia/Seoul')::date - 365$$);
