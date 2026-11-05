"use client";

import { useState } from "react";

type Role = "student" | "teacher";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export default function SignupForm() {
  const [role, setRole] = useState<Role>("student");
  const [consent, setConsent] = useState(false);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <div>
        <p className="mb-2 font-medium">가입 유형</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["student", "🎓 아동보육과 재학생"],
              ["teacher", "🧸 현장 보육교사"],
            ] as const
          ).map(([v, label]) => (
            <button
              type="button"
              key={v}
              onClick={() => setRole(v)}
              className={`rounded-xl border px-4 py-3 font-medium ${role === v ? "border-brand bg-soft text-brand-dark" : "border-line bg-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">닉네임</span>
        <input className={input} placeholder="커뮤니티에서 보여질 이름" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">이메일</span>
        <input type="email" className={input} placeholder="example@email.com" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">비밀번호</span>
        <input type="password" className={input} placeholder="8자 이상" />
      </label>

      {role === "student" ? (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">재학 인증</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학교명 · 학과</span>
            <input className={input} placeholder="예: ○○대학교 아동보육과" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학생증 뒷면 사진</span>
            <input type="file" accept="image/*" className="block w-full text-sm" />
          </label>
          <p className="rounded-lg bg-soft p-3 text-xs">
            학과 확인에 필요한 부분(학교명, 학과, 유효기간)만 보이게 찍어 주세요. 학번, 바코드,
            주민등록번호 등은 가리고 올려 주세요.
          </p>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold">교사 인증</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">근무 기관 유형 (선택)</span>
            <input className={input} placeholder="예: 국공립 어린이집" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">보육교사 자격증 또는 보육과정 이수 증빙</span>
            <input type="file" accept="image/*,application/pdf" className="block w-full text-sm" />
          </label>
          <p className="rounded-lg bg-soft p-3 text-xs">
            자격 확인에 필요한 정보(성명, 자격 등급, 발급 기관)만 보이게 올려 주세요. 주민등록번호
            뒷자리, 주소 등은 가려 주세요.
          </p>
        </section>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        <span>
          [필수] 자격 확인을 위해 올린 서류를 수집·이용하는 것에 동의합니다. 서류는 확인 목적으로만 쓰이고,
          승인 또는 반려 후 삭제됩니다.
        </span>
      </label>

      <button
        type="submit"
        disabled
        className="w-full cursor-not-allowed rounded-full bg-foreground/20 px-6 py-3 font-medium text-foreground/60"
      >
        가입 기능 준비 중
      </button>
      <p className="text-center text-xs text-foreground/60">
        회원가입 기능은 곧 열릴 예정입니다. 지금 입력한 내용은 저장되거나 전송되지 않습니다.
      </p>
    </form>
  );
}
