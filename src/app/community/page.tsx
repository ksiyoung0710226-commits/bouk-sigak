"use client";

import PageTitle from "@/components/PageTitle";
import BoardView from "@/components/BoardView";

export default function Community() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="커뮤니티" desc="재학생과 현장 교사가 고민을 나누고 서로 응원하는 공간입니다." />
      <>
        <BoardView board="community" categories={["고민상담", "조언", "응원", "실습 이야기", "기타"]} canWrite />
      </>
    </div>
  );
}
