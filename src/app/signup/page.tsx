import PageTitle from "@/components/PageTitle";
import SignupForm from "@/components/SignupForm";

export const metadata = { title: "회원가입 | 보육시각" };

export default function Signup() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageTitle title="회원가입" desc="재학생과 현장 교사가 함께 이야기 나누는 공간이에요. 서류 제출 없이 이메일로 가입할 수 있어요." />
      <SignupForm />
    </div>
  );
}
