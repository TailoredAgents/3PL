# Production Environment Checklist

Use this checklist when creating the Render Blueprint and later adding credentials.

## Required For First Deploy

```txt
DATABASE_URL
NEXT_PUBLIC_APP_URL
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SIGN_IN_URL
CLERK_SIGN_UP_URL
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
```

Notes:

- `DATABASE_URL` comes from Render Postgres in `render.yaml`.
- `NEXT_PUBLIC_APP_URL` should be the Render web service URL.
- Clerk protects internal routes when both Clerk keys are configured.
- Use `/login` for Clerk sign-in and sign-up URLs.
- Use `/dashboard` for Clerk sign-in and sign-up fallback redirect URLs.

## Temporary Password Fallback

```txt
INTERNAL_APP_PASSWORD
INTERNAL_AUTH_COOKIE
```

Only use these while Clerk keys are not configured. Once Clerk is live, internal routes use Clerk instead of the password gate.

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

## Twilio Outreach

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
RESEND_FROM_EMAIL
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
