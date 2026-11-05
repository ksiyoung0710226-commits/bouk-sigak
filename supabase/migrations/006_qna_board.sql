-- 교사 노하우(tips) 게시판 → Q&A(qna) 게시판으로 전환
-- 재학생·교사 모두 질문하고 답변(댓글)할 수 있다. 인증 교사의 답변은 화면에서 표시로 구분한다.
-- (전환 시점에 tips 글은 0개였음)

delete from public.posts where board = 'tips';

alter table public.posts drop constraint posts_board_check;
alter table public.posts add constraint posts_board_check check (board in ('community', 'qna'));

drop policy posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = auth.uid() and board in ('community', 'qna'));

-- 더 이상 쓰지 않는 함수
drop function public.can_write_tips();
