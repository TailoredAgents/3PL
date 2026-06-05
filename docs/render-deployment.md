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
DAT_CAPACITY_API_URL
DAT_POST_LOAD_API_URL
TRUCKSTOP_CLIENT_ID
TRUCKSTOP_CLIENT_SECRET
TRUCKSTOP_RATE_API_URL
TRUCKSTOP_CAPACITY_API_URL
TRUCKSTOP_POST_LOAD_API_URL
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
```

Missing optional credentials should not block the first deploy. The quote pricing workspace still supports manual benchmarks and the load coverage desk still supports manual carrier candidates when DAT/Truckstop endpoints are not configured.

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
- lead click-to-call validates/logs activity or starts Twilio call when configured.
- lead SMS validates/logs activity or sends through Twilio when configured.
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
- DAT/Truckstop capacity search validates or saves candidates when endpoints are configured.
- DAT/Truckstop load posting validates or records provider post logs when endpoints are configured.
- marketplace audit log appears on the load detail page.
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
8. Start lead click-to-call
9. Send lead SMS
10. Add activity
11. Create shipper/contact
12. Create quote request
13. Open quote request detail
14. Add rate benchmark
15. Generate system pricing recommendation
16. Save customer quote
17. Convert quote request to load
18. Create carrier
19. Open carrier detail
20. Create load manually
21. Open load detail
22. Generate internal carrier candidates
23. Search DAT/Truckstop capacity
24. Post load to DAT/Truckstop
25. Confirm marketplace audit log updates
26. Add manual carrier candidate
27. Request quote from a carrier candidate
28. Update load status
29. Add shipment event
30. Add customer update
31. Draft generated rate confirmation
32. Open printable rate confirmation
33. Update rate confirmation status
34. Add load document metadata
35. Add POD document metadata and confirm POD event appears
36. Update carrier compliance and confirm pending carriers cannot be accepted
37. Save Settings call recording disclosure
38. Upload CSV contacts
39. Public savings audit form
40. Public instant quote form
41. Intake queue
42. Health check

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
- Twilio lead click-to-call and SMS outreach exist and fall back to activity logging when credentials are missing.
- DAT and Truckstop rate adapter boundaries exist for configured endpoint URLs and credentials.
- DAT/Truckstop carrier capacity and load posting adapter boundaries exist for configured endpoint URLs and credentials.
- Clerk, Resend, Stripe, Twilio SMS delivery callbacks, and bridged-call transcription workers are not fully wired yet.

## 9. Render References

Render docs used for this setup:

- Blueprint YAML reference: https://render.com/docs/blueprint-spec
- Deploy Next.js app: https://render.com/docs/deploy-nextjs-app
- Deploy steps and pre-deploy behavior: https://render.com/docs/deploys
