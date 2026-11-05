-- 가입 트리거 함수는 트리거로만 실행되면 되므로 API(rpc) 호출 권한을 모두 제거
revoke execute on function public.handle_new_user() from anon, authenticated, public;
