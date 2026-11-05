# 보육시각 프로젝트 인수인계 (Claude용)

아동보육과 재학생과 현장 보육교사를 위한 학습·커뮤니티 사이트. 사용자는 비전공자(학생)이므로 설명은 쉽게, 모르는 용어는 풀어서 말할 것.

## 주소와 계정
- 사이트: https://boyuk-insight.vercel.app (예전 주소 bouk-sigak.vercel.app 도 열림)
- 코드 저장소(비공개): https://github.com/ksiyoung0710226-commits/bouk-sigak
- 배포: Vercel 프로젝트 이름 `boyuk-insight`. `npx vercel deploy --prod --yes` 로 배포(GitHub push만으로는 자동 배포되지 않을 수 있음. 확인할 것)
- 데이터베이스: Supabase 프로젝트 ref `soiiihaivulcqqomzotb` (리전 싱가포르)
- 환경 변수(.env.local, git에 없음): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (둘 다 공개용 값). service_role / secret 키는 절대 코드나 채팅에 쓰지 말 것.

## 기술
Next.js(App Router, 이 버전은 기존 지식과 다름. AGENTS.md 지시대로 node_modules/next/dist/docs 를 확인), TypeScript, Tailwind, Supabase(auth + DB).

## 구조
- `src/lib/knowledge/*.ts` : 필수지식 9개 과목, 144개 단원 본문(Subject → Unit → Section). 타입은 types.ts. 모든 단원에 keywords 필수.
- `src/lib/knowledge/sources.ts` : 과목별 출처(고시문·해설서 / 법령 / 공식 기관 / 학술 원전). 링크는 열리는 것만 넣을 것.
- `src/lib/curriculum.ts` : 교육부 고시문(제2024-23호) 원문에서 그대로 옮긴 보육과정 내용범주·내용. 문구를 임의로 바꾸지 말 것.
- `src/app/knowledge/[subject]/[unit]` : 과목 → 단원 화면. `/curriculum` : 보육과정 탭 화면.
- 커뮤니티/Q&A/가입/로그인: `src/components/BoardView.tsx`, `SignupForm.tsx`, `AuthProvider.tsx` 등. 커뮤니티와 Q&A는 **로그인한 회원만 볼 수 있고** 이는 DB 보안 규칙(RLS)이 강제함.
- Q&A `/qna` (예전 '교사 노하우' `/tips` → 리다이렉트, 006에서 board 'tips'→'qna'): 모든 회원이 질문·답변 가능. 답변 = comments. 인증 교사(kind=teacher & teacher_verified) 답변에 '✅ 인증 교사 답변' 표시. 미인증 교사에게만 TeacherCode 입력칸 노출.
- 보육 뉴스 `/news`: `src/lib/news.ts`가 구글 뉴스 RSS(보육/어린이집/보육교사/영유아, 최근 7일) 제목·언론사·날짜·링크만 가져와 `use cache` + cacheLife(revalidate 5분)로 갱신. 기사 본문은 가져오지 않음. 링크는 news.google.com만 허용.
- 1:1 문의 `/inquiry` (007): 테이블 inquiries + inquiry_messages. 회원은 자기 문의만, 관리자는 전체(RLS). 메시지 insert 트리거가 status(open/answered)와 admin_unread/user_unread 갱신. RPC `mark_inquiry_read`, `set_inquiry_closed`. 헤더 `InquiryLink`: 비로그인·일반회원 '💌 문의하기'(로그인/로그아웃 옆), 관리자 '📮 문의함' + 안 읽은 수 배지(1분마다·포커스 시 확인). 이메일 알림은 없음(커스텀 SMTP 필요).
- 홈 상단 버튼은 '보육시각이란?' 하나 → `/about` 소개 페이지(사용자 요청으로 '커뮤니티 둘러보기', '보육과정 보기' 제거).
- `/knowledge` 제목 아래 파란 형광펜(`.hl-blue`) 안내: '전공 서적을 참고' 문구(사용자 요청).
- DB 스키마: `supabase/migrations/*.sql`. 실행: `npx supabase db query --remote=soiiihaivulcqqomzotb --file <파일> --yes`

