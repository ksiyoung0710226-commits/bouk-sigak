#!/bin/zsh
# 사용자가 직접 실행: 메일 알림용 DB 수정(018) 적용 + 사이트 배포
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/node22/bin:$PATH"
npx supabase db query --remote=soiiihaivulcqqomzotb --file supabase/migrations/018_notify_any_channel.sql --yes
git push
npx vercel deploy --prod --yes | tail -1
echo "끝났어요!"
