-- 관리자 전용 글 고정(공지)
-- 고정 여부는 관리자만 바꿀 수 있다: 일반 회원은 posts를 수정할 권한 자체가 없고, 바꾸는 함수가 관리자 여부를 확인한다.

alter table public.posts add column pinned_at timestamptz;
create index posts_board_pinned on public.posts (board, pinned_at desc nulls last, created_at desc);

create function public.admin_set_pinned(pid bigint, pin boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  update public.posts set pinned_at = case when pin then now() else null end where id = pid;
  if not found then
    raise exception 'post not found';
  end if;
end $$;

revoke execute on function public.admin_set_pinned(bigint, boolean) from public, anon;
grant execute on function public.admin_set_pinned(bigint, boolean) to authenticated;

-- 글을 쓸 때 pinned_at을 직접 넣어 스스로 고정하지 못하도록, 쓸 수 있는 칸을 제한
revoke insert on public.posts from authenticated;
grant insert (board, category, title, body, author_id) on public.posts to authenticated;
