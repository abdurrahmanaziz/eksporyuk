#!/bin/bash

# Get webhook token
TOKEN=${XENDIT_WEBHOOK_TOKEN}
if [ -z "$TOKEN" ]; then
  echo "❌ XENDIT_WEBHOOK_TOKEN not set"
  exit 1
fi

# Webhook payload
PAYLOAD='{
  "id": "6962172dc3c8fc68421253d4",
  "event": "invoice.paid",
  "external_id": "TXN-1768036141053-cae2eab3",
  "reference_id": "6962172dc3c8fc68421253d4",
  "status": "PAID",
  "amount": 15980,
  "payment_channel": "QRIS",
  "payment_destination": null,
  "payer_email": "richaffiliateapp@gmail.com",
  "customer_name": "Rich Affiliate App",
  "paid_at": "2026-01-10T09:10:40.448Z",
  "description": "Membership: Paket 6 Bulan - Paket 6 Bulan",
  "created": "2026-01-10T09:09:01Z",
  "updated": "2026-01-10T09:10:40.448Z",
  "currency": "IDR"
}'

# Sign payload
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$TOKEN" -binary | base64)

echo "=== TRIGGERING WEBHOOK ==="
echo "Event: invoice.paid"
echo "External ID: TXN-1768036141053-cae2eab3"
echo "Signature: $SIGNATURE"
echo ""

# Send webhook
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: $SIGNATURE" \
  -d "$PAYLOAD" \
  -v 2>&1 | tail -20
