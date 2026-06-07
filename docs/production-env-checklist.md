# Production Environment Checklist

Use this checklist for the final pre-launch credential and deployment pass. The
feature roadmap is treated as functionally complete; this file tracks what must
be configured or verified before live usage.

## Core App

```txt
DATABASE_URL
NEXT_PUBLIC_APP_URL
NODE_ENV=production
```

Notes:

- On Render, `DATABASE_URL` is supplied by Render Postgres through
  `render.yaml`.
- `NEXT_PUBLIC_APP_URL` must match the live app URL.
- `/api/health` verifies database reachability and credential presence without
  exposing secret values.

## Internal Auth

Preferred production auth:

```txt
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SIGN_IN_URL=/login
CLERK_SIGN_UP_URL=/login
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
CLERK_WEBHOOK_SECRET
```

Temporary fallback when Clerk is not configured:

```txt
INTERNAL_APP_PASSWORD
INTERNAL_AUTH_COOKIE=dao_logistics_internal
```

Before launch:

- Verify owner/admin/sales/ops access in Clerk.
- Verify `/api/webhooks/clerk` in the Clerk dashboard.
- Verify admin-only routes are hidden and protected for non-admin users.
- Remove or rotate any temporary password used during build/QA.

## Grok / xAI

```txt
XAI_API_KEY
XAI_MODEL=grok-4.3
```

Before launch:

- Run agent smoke tests from AI Command Center.
- Verify agent logs appear in AI Command Center and Integrations.
- Confirm human approval gates for customer-facing, financial, and compliance
  actions.

Without `XAI_API_KEY`, the app returns safe local placeholder output.

## DAT

```txt
DAT_CLIENT_ID
DAT_CLIENT_SECRET
DAT_TOKEN_URL
DAT_RATE_API_URL
DAT_CAPACITY_API_URL
DAT_POST_LOAD_API_URL
```

Before launch:

- Confirm account scopes with DAT.
- Finalize account-specific rate payload mapping.
- Finalize capacity search payload mapping.
- Finalize load posting payload mapping.
- Test quote pricing, load capacity lookup, posting, retry, and logs.

## Truckstop

```txt
TRUCKSTOP_CLIENT_ID
TRUCKSTOP_CLIENT_SECRET
TRUCKSTOP_TOKEN_URL
TRUCKSTOP_RATE_API_URL
TRUCKSTOP_CAPACITY_API_URL
TRUCKSTOP_POST_LOAD_API_URL
TRUCKSTOP_RATE_INTELLIGENCE_URL
```

Before launch:

- Confirm account scopes with Truckstop.
- Finalize account-specific rate payload mapping.
- Finalize capacity search payload mapping.
- Finalize load posting payload mapping.
- Test quote pricing, load capacity lookup, posting, retry, and logs.

## Twilio

```txt
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_FORWARD_TO_PHONE_NUMBER
```

Webhook URLs:

```txt
POST /api/twilio/voice/incoming
POST /api/twilio/voice/outbound/status
POST /api/twilio/voice/recording
POST /api/twilio/voice/transcription
```

Before launch:

- Verify inbound call disclosure message in Settings.
- Verify forwarding number.
- Verify call recording and transcription callbacks.
- Verify outbound click-to-call.
- Verify SMS send path and activity logging.
- Confirm malformed callback posts return controlled errors.

## Resend

```txt
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_WEBHOOK_SECRET
```

Webhook URL:

```txt
POST /api/resend/webhook
```

Before launch:

- Verify quote email delivery.
- Verify webhook events for delivered, bounced, and complained.
- Verify suppression handling.
- Verify email events appear in Communications and Integrations.

## Storage And OCR

```txt
STORAGE_BUCKET
STORAGE_REGION
STORAGE_ENDPOINT
STORAGE_ACCESS_KEY_ID
STORAGE_SECRET_ACCESS_KEY
STORAGE_PUBLIC_BASE_URL
```

Before launch:

- Verify upload/download for BOL, POD, rate confirmation, invoice, W-9, COI,
  broker-carrier agreement, and audit uploads.
- Verify file size, MIME type, storage key, source, status, and download route.
- Verify image/text extraction.
- Choose and verify final PDF OCR/provider path.
- Confirm document review gates before downstream automation.

## Carrier And Lane Enrichment

```txt
FMCSA_WEB_KEY
CARRIEROK_API_KEY
HERE_API_KEY
EIA_API_KEY
```

Before launch:

- Verify FMCSA carrier enrichment.
- Verify CarrierOk or chosen carrier compliance/fraud provider.
- Verify HERE mileage.
- Verify EIA diesel lookup.
- Confirm provider failures are logged and visible in Integrations.

## Payments And Accounting

Optional until the business chooses payment/accounting workflow:

```txt
STRIPE_SECRET_KEY
```

Before launch decision:

- Decide whether customer online payment is needed.
- Decide whether QuickBooks/accounting sync is needed.
- If not needed for launch, keep billing/payables as operational records and
  handle external accounting manually.

## Final Production Checks

Run locally before release:

```bash
npm run prisma:generate
npm run lint
npx tsc --noEmit --incremental false
npm run build
git diff --check
```

Then verify live:

```txt
/api/health
/login
/dashboard
/communications
/quote-requests
/loads
/tracking
/documents
/billing
/payables
/agents
/integrations
/admin
/portal
/carrier-portal
```

Do not expose real secrets in Git. `.env*` files are ignored except
`.env.example`.
