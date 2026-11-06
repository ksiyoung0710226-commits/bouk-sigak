#!/bin/zsh
# 아직 적용 안 된 DB 수정 적용 → GitHub 업로드 (push = Vercel 자동 배포)
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/node22/bin:$PATH"
for f in supabase/migrations/030_final_fixes.sql; do
  echo "DB 적용: $f"
  npx supabase db query --remote=soiiihaivulcqqomzotb --file "$f" --yes > /tmp/go-db.log 2>&1 || { cat /tmp/go-db.log; echo "실패했어요. 이 화면을 Claude에게 보여 주세요."; exit 1; }
done
git push
echo "끝났어요!"
