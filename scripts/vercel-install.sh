#!/bin/bash
set -euo pipefail

# Must run from repo root (Vercel Root Directory = empty / ".")
if [ ! -f "frontend/package.json" ] || [ ! -f "backend/package.json" ]; then
  echo ""
  echo "ERROR: Vercel Root Directory must be the repository root (leave it empty)."
  echo "Do NOT set Root Directory to \"frontend\"."
  echo "Project Settings → General → Root Directory → clear the field → Save."
  echo ""
  echo "Current directory: $(pwd)"
  ls -la
  exit 1
fi

npm install --prefix frontend
npm install --prefix backend
