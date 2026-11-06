"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

const RESULT: Record<string, string> = {
  ok: "✅ 카카오톡 연결 완료! 카톡 ‘나와의 채팅’에 확인 메시지가 갔어요.",
  denied: "카카오 로그인이 취소되었어요. 다시 시도해 주세요.",
  expired: "연결 시간이 지났어요(10분). 다시 눌러 주세요.",
  fail: "연결에 실패했어요. 카카오 개발자 설정(동의항목 ‘카카오톡 메시지 전송’, Redirect URI)을 확인해 주세요.",
};

async function call(body: object) {
  const { data: s } = await supabase.auth.getSession();
  const res = await fetch("/api/kakao/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({ error: "서버 응답을 읽지 못했어요." }));
}

export default function AdminKakao() {
  const { profile, loading } = useAuth();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdmin = !!profile?.is_admin;

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("admin_kakao_connected").then(({ data }) => {
      setConnected(data === true);
      const r = new URLSearchParams(window.location.search).get("kakao");
      if (r && RESULT[r]) setMsg(RESULT[r]);
    });
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  async function connect() {
    setBusy(true);
    const out = await call({});
    if (out.url) window.location.href = out.url;
    else { setBusy(false); setMsg(out.error ?? "연결 주소를 받지 못했어요."); }
  }
  async function test() {
    setBusy(true);
    const out = await call({ test: true });
    setBusy(false);
    setMsg(out.ok ? "✅ 시험 알림을 보냈어요. 카톡을 확인해 보세요." : out.error ?? "보내지 못했어요.");
  }

  return (
    <section id="admin-kakao" className="card scroll-mt-24 space-y-3 p-6">
      <h2 className="text-xl">🔔 카카오톡 알림 <span className="text-sm font-normal text-foreground/60">(관리자만 보여요)</span></h2>
      <p className="text-sm text-foreground/70">
        새 회원가입, 1:1 문의, 신고가 들어오면 연결한 카카오 계정의 ‘나와의 채팅’으로 알림이 와요.
      </p>
      <p className="text-sm">
        상태: {connected === null ? "확인 중…" : connected ? <b>✅ 연결됨</b> : <b className="text-red-700">아직 연결 안 됨</b>}
      </p>
      {msg && <p className="rounded-lg bg-lime/60 p-3 text-sm" role="status">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <button onClick={connect} disabled={busy} className="rounded-full border-2 border-ink bg-[#FEE500] px-4 py-1.5 text-sm font-bold disabled:opacity-50">
          {connected ? "카카오 계정 다시 연결" : "카카오톡으로 알림 받기 연결"}
        </button>
        {connected && (
          <button onClick={test} disabled={busy} className="rounded-full border border-ink bg-white px-4 py-1.5 text-sm disabled:opacity-50">시험 알림 보내기</button>
        )}
      </div>
    </section>
  );
}
