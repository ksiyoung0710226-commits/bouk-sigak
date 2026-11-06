#!/bin/zsh
# 사용자가 직접 실행: 아직 적용 안 된 DB 수정(021 글 수정, 022 회원 유형, 023 환영 메일) 적용 → GitHub 업로드 → 사이트 배포
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/node22/bin:$PATH"
for f in supabase/migrations/021_edit_posts.sql supabase/migrations/022_member_kinds_teacher_org.sql supabase/migrations/023_welcome_mail.sql; do
  echo "DB 적용: $f"
  npx supabase db query --remote=soiiihaivulcqqomzotb --file "$f" --yes > /tmp/go-db.log 2>&1 || { cat /tmp/go-db.log; echo "실패했어요. 이 화면을 Claude에게 보여 주세요."; exit 1; }
done
git push
npx vercel deploy --prod --yes | tail -1
echo "끝났어요!"
