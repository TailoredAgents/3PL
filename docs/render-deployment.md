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
/agents
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
- AI Command Center loads.
- AI agent approval and retry controls validate against the logged run state.
- AI daily brief and exception dashboard load.
- AI prompt template edits validate and persist when `DATABASE_URL` is configured.
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
- load board filters, search, equipment filter, sorting, and quick actions render.
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
4. AI Command Center
5. Review daily brief and exceptions
6. Edit one AI prompt template and confirm it saves
7. Call intelligence queue
8. Create lead
9. Open lead detail
10. Run a lead AI agent and confirm it enters the approval queue
11. Approve the waiting AI agent run
12. Update lead stage/follow-up
13. Start lead click-to-call
14. Send lead SMS
15. Add activity
16. Create shipper/contact
17. Create quote request
18. Open quote request detail
19. Add rate benchmark
20. Generate system pricing recommendation
21. Save customer quote
22. Convert quote request to load
23. Create carrier
24. Open carrier detail
25. Create load manually
26. Open load board and test filters/search/sort
27. Use load board quick actions to jump to coverage and marketplace sections
28. Open load detail
29. Generate internal carrier candidates
30. Search DAT/Truckstop capacity
31. Post load to DAT/Truckstop
32. Confirm marketplace audit log updates
33. Add manual carrier candidate
34. Request quote from a carrier candidate
35. Update load status
36. Add shipment event
37. Add customer update
38. Draft generated rate confirmation
39. Open printable rate confirmation
40. Update rate confirmation status
41. Add load document metadata
42. Add POD document metadata and confirm POD event appears
43. Update carrier compliance and confirm pending carriers cannot be accepted
44. Save Settings call recording disclosure
45. Upload CSV contacts
46. Public savings audit form
47. Public instant quote form
48. Intake queue
49. Health check

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
