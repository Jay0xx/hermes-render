#!/bin/bash
set -e

echo "=== Hermes Render Build ==="

# Render containers: breaking system packages is fine (ephemeral)
pip3 install --break-system-packages --no-cache-dir \
  "git+https://github.com/NousResearch/hermes-agent.git" \
  python-telegram-bot \
  2>&1 | tail -5

# Verify
hermes --version

# Configure provider from Render env vars
MODEL="${HERMES_MODEL:-deepseek/deepseek-v4-pro}"
BASE_URL="${CUSTOM_BASE_URL:-https://api.tokenrouter.com/v1}"

hermes config set model.default  "$MODEL"
hermes config set model.provider custom
hermes config set model.base_url "$BASE_URL"
hermes config set model.api_key  "${CUSTOM_API_KEY:?Set CUSTOM_API_KEY env var in Render}"

echo "=== Build complete ==="
