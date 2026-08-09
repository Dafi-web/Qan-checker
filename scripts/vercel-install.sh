#!/bin/bash
set -euo pipefail

# Works whether Vercel Root Directory is repo root OR "frontend"
if [ -f "frontend/package.json" ] && [ -f "backend/package.json" ]; then
  ROOT="."
elif [ -f "package.json" ] && [ -f "../backend/package.json" ]; then
  ROOT=".."
else
  echo "ERROR: Cannot find frontend/ and backend/ packages."
  echo "pwd=$(pwd)"
  ls -la
  exit 1
fi

echo "Installing from repo root: $(cd "$ROOT" && pwd)"
npm install --prefix "$ROOT/frontend"
npm install --prefix "$ROOT/backend"
