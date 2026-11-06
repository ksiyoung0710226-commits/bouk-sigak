import PageTitle from "@/components/PageTitle";
import AskAI from "@/components/AskAI";

export const metadata = { title: "AI에게 질문하기 | educare insight" };

export default function AskPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="AI에게 질문하기" desc="보육·유아교육에 특화된 AI에게 질문해 보세요. 아동 필수 지식 197개 단원, 표준보육과정·누리과정 원문, 예비 재학생 질문 모음집 등 공식 자료로 확인된 내용으로만 답하고, 모든 답에 출처와 링크를 붙여요." />
      <AskAI />
    </div>
  );
}
