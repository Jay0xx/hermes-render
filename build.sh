#!/bin/bash
set -e

echo "=== Hermes Render Build ==="

# Install Hermes via official installer
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Ensure hermes is on PATH
export PATH="$HOME/.local/bin:$PATH"
hermes --version

# Telegram deps
pip3 install --user python-telegram-bot 2>&1 | tail -3 || pip3 install --break-system-packages python-telegram-bot 2>&1 | tail -3

# Configure provider from Render env vars
MODEL="${HERMES_MODEL:-deepseek/deepseek-v4-pro}"
BASE_URL="${CUSTOM_BASE_URL:-https://api.tokenrouter.com/v1}"

hermes config set model.default  "$MODEL"
hermes config set model.provider custom
hermes config set model.base_url "$BASE_URL"
hermes config set model.api_key  "${CUSTOM_API_KEY:?Set CUSTOM_API_KEY env var in Render}"

echo "=== Build complete ==="
