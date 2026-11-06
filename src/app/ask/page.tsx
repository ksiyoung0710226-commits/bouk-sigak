import PageTitle from "@/components/PageTitle";
import AskAI from "@/components/AskAI";

export const metadata = { title: "AI에게 질문하기 | educare insight" };

export default function AskPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="AI에게 질문하기" desc="보육·유아교육에 특화된 AI에게 질문해 보세요. 아동 필수 지식 197개 단원, 표준보육과정·누리과정 원문, 예비 재학생 질문 모음집을 바탕으로 답해요." />
      <AskAI />
    </div>
  );
}