## 콘텐츠 규칙 (신뢰성이 최우선 — 사용자가 "무조건 신뢰할 만한 자료"를 요구함)
- 통계, 법 조항 번호, 금액, 교사 대 아동 비율, 검사 점수 기준, 약 용량, 응급처치 절차(CPR 등)는 쓰지 않는다.
- 월령 발달 시기는 "대략/개인차"를 붙이고 범위로. 교사는 진단하지 않는다(관찰·기록·소통·연계).
- 법·제도는 취지와 일반 원칙만, "최신 법령과 기관 지침 확인" 안내를 둔다.
- 새 내용을 쓰면 공식 자료(교육부, 보건복지부, 질병관리청, 국가법령정보센터, i-누리 등)로 대조하고, 실제로 연 페이지만 출처로 단다. 지어낸 출처 금지.
- 1·2차 검증을 거쳤으나 법 조문 원문은 대부분 직접 못 열어 검색 요약에 의존함. 공개 전 교재 대조 필요 항목: 아동건강교육(손 씻기 시점·방법), 아동학대·신고, 보육행정(법·제도), 프로젝트 접근법 3단계, 이차 정서 출현 시기, 볼비 단계 월령.

## 디자인 규칙 (사용자 확정)
- 배경 버터 옐로우 #fff1b0, 본문 차콜 #29251F, 카드 포인트 라벤더 #C9B9E8, 형광펜·키워드 라임 #D8EC77, 안내용 파란 형광펜 `.hl-blue` #a8dcff. 토큰은 `src/app/globals.css`.
- 카드: `.card`, 라벤더 하드 섀도. 키워드: `.kw`. 핵심 문장: `.note`, `.hl`.
- 로고 "보육시각": **차콜색 + 둥근 글꼴 Jua** (`.logo-font`). **글자에 검정 외곽선 금지, 흰 글씨 라벨 금지**(사용자가 싫어함). 다른 제목은 Noto Sans KR 굵게(`.sticker` = 외곽선 없는 차콜).
- 변경 후엔 반드시 배포하고 라이브에서 확인한 뒤 알릴 것(사용자가 배포 전 화면을 보고 혼란스러워한 적 있음).

## 회원 기능 (완료)
- 관리자: ksiyoung0710226@gmail.com (닉네임 '아보과 병아리') 지정 완료. 추가 지정: `update public.profiles set is_admin = true where id = (select id from auth.users where email = '...');`
- `/profile`: 닉네임 변경, 이메일 변경(기존·새 메일 양쪽 확인), 비밀번호 변경(현재 비밀번호 확인 후), 회원 탈퇴(모든 정보 삭제 경고 + '탈퇴합니다' 입력).
- 닉네임 규칙은 DB가 강제(003_nickname_rules.sql): 대소문자·띄어쓰기 무시 중복 금지, 한글/영문/숫자 1자 이상 필수(특수문자만 불가). 화면 검증은 `src/lib/nickname.ts` — 둘을 같이 바꿀 것.
- 탈퇴: `delete_my_account()`(004) → auth.users 삭제 → profiles/posts/comments/reports cascade 삭제. 내 글에 달린 남의 댓글도 함께 지워짐(사용자에게 안내함).
- 로그인: '이메일 저장'(localStorage), '자동 로그인'(켜면 localStorage, 끄면 sessionStorage에 세션 저장, `src/lib/supabase.ts`). 비밀번호는 사이트가 저장하지 않고 브라우저 비밀번호 저장 기능(autocomplete 속성)에 맡김.
- 신고 버튼은 글·댓글 모두 닉네임 바로 옆(`AuthorLine` in BoardView). 내 글에는 신고 버튼 없음.
- 관리자 회원 관리: `/profile` 내 정보 칸 바로 아래 `AdminMembers` 컴포넌트(`src/components/AdminMembers.tsx`, 관리자에게만 렌더링; 헤더 "🛠 회원 관리" → `/profile#admin-members`): 회원 목록(이메일·닉네임·유형·가입일·최근 로그인·글/댓글 수, 검색), 강제 탈퇴(닉네임 입력 확인). DB 함수 `admin_list_members()`, `admin_delete_member(uuid)`(005) — 관리자 여부를 DB가 확인. 본인·다른 관리자는 삭제 불가.

## 남은 할 일
1. 관리자용 신고 목록 화면(신고는 reports 표에 저장되지만 아직 볼 화면이 없음).
2. 인증 메일: 무료 기본 메일은 제목·발신자명 변경 불가, 시간당 한도 작음 → 여러 명 공유 전에 커스텀 SMTP(Resend 등) 연결 또는 인증 끄기 결정.
3. 개인정보 처리방침·이용약관 초안 작성(수집: 이메일, 닉네임, 가입 유형만. 서류는 받지 않음).
4. 교사 초대코드 변경은 DB `app_secrets` 표(key='teacher_code') 업데이트. 코드는 사용자에게 따로 전달했음.
5. (선택) 다른 페이지 제목도 로고와 같은 부드러운 글꼴로 맞출지 사용자에게 확인.

## 작업 환경 메모
- 원래 개발 컴퓨터는 macOS 12라 Playwright 미지원. 화면 캡처는 Chrome for Testing 138 로 했음. 새 컴퓨터에서는 필요 없으면 생략.
