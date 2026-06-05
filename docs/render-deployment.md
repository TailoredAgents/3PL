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
DAT_RATE_API_URL
TRUCKSTOP_CLIENT_ID
TRUCKSTOP_CLIENT_SECRET
TRUCKSTOP_RATE_API_URL
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
```

Missing optional credentials should not block the first deploy. The quote pricing workspace still supports manual benchmarks when DAT/Truckstop rate endpoints are not configured.

## 6. First Live Checks

After deploy, open:

```txt
/api/health
/
/login
/dashboard
/intake
/calls
/leads
/shippers
/quote-requests
/carriers
/loads
/loads/[id]
/settings
```

Expected behavior:

- `/` loads publicly.
- `/api/health` returns JSON.
- internal pages redirect to `/login` when `INTERNAL_APP_PASSWORD` is set.
- the internal password allows access.
- CRM pages load.
- call intelligence queue loads.
- create lead works.
- create shipper works.
- create quote request works.
- quote request detail opens.
- rate benchmark save works.
- system pricing recommendation generation works after a benchmark exists.
- final customer quote save works with recommendation defaults.
- quote request converts to a load.
- create carrier works.
- carrier detail opens.
- create load works.
- load status updates work.
- internal carrier candidate generation works.
- manual carrier candidate save works.
- carrier candidate quote-request status works.
- shipment event timeline works.
- customer update logging works.
- generated rate confirmation draft works after an approved carrier is assigned.
- printable rate confirmation opens.
- rate confirmation status updates work.
- load document/POD metadata logging works.
- carrier compliance updates work and pending carriers cannot be accepted.
- settings save the call recording disclosure.
- CSV import parses `docs/sample-contacts.csv`.
- records remain after page refresh.

## 7. Feature Test Order

Test in this order:

1. Public homepage
2. Internal login
3. Internal dashboard
4. Call intelligence queue
5. Create lead
6. Open lead detail
7. Update lead stage/follow-up
8. Add activity
9. Create shipper/contact
10. Create quote request
11. Open quote request detail
12. Add rate benchmark
13. Generate system pricing recommendation
14. Save customer quote
15. Convert quote request to load
16. Create carrier
17. Open carrier detail
18. Create load manually
19. Open load detail
20. Generate internal carrier candidates
21. Add manual carrier candidate
22. Request quote from a carrier candidate
23. Update load status
24. Add shipment event
25. Add customer update
26. Draft generated rate confirmation
27. Open printable rate confirmation
28. Update rate confirmation status
29. Add load document metadata
30. Add POD document metadata and confirm POD event appears
31. Update carrier compliance and confirm pending carriers cannot be accepted
32. Save Settings call recording disclosure
33. Upload CSV contacts
29. Public savings audit form
30. Public instant quote form
31. Intake queue
32. Health check

## 8. Known Temporary Choices

Temporary internal gate:

- Uses `INTERNAL_APP_PASSWORD`.
- Protects internal routes and CRM write APIs.
- Should be replaced with Clerk before real multi-user operation.

Document upload:

- Public audit upload currently stores metadata only.
- Load documents currently store metadata only.
- Durable storage and OCR are not wired yet.

Integrations:

- Grok wrapper exists.
- Twilio inbound call webhook foundation exists at `/api/twilio/voice/incoming`.
- DAT and Truckstop rate adapter boundaries exist for configured endpoint URLs and credentials.
- DAT/Truckstop carrier capacity, load posting, Twilio calling, Clerk, Resend, and Stripe are not fully wired yet.

## 9. Render References

Render docs used for this setup:

- Blueprint YAML reference: https://render.com/docs/blueprint-spec
- Deploy Next.js app: https://render.com/docs/deploy-nextjs-app
- Deploy steps and pre-deploy behavior: https://render.com/docs/deploys
