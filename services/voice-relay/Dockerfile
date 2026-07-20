# Aarvanta Voice Relay (ConversationRelay sidecar)
#
# Co-locate on the same EC2 as aarvanta_onboarding_automation.
# Expose via nginx/Caddy as wss://<host>/voice-relay/ws (or dedicated subdomain).

FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

ENV PORT=8090
EXPOSE 8090

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8090"]
