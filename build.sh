#!/bin/bash
set -e

echo "=== Hermes Render Build ==="

# Install Hermes
pip install hermes-agent

# Install Telegram deps
pip install python-telegram-bot

# --- Configure provider from env vars ---
# Model (defaults to deepseek if not set)
MODEL="${HERMES_MODEL:-deepseek/deepseek-v4-pro}"
BASE_URL="${CUSTOM_BASE_URL:-https://api.tokenrouter.com/v1}"

hermes config set model.default "$MODEL"
hermes config set model.provider custom
hermes config set model.base_url "$BASE_URL"
hermes config set model.api_key "${CUSTOM_API_KEY:?Set CUSTOM_API_KEY env var in Render}"

# --- Configure Telegram gateway ---
hermes gateway setup telegram --non-interactive 2>/dev/null || true

echo "=== Build complete ==="
