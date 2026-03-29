#!/usr/bin/env bash
# Récupère les IDs pour CLICKSHIP_PAYMENT_METHOD_ID et CLICKSHIP_SERVICE_ID
# en appelant l'API Freightcom. Charge .env.local (CLICKSHIP_API_KEY, CLICKSHIP_API_URL).
# Usage: ./scripts/get-clickship-ids.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ ]] && continue
    if [[ "$line" =~ ^CLICKSHIP_API_KEY= ]] && [ -z "${CLICKSHIP_API_KEY:-}" ]; then
      export CLICKSHIP_API_KEY="${line#CLICKSHIP_API_KEY=}"
    fi
    if [[ "$line" =~ ^CLICKSHIP_API_URL= ]] && [ -z "${CLICKSHIP_API_URL:-}" ]; then
      export CLICKSHIP_API_URL="${line#CLICKSHIP_API_URL=}"
    fi
  done < "$PROJECT_ROOT/.env.local"
fi

BASE_URL="${CLICKSHIP_API_URL:-https://customer-external-api.ssd-test.freightcom.com}"
TOKEN="${CLICKSHIP_API_KEY}"

if [ -z "$TOKEN" ]; then
  echo "CLICKSHIP_API_KEY manquant. Définis-le dans .env.local ou : CLICKSHIP_API_KEY=ton_token $0"
  exit 1
fi

echo "API: $BASE_URL"
echo ""

# Payment methods
echo "=== CLICKSHIP_PAYMENT_METHOD_ID (GET /finance/payment-methods) ==="
PM_RESP=$(curl -s -H "Authorization: $TOKEN" -H "Accept: application/json" "$BASE_URL/finance/payment-methods")
if echo "$PM_RESP" | grep -q '"id"'; then
  if command -v jq &>/dev/null; then
    echo "$PM_RESP" | jq -r 'if type == "array" then .[].id else .payment_methods[]?.id // .[].id end' 2>/dev/null | head -20
  else
    echo "$PM_RESP" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -5 | sed 's/.*"\([^"]*\)"$/\1/'
  fi
  echo ""
  echo "Choisis un id ci-dessus et mets-le dans .env.local : CLICKSHIP_PAYMENT_METHOD_ID=<id>"
else
  echo "Réponse (vérifier token/URL) :"
  echo "$PM_RESP" | head -5
fi

echo ""
echo "=== CLICKSHIP_SERVICE_ID (GET /services) ==="
SVC_RESP=$(curl -s -H "Authorization: $TOKEN" -H "Accept: application/json" "$BASE_URL/services")
if echo "$SVC_RESP" | grep -q '"id"'; then
  if command -v jq &>/dev/null; then
    echo "$SVC_RESP" | jq -r '.[].id' 2>/dev/null | grep -E '^(purolator|canadapost|canpar|fedex|ups|dhl)' | head -15
    echo "... (autres services disponibles)"
  else
    echo "$SVC_RESP" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -10 | sed 's/.*"\([^"]*\)"$/\1/'
  fi
  echo ""
  echo "Choisis un id (ex. purolatorcourier.ground, canadapost.regular-parcel) et mets-le dans .env.local : CLICKSHIP_SERVICE_ID=<id>"
else
  echo "Réponse (vérifier token/URL) :"
  echo "$SVC_RESP" | head -5
fi

echo ""
echo "Ensuite complète CLICKSHIP_ORIGIN_* dans .env.local et redémarre l'app."
