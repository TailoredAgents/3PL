# Production Environment Checklist

Use this checklist when creating the Render Blueprint and later adding credentials.

## Required For First Deploy

```txt
DATABASE_URL
NEXT_PUBLIC_APP_URL
INTERNAL_APP_PASSWORD
INTERNAL_AUTH_COOKIE
```

Notes:

- `DATABASE_URL` comes from Render Postgres in `render.yaml`.
- `NEXT_PUBLIC_APP_URL` should be the Render web service URL.
- `INTERNAL_APP_PASSWORD` protects internal routes until Clerk is live.
- `INTERNAL_AUTH_COOKIE` can stay as `atlanta_freight_internal`.

## Required For Grok

```txt
XAI_API_KEY
XAI_MODEL
```

Recommended model value:

```txt
grok-4.3
```

Without `XAI_API_KEY`, AI endpoints return safe placeholder output.

## Future Auth

```txt
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

Clerk should replace `INTERNAL_APP_PASSWORD` once internal users are ready.

## Future Twilio

```txt
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_FORWARD_TO_PHONE_NUMBER
```

Needed for:

- click-to-call
- inbound call recording/disclosure routing
- SMS outreach
- shipment updates
- call/SMS activity logging

## DAT Rate Lookup

```txt
DAT_CLIENT_ID
DAT_CLIENT_SECRET
DAT_RATE_API_URL
DAT_CAPACITY_API_URL
DAT_POST_LOAD_API_URL
```

Needed for:

- rate lookup
- carrier capacity
- load posting

## Truckstop Rate Lookup

```txt
TRUCKSTOP_CLIENT_ID
TRUCKSTOP_CLIENT_SECRET
TRUCKSTOP_RATE_API_URL
TRUCKSTOP_CAPACITY_API_URL
TRUCKSTOP_POST_LOAD_API_URL
```

Needed for:

- rate lookup
- carrier capacity
- load posting

## Future Email

```txt
RESEND_API_KEY
```

Needed for:

- savings audit report emails
- quote emails
- follow-up automation

## Future Payments

```txt
STRIPE_SECRET_KEY
```

Only needed if online invoice payment is added.

## Health Check

After deployment:

```txt
/api/health
```

This reports:

- app status
- database configured/reachable
- whether integration credentials are present

It does not expose secret values.
