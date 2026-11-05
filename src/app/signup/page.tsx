import PageTitle from "@/components/PageTitle";
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "회원가입 | 보육시각" };

export default function Signup() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageTitle
        title="회원가입"
        desc="재학생과 현장 교사만 모인 안전한 공간을 위해 간단한 인증을 진행해요. 관리자가 확인한 뒤 승인됩니다."
      />
      <SignupForm />
    </div>
  );
}
