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
- `src/app/knowledge/[subject]/[unit]` : 과목 → 단원 화면.
- `/curriculum` : [년도별 | 표준보육과정 | 누리과정] 탭(`CurriculumTabs`). 개정 이력은 `src/lib/curriculum-history.ts`(1차~2024 개정 표준보육과정, 5세·3~5세·2015·2019 누리과정, 공식 자료로 확인한 사실만, 미확인 날짜는 null). **현재 적용 중 = 시행일이 오늘(KST) 이전인 최신 판**(페이지가 1시간마다 재계산) → 그 판만 원문(fullText, curriculum.ts) 표시, 나머지는 요약. 새 개정판이 나오면 history에 시행일과 함께 추가하고 원문을 curriculum.ts에 넣어 fullText로 연결(사용자 요청: '현재 적용 과정은 항상 원문, 그때그때 다르게'). law.go.kr 행정규칙 페이지는 스크립트로 열려 출처로 못 씀.
- 커뮤니티/Q&A/가입/로그인: `src/components/BoardView.tsx`, `SignupForm.tsx`, `AuthProvider.tsx` 등. 커뮤니티와 Q&A는 **비회원도 읽기 가능**(017, 과제 제출용으로 사용자 요청: anon에 posts/comments 및 profiles(id,nickname,kind,teacher_verified)·공개 profile_details 열만 select 허용). 글·댓글·신고·채팅은 회원만(RLS). 되돌리려면 017의 anon 정책·grant 제거 + community/qna 페이지에 RequireAuth 복구.
- Q&A `/qna` (예전 '교사 노하우' `/tips` → 리다이렉트, 006에서 board 'tips'→'qna'): 모든 회원이 질문·답변 가능. 답변 = comments. 인증 교사(kind=teacher & teacher_verified) 답변에 '✅ 인증 교사 답변' 표시. 미인증 교사에게만 TeacherCode 입력칸 노출.
- 보육 뉴스 `/news`: `src/lib/news.ts`가 구글 뉴스 RSS(보육/어린이집/보육교사/영유아, 최근 7일) 제목·언론사·날짜·링크만 가져와 `use cache` + cacheLife(revalidate 5분)로 갱신. 기사 본문은 가져오지 않음. 링크는 news.google.com만 허용.
- 1:1 문의 `/inquiry` (007): 테이블 inquiries + inquiry_messages. 회원은 자기 문의만, 관리자는 전체(RLS). 메시지 insert 트리거가 status(open/answered)와 admin_unread/user_unread 갱신. RPC `mark_inquiry_read`, `set_inquiry_closed`. 헤더 `InquiryLink`: 비로그인·일반회원 '💌 문의하기'(로그인/로그아웃 옆), 관리자 '📮 문의함' + 안 읽은 수 배지(1분마다·포커스 시 확인). 관리자에게는 카카오톡 알림(아래).
- 글 고정(008): `posts.pinned_at`, RPC `admin_set_pinned`(관리자만). 회원 insert는 컬럼 제한(board,category,title,body,author_id)으로 스스로 고정 불가.
- 게시판 글 보기: 제목/미리보기 클릭 → 화면 전체 `PostModal`(Esc·닫기). 작성자 줄(`AuthorLine`)에 공개된 학교/지역·유형 표시 + '💬 1:1 채팅' 버튼.
- 회원 추가 정보(009): `profile_details`(school | region+center_type, is_public). 가입 트리거가 메타데이터에서 저장(잘못된 값은 버림). 비공개면 본인·관리자만 조회(RLS). 값 목록은 `src/lib/member-info.ts`와 DB check를 같이 바꿀 것. `/profile`에서 수정·공개 전환, 관리자 목록에 표시.
- 학교 검증(010): 재학생은 `SchoolPicker`로 학교+학과 검색 선택(줄임말 '한양여대' 등 지원). 목록 = `src/lib/schools-data.ts`(대학알리미 대학별 학과정보 2023.6.14, data.go.kr 15014632에서 생성: 폐지 아닌 학사·전문학사 중 표준분류 소계열 유아교육/아동·가족학, 학과명 '보육', 사회복지학 중 아동·유아·영유아 → 212개교 340학과) = DB `school_majors`. DB 트리거 `verify_school`이 목록에 있으면 `school_verified`=true → 이름 옆 ✓. '목록에 없어요'로 직접 입력 가능(✓ 없음). 목록 갱신 시 두 곳을 같이 바꿀 것.
- 학번(011): `profile_private.student_no`(선택, 영문·숫자·하이픈 4~20자). 공개 설정과 무관하게 본인·관리자만 조회. 가입 시 재학생만 저장, `/profile`에서 수정, 관리자 목록에 표시·검색.
- 교사 근무지: `CenterPicker` ① 지역 → ② 어린이집 분류(유형) 버튼. 어린이집 이름은 받지 않음(사용자 결정).
- 회원 관리 목록은 재학생 / 현장교사 두 칸, 검색은 두 칸에 함께 적용. `/profile`은 max-w-5xl, 관리자 칸만 넓고 나머지 폼은 max-w-2xl.
- 회원 1:1 채팅(009) `/chat`: `dm_threads`(요청 멘트 intro, pending→accepted/declined, 같은 두 사람 사이 1개·거절 후 재요청 불가) + `dm_messages`(수락 후에만). RPC `respond_dm`, `mark_dm_read`. 관리자도 대화 내용은 못 봄. 헤더 `ChatLink` 배지(받은 요청+안 읽은 대화), 대화방은 5초마다 새로고침.
- 관리자 → 회원 1:1 메시지(012, 상품 전달용): 회원 관리 카드의 '💬 1:1 메시지' → RPC `admin_start_inquiry`(관리자만)로 inquiries 방 생성(`started_by_admin`), 수락 없이 전달. 회원은 '💌 문의하기'에서 알림과 함께 받고 답장 가능, 목록에 '📮 관리자 메시지' 표시.
- 랜덤 행사 쿠폰(013): `/profile#admin-coupons` `AdminCoupons`(관리자만, 회원 관리 카드 안 맨 아래, 헤더 '🎲 회원 추첨'). ① 대상(재학생/교사 칸, 개별 체크 해제) ② 인원 먼저 설정(행사 이름·쿠폰 칸은 사용자 요청으로 없앰, 기록 이름은 날짜 자동)(0이면 추첨 불가) → RPC `admin_draw_coupons`가 DB에서 `order by random()`으로 추첨·쿠폰번호(BOYUK-XXXX-XXXX) 발급, 관리자 제외, 기록(coupon_events/coupon_winners) 남음. `admin_message_winners`로 당첨자 전원에게 1:1 메시지({닉네임},{쿠폰},{쿠폰번호} 치환, 보낸 사람은 건너뜀).
- 홈 상단 버튼은 '보육시각이란?' 하나 → `/about` 소개 페이지(사용자 요청으로 '커뮤니티 둘러보기', '보육과정 보기' 제거).
- Q&A 상단 파란 형광펜 공지: 답변자 매달 2명 추첨 스타벅스 5천 원 쿠폰(사용자 요청 문구).
- `/knowledge` 제목 아래 파란 형광펜(`.hl-blue`) 안내: '전공 서적을 참고' 문구(사용자 요청).
- 신고 관리(014·015): 신고 시 `ReportDialog`(BoardView)에서 이유 선택(필수)+상세 → reason="[이유] 상세". insert 트리거가 신고 당시 내용 스냅숏(target_author_nickname/title/body) 저장, FK는 on delete set null(글 삭제·강제 탈퇴 후에도 기록 유지). 회원은 insert 컬럼 제한(post_id,comment_id,reporter_id,reason). `/profile#admin-reports` `AdminReports`(헤더 '🚩 신고 관리'+대기 수 배지 `ReportLink`): 대기 중/처리 완료 탭, 처분(조치 없음·경고·게시물 삭제·7일/30일/영구 정지·강제 탈퇴, 목록 `src/lib/report-actions.ts`↔DB check 같이 수정) + '게시물도 삭제' + 판단 메모 + 작성자에게 1:1 메시지(admin_start_inquiry). '처리 완료' → `POST /api/admin/reports`(관리자 토큰으로 RPC `admin_resolve_report`, 같은 대상 대기 신고도 함께 처리) → 신고자에게 Gmail SMTP 메일(문구: '{닉네임}님의 신고 처리가 완료되었습니다 / '{처분}' 처분을 내렸습니다 / 보육시각을 이용해주셔서 감사합니다'), notified_at 기록, 실패 시 '다시 보내기'. 처리 완료 1년 후 pg_cron이 자동 삭제(개인정보 처리방침과 일치).
- 이용 정지: `profiles.suspended_until`('infinity'=영구). restrictive RLS로 posts/comments/dm_threads/dm_messages insert 차단(1:1 문의는 허용). 화면 안내는 `suspensionText`(lib/supabase.ts). 정지 해제 RPC `admin_unsuspend`(신고 카드의 '정지 풀기'), 만료된 정지는 pg_cron이 매일 null로.
- 카카오톡 관리자 알림(015): DB 트리거(새 profiles, reports, 관리자 아닌 사람의 inquiry_messages) → `notify_admin()` → pg_net → `POST /api/notify`(헤더 x-notify-secret = DB app_secrets 'notify_secret' = Vercel env NOTIFY_SECRET) → 카카오 '나에게 보내기'. 토큰은 app_secrets(kakao_access_token/expires/refresh_token), 서버는 NOTIFY_SECRET으로 보호된 RPC `notify_get_kakao`/`notify_save_kakao`로만 접근(service_role 안 씀). 연결: `/profile#admin-kakao` `AdminKakao` → `/api/kakao/connect` → 카카오 로그인 → `/api/kakao/callback`. 필요 env: KAKAO_REST_KEY, (선택) KAKAO_CLIENT_SECRET. 카카오 앱 설정: 카카오 로그인 활성화, Redirect URI `https://boyuk-insight.vercel.app/api/kakao/callback`, 동의항목 '카카오톡 메시지 전송(talk_message)', 플랫폼 Web 사이트 도메인 `https://boyuk-insight.vercel.app`.
- 메일: Gmail SMTP(앱 비밀번호). `.env.local`의 SMTP_USER/SMTP_PASS → `scripts/setup-email.sh`가 Supabase Auth SMTP+한글 템플릿(supabase/templates/*.html, Management API, CLI 키체인 토큰 사용)과 Vercel env 등록. 서버 메일 코드 `src/lib/server/mail.ts`.
- 비밀번호 찾기 `/forgot-password` → 메일 → `/reset-password`. 로그인에서 미인증이면 '인증 메일 다시 받기'.
- `/terms` 이용약관, `/privacy` 개인정보 처리방침(시행일 2026-11-06, 연락처 상수는 `src/components/LegalDoc.tsx`). 푸터 링크, 가입 동의 문구(만 14세 이상, 국외 이전 포함)에 연결. 위탁: Supabase·Vercel·Google(Gmail)·카카오 — 업체를 바꾸면 방침도 수정.
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
- 탈퇴: `delete_my_account()`(004) → auth.users 삭제 → profiles/posts/comments/내가 한 신고 cascade 삭제(내 글에 대한 신고는 스냅숏으로 남음). 내 글에 달린 남의 댓글도 함께 지워짐(사용자에게 안내함).
- 로그인: '이메일 저장'(localStorage), '자동 로그인'(켜면 localStorage, 끄면 sessionStorage에 세션 저장, `src/lib/supabase.ts`). 비밀번호는 사이트가 저장하지 않고 브라우저 비밀번호 저장 기능(autocomplete 속성)에 맡김.
- 신고 버튼은 글·댓글 모두 닉네임 바로 옆(`AuthorLine` in BoardView). 내 글에는 신고 버튼 없음.
- 관리자 회원 관리: `/profile` 내 정보 칸 바로 아래 `AdminMembers` 컴포넌트(`src/components/AdminMembers.tsx`, 관리자에게만 렌더링; 헤더 "🛠 회원 관리" → `/profile#admin-members`): 회원 목록(이메일·닉네임·유형·가입일·최근 로그인·글/댓글 수, 검색), 강제 탈퇴(닉네임 입력 확인). DB 함수 `admin_list_members()`, `admin_delete_member(uuid)`(005) — 관리자 여부를 DB가 확인. 본인·다른 관리자는 삭제 불가.

## 남은 할 일
1. (2026-11-06 배포 완료) 신고 관리·정지·카카오 알림·약관·비밀번호 찾기. git push 시 Vercel 자동 배포도 됨(프로젝트 2개에 배포됨).
2. 사용자 작업 대기: ① Gmail 앱 비밀번호 → .env.local에 SMTP_USER/SMTP_PASS → `scripts/setup-email.sh` → 재배포 ② 카카오 개발자 앱 등록 → KAKAO_REST_KEY(및 client secret) Vercel env → 재배포 → 관리자 화면에서 '카카오톡으로 알림 받기 연결'.
3. 약관·처리방침은 초안. (2026-11-06) 1:1 채팅 신고·차단(016: dm_threads.blocked_by, RPC block_dm/unblock_dm, reports.dm_message_id/dm_thread_id) DB 적용·배포 완료.
4. 교사 초대코드 변경은 DB `app_secrets` 표(key='teacher_code') 업데이트. 코드는 사용자에게 따로 전달했음.
5. (선택) 다른 페이지 제목도 로고와 같은 부드러운 글꼴로 맞출지 사용자에게 확인.

## 작업 환경 메모
- node/npx는 PATH에 없음: 명령 앞에 `export PATH=~/.local/node22/bin:$PATH` 를 붙일 것.
- 원래 개발 컴퓨터는 macOS 12라 Playwright 미지원. 화면 캡처는 Chrome for Testing 138 로 했음. 새 컴퓨터에서는 필요 없으면 생략.
