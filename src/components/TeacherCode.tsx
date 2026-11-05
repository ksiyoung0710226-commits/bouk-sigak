"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export default function TeacherCode() {
  const { profile, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  // 현장교사로 가입했지만 아직 인증하지 않은 회원에게만 보여 줍니다.
  if (profile?.kind !== "teacher" || profile.teacher_verified) return null;

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.rpc("redeem_teacher_code", { code });
    if (error || !data) return setMsg("코드가 맞지 않아요. 다시 확인해 주세요.");
    setMsg("");
    await refreshProfile();
  }

  return (
    <form onSubmit={redeem} className="mb-4 card-sm p-4 text-sm">
      <p className="mb-2 font-medium">교사 인증 코드를 입력하면 내 답변에 ‘✅ 인증 교사 답변’ 표시가 붙어요.</p>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="인증 코드"
          className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand" />
        <button className="shrink-0 rounded-full bg-brand px-4 text-white">확인</button>
      </div>
      {msg && <p className="mt-2 text-red-700">{msg}</p>}
    </form>
  );
}
