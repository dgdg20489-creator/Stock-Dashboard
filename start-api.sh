#!/bin/sh
set -e
echo "Running DB schema push..."
pnpm --filter @workspace/db run push-force
echo "Starting API server..."
exec node artifacts/api-server/dist/index.cjs
