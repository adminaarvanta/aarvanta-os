#!/usr/bin/env bash
# One-shot Voice Relay install for orbit.aarvanta.co (existing nginx TLS).
# Run ON the EC2 box as ubuntu (with sudo):
#   bash bootstrap-voice-relay-orbit.sh
#
# Required env (export before running, or edit .env after):
#   OPENAI_API_KEY
#   TWILIO_AUTH_TOKEN
# Optional:
#   VOICE_RELAY_CALLBACK_SECRET  (auto-generated if unset)
#   AARVANTA_OS_BRANCH           (default: cursor/voice-os-ai-2way-4af1)
set -euo pipefail

DOMAIN="${VOICE_RELAY_DOMAIN:-orbit.aarvanta.co}"
WSS_URL="wss://${DOMAIN}/voice-relay/ws"
CALLBACK_URL="${AARVANTA_VOICE_CALLBACK_URL:-https://os.aarvanta.co/api/webhooks/voice-relay}"
BRANCH="${AARVANTA_OS_BRANCH:-cursor/voice-os-ai-2way-4af1}"
REPO_DIR="${AARVANTA_OS_DIR:-$HOME/aarvanta-os}"
DEST="${VOICE_RELAY_HOME:-/opt/aarvanta/voice-relay}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-enabled/aarvanta}"

echo "==> Domain: $DOMAIN"
echo "==> WSS:    $WSS_URL"

if [[ -z "${OPENAI_API_KEY:-}" || -z "${TWILIO_AUTH_TOKEN:-}" ]]; then
  echo
  echo "ERROR: export secrets first, then re-run:"
  echo "  export OPENAI_API_KEY='sk-...'"
  echo "  export TWILIO_AUTH_TOKEN='...'"
  echo "  bash $0"
  exit 1
fi

SECRET="${VOICE_RELAY_CALLBACK_SECRET:-$(openssl rand -hex 24)}"
echo "==> Callback secret (also set this in Vercel as VOICE_RELAY_CALLBACK_SECRET):"
echo "    $SECRET"
echo

# --- clone / update repo ---
if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "==> Cloning aarvanta-os"
  git clone https://github.com/adminaarvanta/aarvanta-os.git "$REPO_DIR"
fi
cd "$REPO_DIR"
git fetch origin
git checkout "$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" "origin/$BRANCH"
git pull --ff-only origin "$BRANCH" || true

# --- install service ---
echo "==> Installing voice-relay"
sudo bash services/voice-relay/deploy/install-on-ec2.sh

# --- write .env ---
echo "==> Writing $DEST/.env"
sudo tee "$DEST/.env" >/dev/null <<EOF
PORT=8090
OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_MODEL=gpt-4o-mini
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
VOICE_RELAY_WSS_URL=${WSS_URL}
AARVANTA_VOICE_CALLBACK_URL=${CALLBACK_URL}
VOICE_RELAY_CALLBACK_SECRET=${SECRET}
VOICE_RELAY_VERIFY_SIGNATURES=true
EOF
sudo chmod 600 "$DEST/.env"
sudo systemctl restart voice-relay

# --- nginx location (idempotent) ---
echo "==> Ensuring nginx /voice-relay/ on $DOMAIN"
if ! sudo grep -q 'location /voice-relay/' "$NGINX_SITE"; then
  # Insert location block before the first closing brace of the 443 orbit server.
  # Fallback: append a snippet include file and include it.
  SNIPPET="/etc/nginx/snippets/aarvanta-voice-relay.conf"
  sudo tee "$SNIPPET" >/dev/null <<'NGX'
location /voice-relay/ {
    proxy_pass http://127.0.0.1:8090/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_read_timeout 3600s;
}
NGX
  # Add include into each 443 server that mentions orbit.aarvanta.co if not present
  if ! sudo grep -q 'aarvanta-voice-relay.conf' "$NGINX_SITE"; then
    sudo cp "$NGINX_SITE" "${NGINX_SITE}.bak.$(date +%s)"
    # Insert include after first ssl_certificate_key line for orbit host
    sudo python3 - <<'PY'
from pathlib import Path
path = Path("/etc/nginx/sites-enabled/aarvanta")
text = path.read_text()
needle = "include /etc/nginx/snippets/aarvanta-voice-relay.conf;"
if needle in text:
    raise SystemExit(0)
# After each ssl_certificate_key under orbit.aarvanta.co blocks is hard;
# insert once after the first ssl_certificate_key occurrence that follows orbit.aarvanta.co
marker = "ssl_certificate_key /etc/letsencrypt/live/orbit.aarvanta.co/privkey.pem;"
idx = text.find(marker)
if idx == -1:
    raise SystemExit("Could not find ssl_certificate_key for orbit.aarvanta.co")
insert_at = idx + len(marker)
addition = "\n    include /etc/nginx/snippets/aarvanta-voice-relay.conf;"
text = text[:insert_at] + addition + text[insert_at:]
path.write_text(text)
print("Inserted include after first orbit ssl_certificate_key")
PY
  fi
else
  echo "    location /voice-relay/ already present"
fi

sudo nginx -t
sudo systemctl reload nginx

# --- health checks ---
echo
echo "==> Local health:"
curl -sS http://127.0.0.1:8090/health || true
echo
echo "==> Public health:"
curl -sS "https://${DOMAIN}/voice-relay/health" || true
echo
echo
echo "=============================================="
echo "EC2 side DONE."
echo
echo "Next (you must do in browsers):"
echo "1) Vercel Production env:"
echo "   VOICE_RELAY_WSS_URL=${WSS_URL}"
echo "   VOICE_RELAY_CALLBACK_SECRET=${SECRET}"
echo "   Then Redeploy os.aarvanta.co (and merge PR #27 if not live)."
echo "2) Twilio number +17167032574:"
echo "   A call comes in → https://os.aarvanta.co/api/webhooks/twilio/twiml (POST)"
echo "   Call status changes → https://os.aarvanta.co/api/webhooks/twilio (POST)"
echo "3) Test: https://os.aarvanta.co/calling"
echo "=============================================="
