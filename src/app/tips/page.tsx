"use client";

import PageTitle from "@/components/PageTitle";
import RequireAuth from "@/components/RequireAuth";
import BoardView from "@/components/BoardView";
import TeacherCode from "@/components/TeacherCode";
import { useAuth } from "@/components/AuthProvider";

function Inner() {
  const { profile } = useAuth();
  const canWrite = !!profile && (profile.is_admin || (profile.kind === "teacher" && profile.teacher_verified));
  return (
    <BoardView
      board="tips"
      categories={["놀이자료 활용", "추천 방법", "환경 구성", "부모 소통", "기타 노하우"]}
      canWrite={canWrite}
      writeHint={<TeacherCode />}
    />
  );
}

export default function Tips() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="교사 노하우" desc="현장 교사가 놀이자료 활용 방법과 추천 노하우를 공유하는 공간입니다." />
      <RequireAuth><Inner /></RequireAuth>
    </div>
  );
}
