-- 017: 커뮤니티·Q&A 글과 댓글을 비회원(anon)도 읽을 수 있게 한다(과제 제출용 공개).
-- 글쓰기·댓글·신고·1:1 채팅은 여전히 로그인한 회원만 가능(insert 정책은 authenticated 그대로).
-- 비회원에게는 작성자 줄에 필요한 열만 연다: 닉네임·회원 유형·교사 인증 여부, 공개로 설정한 학교/지역 정보.
-- 이메일, 관리자 여부, 정지 기간, 비공개 정보는 비회원에게 보이지 않는다.

grant select (id, board, category, title, body, author_id, created_at, pinned_at) on public.posts to anon;
grant select (id, post_id, body, author_id, created_at) on public.comments to anon;
grant select (id, nickname, kind, teacher_verified) on public.profiles to anon;
grant select (user_id, school, major, school_verified, region, center_type, is_public) on public.profile_details to anon;

create policy posts_read_anon on public.posts for select to anon using (true);
create policy comments_read_anon on public.comments for select to anon using (true);
create policy profiles_read_anon on public.profiles for select to anon using (true);
create policy profile_details_read_anon on public.profile_details for select to anon using (is_public);
