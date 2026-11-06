-- 글 수정: 작성자 본인만 분류·제목·내용을 고칠 수 있다(정지 중엔 불가). 고친 시각을 기록해 '수정됨' 표시.
alter table public.posts add column if not exists updated_at timestamptz;

revoke update on public.posts from authenticated;
grant update (category, title, body) on public.posts to authenticated;
grant select (updated_at) on public.posts to anon;

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists posts_update_not_suspended on public.posts;
create policy posts_update_not_suspended on public.posts as restrictive for update to authenticated
  using (not public.is_suspended()) with check (not public.is_suspended());

create or replace function public.posts_touch_updated() returns trigger
language plpgsql set search_path = public as $$
begin
  if (new.title, new.body, new.category) is distinct from (old.title, old.body, old.category) then
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists posts_touch_updated on public.posts;
create trigger posts_touch_updated before update on public.posts
  for each row execute function public.posts_touch_updated();
