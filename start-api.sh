#!/bin/sh
echo "=== DB schema push 시작 ==="
pnpm --filter @workspace/db run push-force --accept-data-loss 2>&1 || echo "WARNING: DB push 실패 — 계속 진행"
echo "=== API 서버 시작 ==="
exec node artifacts/api-server/dist/index.cjs
