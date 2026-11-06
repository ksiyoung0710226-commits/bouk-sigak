"use client";

import PageTitle from "@/components/PageTitle";
import BoardView from "@/components/BoardView";
import TeacherCode from "@/components/TeacherCode";

export default function Qna() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle
        title="Q&A"
        desc="재학생은 실습·수업·현장에 대해 궁금한 점을 묻고, 현장 교사는 경험을 바탕으로 답해 주는 공간이에요. 누구나 질문하고 답변할 수 있어요."
      />
      <p className="mb-6 rounded-2xl border-2 border-ink bg-white p-4 text-base font-bold leading-relaxed">
        📢 공지 ·{" "}
        <span className="hl-blue">답변을 해 주시는 분들께는 매달 2명씩 추첨하여 스타벅스 5천 원 쿠폰을 지급해 드립니다.</span>
      </p>
      <>
        <TeacherCode />
        <BoardView
          board="qna"
          categories={["예비 재학생", "실습", "보육과정·수업", "놀이·교재교구", "영유아 지도·발달", "부모 소통", "취업·진로", "기타"]}
          canWrite
        />
      </>
    </div>
  );
}
