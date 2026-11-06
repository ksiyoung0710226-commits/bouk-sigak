import PageTitle from "@/components/PageTitle";
import { Article, CONTACT_EMAIL, LegalFooter } from "@/components/LegalDoc";

export const metadata = { title: "개인정보 처리방침 | 보육시각" };

const th = "border border-line bg-lav/40 px-2 py-1.5 text-left align-top";
const td = "border border-line px-2 py-1.5 align-top";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="개인정보 처리방침" desc="보육시각이 어떤 정보를, 왜, 얼마나 보관하는지 알려 드려요." />
      <div className="card space-y-7 p-6 sm:p-8">
        <p className="text-[15px] leading-relaxed">보육시각(이하 ‘사이트’)은 「개인정보 보호법」에 따라 회원의 개인정보를 보호하고, 관련 고충을 신속하게 처리하기 위해 다음과 같이 처리방침을 둡니다.</p>

        <Article n={1} title="수집하는 개인정보와 목적">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr><th className={th}>구분</th><th className={th}>항목</th><th className={th}>목적</th></tr></thead>
              <tbody>
                <tr><td className={td}>필수(공통)</td><td className={td}>이메일, 비밀번호(암호화 저장), 닉네임, 가입 유형(재학생/현장 교사)</td><td className={td}>회원 식별, 로그인, 이메일 인증, 공지·신고 처리 결과 안내</td></tr>
                <tr><td className={td}>필수(재학생)</td><td className={td}>재학 중인 학교·학과</td><td className={td}>재학생 확인 표시, 회원 간 소개(공개 설정 시)</td></tr>
                <tr><td className={td}>선택(재학생)</td><td className={td}>학번</td><td className={td}>운영자의 재학생 확인(본인·운영자만 열람)</td></tr>
                <tr><td className={td}>필수(현장 교사)</td><td className={td}>근무 지역(시·도), 어린이집 분류</td><td className={td}>현장 교사 표시, 회원 간 소개(공개 설정 시)</td></tr>
                <tr><td className={td}>이용 중 생성</td><td className={td}>게시글·댓글, 1:1 채팅·문의 내용, 신고 내용, 이용 정지 기록, 쿠폰 추첨 기록, 가입일·최근 로그인 시각, 접속 기록(IP 등, 호스팅·DB 업체가 보안 목적으로 자동 기록)</td><td className={td}>서비스 제공, 부정 이용 방지, 신고 처리, 이벤트 상품 전달</td></tr>
              </tbody>
            </table>
          </div>
          <p>재학 증명서·자격증 등 서류는 받지 않습니다. 만 14세 미만은 가입할 수 없습니다.</p>
        </Article>

        <Article n={2} title="보유 기간과 파기">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 정보와 게시물·채팅·문의: <b>탈퇴(또는 강제 탈퇴) 즉시 삭제</b>합니다.</li>
            <li>신고 처리 기록(신고 이유, 신고 당시 게시물·채팅 메시지 내용과 작성자 닉네임, 처분 내용): 분쟁 대응을 위해 <b>처리 완료 후 1년</b> 보관한 뒤 자동으로 삭제합니다. 신고한 회원이 탈퇴하면 그 회원의 신고 기록은 바로 삭제됩니다.</li>
            <li>이용 정지 기록: 정지가 풀리거나 탈퇴하면 삭제됩니다.</li>
            <li>삭제된 정보는 복구할 수 없는 방법으로 지웁니다. 다만 업체의 백업 데이터에는 업체 정책에 따라 짧은 기간 남아 있을 수 있습니다.</li>
          </ul>
        </Article>

        <Article n={3} title="공개 범위">
          <p>닉네임, 가입 유형, 그리고 공개로 설정한 학교·학과 또는 근무 지역·어린이집 분류는 커뮤니티·Q&amp;A 글과 함께 사이트 방문자 누구에게나 보입니다. 이메일과 학번은 공개되지 않습니다. 공개 여부는 <b>내 정보</b>에서 언제든 바꿀 수 있습니다.</p>
        </Article>

        <Article n={4} title="제3자 제공">
          <p>사이트는 회원의 개인정보를 다른 곳에 제공하거나 판매하지 않습니다. 법령에 따라 수사기관 등이 정당한 절차로 요청하는 경우에만 예외로 합니다.</p>
        </Article>

        <Article n={5} title="처리 위탁과 국외 이전">
          <p>사이트 운영을 위해 아래 업체의 서비스를 이용하며, 이 과정에서 개인정보가 해외 서버에 저장·전송됩니다. 정보는 서비스를 이용할 때 인터넷(암호화 통신)으로 전송되며, 보유 기간은 제2조와 같습니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr><th className={th}>업체(국가)</th><th className={th}>맡기는 일</th><th className={th}>이전되는 항목·저장 위치</th></tr></thead>
              <tbody>
                <tr><td className={td}>Supabase Inc. (미국)</td><td className={td}>회원 로그인, 데이터베이스</td><td className={td}>제1조의 모든 항목 · 싱가포르 데이터센터</td></tr>
                <tr><td className={td}>Vercel Inc. (미국)</td><td className={td}>웹사이트 호스팅</td><td className={td}>접속 기록, 요청 처리 중 거치는 정보 · 미국 등</td></tr>
                <tr><td className={td}>Google LLC (미국)</td><td className={td}>메일 발송(Gmail): 가입 인증, 비밀번호 재설정, 신고 처리 안내</td><td className={td}>이메일, 닉네임, 메일 내용 · 미국 등</td></tr>
                <tr><td className={td}>(주)카카오 (대한민국)</td><td className={td}>운영자에게 보내는 새 가입·문의·신고 알림(카카오톡)</td><td className={td}>닉네임, 문의 제목·내용 일부, 신고 이유 일부</td></tr>
              </tbody>
            </table>
          </div>
          <p>국외 이전을 원하지 않으면 가입하지 않거나 탈퇴할 수 있습니다. 다만 위 서비스 없이는 사이트를 운영할 수 없어 이용이 불가능합니다.</p>
        </Article>

        <Article n={6} title="회원의 권리">
          <p>회원은 언제든지 자신의 개인정보를 열람·수정·삭제하거나 처리 정지를 요구할 수 있습니다. 대부분은 <b>내 정보</b>에서 직접 할 수 있고(닉네임·학교·지역·공개 여부·이메일·비밀번호 변경, 탈퇴), 그 밖의 요청은 아래 연락처로 보내 주시면 지체 없이 처리합니다.</p>
        </Article>

        <Article n={7} title="안전성 확보 조치">
          <ul className="list-disc space-y-1 pl-5">
            <li>비밀번호는 암호화되어 저장되며 운영자도 볼 수 없습니다.</li>
            <li>데이터베이스 접근 규칙으로 본인·운영자만 볼 수 있는 정보(이메일, 학번, 비공개 정보, 1:1 문의)를 구분합니다. 회원끼리의 1:1 채팅 내용은 운영자도 볼 수 없습니다. 다만 회원이 특정 채팅 메시지를 신고하면, 운영자는 처리를 위해 신고된 그 메시지만 확인합니다.</li>
            <li>모든 통신은 암호화(HTTPS)됩니다.</li>
          </ul>
        </Article>

        <Article n={8} title="쿠키 등">
          <p>사이트는 로그인 유지와 ‘이메일 저장’ 기능을 위해 브라우저 저장소(localStorage·sessionStorage)를 사용합니다. 광고·추적용 쿠키는 쓰지 않습니다. 브라우저 설정에서 저장된 정보를 지울 수 있으며, 지우면 다시 로그인해야 합니다.</p>
        </Article>

        <Article n={9} title="개인정보 보호책임자와 문의">
          <p>개인정보 보호책임자: 보육시각 운영자 · 이메일 {CONTACT_EMAIL} · 사이트 ‘💌 문의하기’</p>
          <p>개인정보 침해에 대한 상담은 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr), 개인정보분쟁조정위원회(1833-6972, kopico.go.kr)에도 할 수 있습니다.</p>
        </Article>

        <Article n={10} title="처리방침의 변경">
          <p>이 방침을 바꿀 때는 시행 7일 전부터 사이트에 알립니다.</p>
        </Article>
        <LegalFooter />
      </div>
    </div>
  );
}
