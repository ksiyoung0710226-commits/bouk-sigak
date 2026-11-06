import nodemailer, { type Transporter } from "nodemailer";

// Gmail SMTP(앱 비밀번호)로 메일을 보낸다. Vercel 환경 변수 SMTP_USER, SMTP_PASS 필요.
export const mailReady = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | null = null;
function getTransport() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// educare insight 색(버터 옐로우·차콜·라벤더)으로 꾸민 간단한 메일 틀
export function layout(lines: string[]) {
  const body = lines.map((l) => `<p style="font-size:16px;line-height:1.8;margin:0 0 12px">${esc(l)}</p>`).join("");
  return `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:480px;margin:0 auto;padding:28px;color:#29251F;background:#fff1b0;border:2px solid #29251F;border-radius:16px;box-shadow:6px 6px 0 #C9B9E8">
<h2 style="margin:0 0 18px;font-size:22px">🌱 educare insight</h2>${body}
<p style="font-size:12px;color:#5c5548;margin:20px 0 0">이 메일은 발신 전용입니다. 문의는 사이트의 '💌 문의하기'를 이용해 주세요.<br/>https://educare-insight.vercel.app</p></div>`;
}

export async function sendMail(to: string, subject: string, lines: string[]) {
  await getTransport().sendMail({
    from: { name: "educare insight", address: process.env.SMTP_USER! },
    to,
    subject,
    text: lines.join("\n\n"),
    html: layout(lines),
  });
}
