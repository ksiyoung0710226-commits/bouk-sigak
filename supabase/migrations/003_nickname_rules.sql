-- 닉네임 규칙 (화면 검증과 별개로 DB가 최종 방어선)
-- 1) 앞뒤 공백 없음, 연속 공백 없음, 제어문자·보이지 않는 문자 금지
-- 2) 한글(자모 포함)·영문·숫자가 하나 이상 있어야 함 (특수문자만으로는 불가)
alter table public.profiles add constraint nickname_format check (
  nickname = btrim(nickname)
  and nickname !~ '  '
  and nickname ~ '[ㄱ-ㅎㅏ-ㅣ가-힣A-Za-z0-9]'
  and nickname !~ '[[:cntrl:]]'
  and nickname !~ ('[' || chr(8203) || '-' || chr(8205) || chr(65279) || chr(160) || ']')
);

-- 3) 중복 금지: 대소문자와 띄어쓰기를 무시하고 같으면 같은 닉네임으로 본다
create unique index profiles_nickname_unique on public.profiles (lower(replace(nickname, ' ', '')));

-- 4) 가입 전에도 사용 가능 여부를 물을 수 있는 함수 (결과는 true/false만 돌려줌)
create function public.nickname_available(nick text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.profiles
    where lower(replace(nickname, ' ', '')) = lower(replace(btrim(nick), ' ', ''))
      and id is distinct from auth.uid()
  )
$$;
revoke execute on function public.nickname_available(text) from public;
grant execute on function public.nickname_available(text) to anon, authenticated;
