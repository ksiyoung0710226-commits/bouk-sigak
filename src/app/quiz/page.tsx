import PageTitle from "@/components/PageTitle";
import QuizBoard from "@/components/QuizBoard";

export const metadata = { title: "퀴즈 | educare insight" };

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="퀴즈" desc="배운 내용을 퀴즈로 확인해 보세요. 보기를 누르면 바로 정답과 해설이 나와요. 로그인하지 않아도 풀 수 있어요." />
      <QuizBoard />
    </div>
  );
}
