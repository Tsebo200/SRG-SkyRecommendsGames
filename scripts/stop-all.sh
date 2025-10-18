#!/usr/bin/env bash
set -euo pipefail

echo "Stopping Expo (8081) if running..."
if lsof -ti:8081 >/dev/null 2>&1; then
  lsof -ti:8081 | xargs kill -9 || true
else
  echo "No process on 8081"
fi

echo "Stopping Backend (8080) if running..."
if lsof -ti:8080 >/dev/null 2>&1; then
  lsof -ti:8080 | xargs kill -9 || true
else
  echo "No process on 8080"
fi

echo "Stopping Supabase local stack (Docker)..."
if command -v supabase >/dev/null 2>&1; then
  supabase stop || true
else
  echo "Supabase CLI not found; skipping supabase stop"
fi

echo "Done."



