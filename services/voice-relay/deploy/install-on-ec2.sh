#!/usr/bin/env bash
# Deploy voice-relay onto the onboarding EC2 box.
# Usage (from the EC2 host, after git pull or scp):
#   sudo bash services/voice-relay/deploy/install-on-ec2.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${VOICE_RELAY_HOME:-/opt/aarvanta/voice-relay}"

echo "Installing Aarvanta Voice Relay → $DEST"
sudo mkdir -p "$DEST"
sudo rsync -a --delete \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '.env' \
  "$ROOT/" "$DEST/"

if [[ ! -f "$DEST/.env" ]]; then
  echo "Creating $DEST/.env from example — fill OPENAI_API_KEY + TWILIO_AUTH_TOKEN + VOICE_RELAY_WSS_URL"
  sudo cp "$ROOT/.env.example" "$DEST/.env"
fi

sudo python3 -m venv "$DEST/.venv"
sudo "$DEST/.venv/bin/pip" install --upgrade pip
sudo "$DEST/.venv/bin/pip" install -r "$DEST/requirements.txt"

sudo cp "$ROOT/deploy/voice-relay.service" /etc/systemd/system/voice-relay.service
sudo systemctl daemon-reload
sudo systemctl enable voice-relay
sudo systemctl restart voice-relay
sudo systemctl --no-pager status voice-relay || true

echo
echo "Next:"
echo "  1. Edit $DEST/.env"
echo "  2. Add nginx location /voice-relay/ (see deploy/nginx-voice-relay.conf)"
echo "  3. Set Vercel VOICE_RELAY_WSS_URL=wss://<host>/voice-relay/ws (exact match)"
echo "  4. curl https://<host>/voice-relay/health"
