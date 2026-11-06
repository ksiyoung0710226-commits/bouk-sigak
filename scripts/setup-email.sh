#!/bin/zsh
# 메일 서버(Gmail SMTP) 연결: .env.local 의 SMTP_USER, SMTP_PASS 를 읽어
#  1) Supabase 로그인 메일(가입 인증·비밀번호 재설정 등)을 'educare insight' 이름 + 한글 제목/본문으로 보내게 설정
#  2) Vercel 에 SMTP_USER/SMTP_PASS 등록(신고 처리 안내 메일용)
# 비밀번호는 화면에 출력하지 않는다.
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/node22/bin:$PATH"
REF=soiiihaivulcqqomzotb
SMTP_USER=$(grep '^SMTP_USER=' .env.local | cut -d= -f2- | tr -d ' "')
SMTP_PASS=$(grep '^SMTP_PASS=' .env.local | cut -d= -f2- | tr -d ' "')
[[ -z "$SMTP_USER" || -z "$SMTP_PASS" ]] && { echo "SMTP_USER / SMTP_PASS 가 .env.local 에 없어요"; exit 1; }
T=$(security find-generic-password -s "Supabase CLI" -w)
[[ "$T" == go-keyring-base64:* ]] && T=$(echo "${T#go-keyring-base64:}" | base64 -d)

SMTP_USER="$SMTP_USER" SMTP_PASS="$SMTP_PASS" python3 - > /tmp/boyuk-auth-patch.json <<'PY'
import json, os
t = lambda f: open(f"supabase/templates/{f}.html", encoding="utf-8").read()
print(json.dumps({
  "smtp_host": "smtp.gmail.com", "smtp_port": "465",
  "smtp_user": os.environ["SMTP_USER"], "smtp_pass": os.environ["SMTP_PASS"],
  "smtp_admin_email": os.environ["SMTP_USER"], "smtp_sender_name": "educare insight",
  "site_url": "https://educare-insight.vercel.app",
  "uri_allow_list": "https://educare-insight.vercel.app/**,https://boyuk-insight.vercel.app/**,https://bouk-sigak.vercel.app/**,http://localhost:3000/**",
  "rate_limit_email_sent": 30,
  "mailer_subjects_confirmation": "[educare insight] 이메일 인증을 완료해 주세요",
  "mailer_templates_confirmation_content": t("confirmation"),
  "mailer_subjects_recovery": "[educare insight] 비밀번호 재설정 안내",
  "mailer_templates_recovery_content": t("recovery"),
  "mailer_subjects_email_change": "[educare insight] 이메일 변경 확인",
  "mailer_templates_email_change_content": t("email_change"),
  "mailer_subjects_magic_link": "[educare insight] 로그인 링크",
  "mailer_templates_magic_link_content": t("magic_link"),
  "mailer_subjects_reauthentication": "[educare insight] 본인 확인 코드",
  "mailer_templates_reauthentication_content": t("reauthentication"),
}, ensure_ascii=False))
PY
code=$(curl -s -o /tmp/boyuk-auth-res.json -w "%{http_code}" -X PATCH -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  --data @/tmp/boyuk-auth-patch.json "https://api.supabase.com/v1/projects/$REF/config/auth")
rm -f /tmp/boyuk-auth-patch.json
echo "Supabase 메일 설정: HTTP $code"
[[ "$code" != 200 ]] && { head -c 300 /tmp/boyuk-auth-res.json; exit 1; }
rm -f /tmp/boyuk-auth-res.json

for k in SMTP_USER SMTP_PASS; do
  npx vercel env rm $k production --yes >/dev/null 2>&1 || true
  printf "%s" "${(P)k}" | npx vercel env add $k production --sensitive >/dev/null 2>&1
done
echo "Vercel 환경 변수 등록 완료"
