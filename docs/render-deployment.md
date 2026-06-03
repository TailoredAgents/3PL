# Render Deployment Guide

This guide prepares the app for the preferred deployment flow:

```txt
Build locally -> push to GitHub -> create Render Blueprint -> add credentials -> deploy -> test feature by feature
```

## 1. Before GitHub

Run these checks locally:

```bash
npm run lint
npm run build
```

Confirm these files exist:

```txt
render.yaml
prisma/schema.prisma
prisma/migrations/
.env.example
docs/sample-contacts.csv
```

Do not commit a real `.env` file.

## 2. GitHub

Create a GitHub repo and push the project.

Recommended first commit scope:

```txt
Initial Atlanta Freight OS foundation
```

Include:

- public site
- internal CRM/TMS shell
- CRM create/import APIs
- temporary internal password gate
- Prisma schema and migrations
- Render Blueprint
- deployment docs

## 3. Render Blueprint

In Render:

1. Choose Blueprints.
2. Connect the GitHub repo.
3. Select the root `render.yaml`.
4. Let Render create:
   - `atlanta-freight-os`
   - `atlanta-freight-os-db`

The Blueprint defines:

```txt
Build command: npm ci && npm run prisma:deploy && npm run build
Start command: npm run start
Health check: /api/health
```

The build command runs database migrations before the production Next.js build.

## 4. Required Credentials

Set these during Blueprint creation or immediately after:

```txt
NEXT_PUBLIC_APP_URL
INTERNAL_APP_PASSWORD
XAI_API_KEY
```

`DATABASE_URL` is supplied by the Render Postgres database through `fromDatabase`.

`INTERNAL_APP_PASSWORD` is required before any public deployment because it protects the internal CRM while Clerk is not wired yet.

`NEXT_PUBLIC_APP_URL` should be the live Render URL after the first deploy, for example:

```txt
https://atlanta-freight-os.onrender.com
```

If you do not know the final Render URL during initial setup, set it after Render creates the service, then redeploy.

## 5. Optional Credentials

Add these when available:

```txt
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
DAT_CLIENT_ID
DAT_CLIENT_SECRET
TRUCKSTOP_CLIENT_ID
TRUCKSTOP_CLIENT_SECRET
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
```

Missing optional credentials should not block the first deploy.

## 6. First Live Checks

After deploy, open:

```txt
/api/health
/
/internal-login
/dashboard
/intake
/leads
/shippers
/quote-requests
```

Expected behavior:

- `/` loads publicly.
- `/api/health` returns JSON.
- internal pages redirect to `/internal-login` when `INTERNAL_APP_PASSWORD` is set.
- the internal password allows access.
- CRM pages load.
- create lead works.
- create shipper works.
- create quote request works.
- CSV import parses `docs/sample-contacts.csv`.
- records remain after page refresh.

## 7. Feature Test Order

Test in this order:

1. Public homepage
2. Internal login
3. Internal dashboard
4. Create lead
5. Open lead detail
6. Update lead stage/follow-up
7. Add activity
8. Create shipper/contact
9. Create quote request
10. Upload CSV contacts
11. Public savings audit form
12. Public instant quote form
13. Intake queue
14. Health check

## 8. Known Temporary Choices

Temporary internal gate:

- Uses `INTERNAL_APP_PASSWORD`.
- Protects internal routes and CRM write APIs.
- Should be replaced with Clerk before real multi-user operation.

Document upload:

- Public audit upload currently stores metadata only.
- Durable storage and OCR are not wired yet.

Integrations:

- Grok wrapper exists.
- DAT, Truckstop, Twilio, Clerk, Resend, and Stripe are not fully wired yet.

## 9. Render References

Render docs used for this setup:

- Blueprint YAML reference: https://render.com/docs/blueprint-spec
- Deploy Next.js app: https://render.com/docs/deploy-nextjs-app
- Deploy steps and pre-deploy behavior: https://render.com/docs/deploys
