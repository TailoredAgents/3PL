# Atlanta Freight OS

AI-native CRM and TMS foundation for a new Atlanta-based pure freight brokerage.

This repository is the first build milestone for a non-asset 3PL platform. The brokerage does not own trucks, trailers, or warehouse space. The product connects shippers with carriers, manages load execution, tracks profitability, and uses Grok agents to automate as much of the daily workflow as possible.

`Atlanta Freight OS` is a working product name only. It can be replaced once final branding is chosen.

## Current Status

This is an early build foundation, not the finished brokerage operating system.

Included now:

- Next.js app scaffold
- Public marketing homepage
- Free AI Freight Savings Audit form
- Instant Quote form
- Internal CRM/TMS dashboard shell
- Shared internal navigation shell
- Temporary internal password gate
- Audit and quote intake queue
- Leads pipeline page
- Lead detail page
- Lead stage/update form
- Lead activity creation
- Shippers and contacts page
- Shipper detail page with related leads, quotes, and loads
- Quote request queue page
- Quote request detail page
- Convert accepted quote request to operational load
- Carrier management page
- Carrier detail page with compliance context and related loads
- Carrier compliance checklist for authority, insurance, safety, fraud risk, approval, and vetting notes
- Load board page with KPI filters, search, equipment filtering, sorting, dense row data, and quick actions
- Load detail page with status updates, carrier sourcing candidates, carrier offers, carrier assignment, tracking events, customer update state, generated rate confirmations, document records, POD status handling, and invoice records
- Rich phone quote intake fields for pickup/delivery windows, addresses, reference numbers, pallet/piece counts, dimensions, hazmat, temperature, appointments, accessorials, urgency, target margin, and pricing notes
- Pricing intelligence workspace with manual rate benchmarks, system buy/sell recommendations, projected margin, quote validity, risk notes, and same-lane history
- Settings page with editable call recording disclosure message for future Twilio call handling
- Call intelligence queue for recorded calls, transcripts, AI extraction, and quote request draft approval
- Twilio inbound voice webhook foundation with call recording callbacks and transcription callback support
- Database-backed dashboard metrics with sample-data fallback
- Database-backed CRM read helpers with sample-data fallback
- Create lead form and API
- Create shipper/contact form and API
- Create internal quote request form and API
- CSV contact import form and API
- Sample contact import CSV at `docs/sample-contacts.csv`
- Activity timeline and follow-up views
- AI agent run forms on lead, quote, load, and carrier detail pages
- Recent AI agent run log on the dashboard
- AI Command Center with approval queue, failed-run retry, and recent run explorer
- Editable Grok prompt templates for each brokerage agent
- AI daily brief and exception dashboard for follow-ups, pricing, coverage, POD, customer updates, compliance, and failed agents
- Clerk authentication with password-gate fallback when Clerk keys are absent
- Local user role sync for owner, sales, ops, and admin users
- Prisma schema for the core brokerage domain
- API routes for audit intake and quote intake
- API routes for CRM creation and contact import
- API routes for carrier/load creation and load tracking
- Health check endpoint at `/api/health`
- Grok/xAI wrapper with local fallback behavior
- Render/Postgres-oriented environment template
- Render Blueprint at `render.yaml`
- Initial Prisma migration for Render deploy
- Render deployment guide at `docs/render-deployment.md`
- Production env checklist at `docs/production-env-checklist.md`
- Generated logistics hero image at `public/freight-hero.png`
- Detailed implementation roadmap

Not included yet:

- Real document storage and file download handling
- PDF parsing/OCR
- Final DAT provider payload mapping
- Final Truckstop provider payload mapping
- General email automation beyond quote emails
- Payment processing
- Background job processing
- Automated transcription worker for bridged calls
- SMS delivery status callbacks
- Signed rate confirmation PDFs

## Product Vision

The goal is to build a custom, AI-native freight brokerage operating system that replaces the need for a bloated off-the-shelf TMS/CRM.

The platform should eventually handle the full workflow:

```txt
Lead capture
-> AI enrichment
-> Outreach
-> Quote intake
-> Rate intelligence
-> Carrier matching
-> Load booking
-> Tracking
-> POD collection
-> Invoicing
-> Analytics
-> Repeat business
```

The system is designed around two active surfaces:

1. Public website
2. Internal CRM/TMS dashboard

The internal dashboard is the operational brain. The public site is the demand engine. Customer-facing account access is intentionally out of scope for now.

## Business Model

This platform is for a pure non-asset freight brokerage.

Core operating model:

- Shippers request freight quotes or savings audits.
- The brokerage sources carrier capacity through DAT, Truckstop, carrier relationships, and internal history.
- The brokerage quotes the customer, books the carrier, manages execution, and takes the spread.
- Load-level revenue, carrier cost, and operating margin are tracked for business visibility.

## Tech Stack

Locked stack:

- Hosting: Render
- Database: Render Postgres
- AI: Grok / xAI API
- Voice/SMS: Twilio
- Freight marketplace APIs: DAT and Truckstop

Current app stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- Prisma Postgres adapter for Prisma 7
- Zod
- OpenAI-compatible SDK pointed at xAI base URL
- Lucide icons

Likely future additions:

- Clerk for authentication
- Resend for transactional email
- UploadThing, S3, or Cloudflare R2 for document storage
- Stripe for customer payments if online card/ACH payment is needed
- Render worker or queue for background AI/integration jobs

## Repository Structure

```txt
.
|-- prisma/
|   |-- migrations/                # SQL migrations for Render deploy
|   `-- schema.prisma              # Core brokerage data model
|-- docs/
|   |-- production-env-checklist.md
|   |-- render-deployment.md
|   `-- sample-contacts.csv
|-- public/
|   `-- freight-hero.png           # Generated hero image used by homepage
|-- src/
|   |-- app/
|   |   |-- api/                   # Route handlers for intake and CRM/TMS writes
|   |   |-- agents/                # AI Command Center approval and retry surface
|   |   |-- dashboard/             # Internal command center
|   |   |-- leads/                 # Lead list and detail workflow
|   |   |-- shippers/              # Shipper list and account detail workflow
|   |   |-- quote-requests/        # Quote queue and quote-to-load workflow
|   |   |-- carriers/              # Carrier list and profile workflow
|   |   |-- loads/                 # Load board, load detail, events, documents
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx               # Public marketing site
|   |-- components/
|   |   |-- crm-forms.tsx          # Internal CRM/TMS forms
|   |   `-- forms.tsx              # Public audit and quote client forms
|   `-- lib/
|       |-- crm.ts                 # Database-backed view helpers
|       |-- data.ts                # UI copy and sample fallback data
|       |-- grok.ts                # xAI/Grok agent wrapper
|       |-- prisma.ts              # Prisma singleton
|       |-- server-utils.ts
|       |-- utils.ts
|       `-- validation.ts          # Zod schemas
|-- .env.example
|-- package.json
|-- prisma.config.ts               # Prisma 7 database URL config
|-- render.yaml                    # Render Blueprint
`-- README.md
```

## Local Setup

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Useful local routes:

```txt
/             Public site
/login       Temporary team password gate
/dashboard    Internal CRM/TMS shell
/intake       Audit and quote intake review queue
/leads        Lead pipeline, follow-ups, activity, create form, and CSV import
/leads/[id]   Lead detail, update form, and activity logging
/shippers     Shipper company and contact records
/shippers/[id] Shipper account detail with related work
/quote-requests Quote request queue and create form
/quote-requests/[id] Quote detail and quote-to-load conversion
/calls        Call intelligence queue
/calls/[id]   Call transcript, AI extraction, and quote draft review
/carriers     Carrier management and create form
/carriers/[id] Carrier profile and related load history
/loads        Internal load board with filters, search, coverage, posting, margin, tracking, POD, and billing status
/loads/[id]   Load detail, status update, shipment timeline, documents, and invoice records
/settings     Internal operating settings, including call recording disclosure copy
```

## Environment Variables

Required for production:

```txt
DATABASE_URL
XAI_API_KEY
XAI_MODEL
NEXT_PUBLIC_APP_URL
```

Optional/future:

```txt
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_FORWARD_TO_PHONE_NUMBER
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
CLERK_SIGN_IN_URL
CLERK_SIGN_UP_URL
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
STRIPE_SECRET_KEY
```

Temporary internal gate fallback:

```txt
INTERNAL_APP_PASSWORD
INTERNAL_AUTH_COOKIE
```

If Clerk keys are configured, internal routes and write APIs require Clerk login at `/login`. If Clerk keys are absent, the app falls back to `INTERNAL_APP_PASSWORD`. If neither Clerk nor `INTERNAL_APP_PASSWORD` is set, internal routes remain open for local development.

The app currently works without `DATABASE_URL` and `XAI_API_KEY`.

If `DATABASE_URL` is missing:

- API routes validate submissions.
- API routes return success responses.
- No records are persisted.

If `XAI_API_KEY` is missing:

- The Grok wrapper returns local placeholder summaries.
- The forms still work.
- No external AI call is made.

This behavior is intentional for early product development.

## Database Model

The Prisma schema is designed around the full brokerage workflow.

This project uses Prisma 7 conventions:

- `schema.prisma` defines the provider and data model.
- `prisma.config.ts` loads `DATABASE_URL` for Prisma CLI commands.
- Runtime database access uses `@prisma/adapter-pg`.

Core entities:

- `User`
- `Shipper`
- `Contact`
- `Lead`
- `Activity`
- `SavingsAudit`
- `QuoteRequest`
- `CustomerQuote`
- `RateBenchmark`
- `PricingRecommendation`
- `Load`
- `Carrier`
- `CarrierQuote`
- `ShipmentEvent`
- `Document`
- `Invoice`
- `AiAgentRun`

Important design choices:

- `Shipper` represents the customer company.
- `Contact` represents people at shipper companies.
- `Lead` represents sales pipeline status.
- `QuoteRequest` represents requested freight pricing.
- `Load` represents booked freight.
- `Carrier` represents the truck carrier.
- `RateBenchmark` represents manual or future integration-sourced pricing context.
- `PricingRecommendation` represents buy/sell guidance for a quote request.
- `AiAgentRun` logs every AI action for auditability.

### Prisma Commands

Generate Prisma client:

```bash
npm run prisma:generate
```

Create and apply a local migration:

```bash
npm run prisma:migrate
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

Production migrations should be handled carefully through Render deploy commands or a controlled release process.

## Public Website

The public site currently includes:

- Hero section
- Primary CTA for Free AI Freight Savings Audit
- Secondary CTA for internal dashboard preview
- Value proposition cards
- Audit form
- Quote form
- Operating workflow section
- Internal system overview

The homepage is intentionally built as the first working sales surface rather than a generic landing page.

Primary conversion action:

```txt
Free AI Freight Savings Audit
```

Secondary conversion action:

```txt
Instant Quote Request
```

## Free AI Freight Savings Audit

The audit is the flagship lead magnet.

Current form fields:

- Company
- Contact
- Email
- Phone
- Common lanes
- Equipment type
- Monthly volume
- Uploaded invoices or rate confirmations

Current endpoint:

```txt
POST /api/freight-audit
```

Current behavior:

1. Accepts multipart form data.
2. Validates required fields with Zod.
3. Collects uploaded file metadata.
4. Runs `Savings Audit Agent`.
5. If database is configured, creates:
   - Shipper
   - Contact
   - Lead
   - SavingsAudit
   - Document metadata records
   - AiAgentRun
6. Returns a success response to the frontend.

Future behavior:

1. Upload files to durable storage.
2. Extract text from PDFs/images with OCR.
3. Normalize invoice data.
4. Compare historical rates to DAT/Truckstop/internal benchmark rates.
5. Generate a one-page branded PDF.
6. Email the report to the shipper.
7. Create a sales follow-up sequence.
8. Notify the salesperson through the dashboard and optionally SMS.

## Instant Quote Flow

Current form fields:

- Company
- Email
- Origin
- Destination
- Pickup date
- Pickup/delivery windows and addresses
- Equipment type
- Weight
- Commodity, pallets, pieces, dimensions, hazmat, temperature, appointments, accessorials, urgency, and customer reference
- Freight details

Current endpoint:

```txt
POST /api/quote
```

Current behavior:

1. Accepts multipart form data.
2. Validates required fields with Zod.
3. Runs `Quote Structuring Agent`.
4. If database is configured, creates:
   - Shipper
   - Contact
   - Lead
   - QuoteRequest
   - AiAgentRun
5. Returns a success response.
6. Internal users can open the quote request detail page.
7. Accepted quotes can be converted into load records with customer rate, optional carrier, optional carrier cost, and projected gross profit.

Future behavior:

1. Normalize origin/destination with geocoding.
2. Queue carrier outreach.

Current pricing workspace behavior:

1. Edit quote details before pricing so lane, timing, equipment, and requirements are correct.
2. Fetch DAT/Truckstop market rates when provider endpoints and credentials are configured.
3. Add manual fallback benchmarks from DAT, Truckstop, carrier calls, customer history, or internal knowledge.
4. Review same-lane internal load history when available.
5. Generate a system pricing recommendation with target carrier buy rate, customer sell rate, projected margin, risk level, and quote validity.
6. Save manual pricing recommendations when the broker overrides the system recommendation.
7. Record the final customer quote and preserve quote history.
8. Draft a shipper quote email from the latest saved customer quote.
9. Send and log quote emails when Resend credentials are configured.
10. Mark customer quote decisions as accepted, rejected, or needing reprice.

## Internal Dashboard

Current route:

```txt
/dashboard
```

Current sections:

- Daily command center metrics
- Lead pipeline summary
- Database-backed counts for follow-ups, open quotes, active loads, and projected margin
- AI agent brief shell
- Operating checklist shell
- Next build modules

Current internal CRM routes:

- Leads
- Shippers
- Quote requests
- Carriers
- Loads
- Settings
- Record detail pages for leads, shippers, quotes, carriers, and loads

Planned modules:

- Documents
- Invoices
- AI command center

The dashboard should become the main operating workspace for sales and brokerage operations.

## TMS Workflow Implemented Now

The current TMS workflow supports the first manual operating loop:

1. Create or receive a quote request.
2. Open the quote request detail page.
3. Convert the accepted quote into a load.
4. Assign a carrier during conversion or leave the load tendered until coverage is found.
5. Open the load detail page.
6. Generate internal carrier candidates or add candidates from DAT, Truckstop, relationships, texts, or dispatch calls.
7. Request quotes from candidate carriers and preserve sourcing status.
8. Save received carrier offers.
9. Accept the best approved carrier offer, which books the load and updates margin.
10. Update load status as the shipment moves.
11. Add tracking events for pickup, location updates, delays, delivery, and POD.
12. Track customer update status so active loads do not go quiet.
13. Draft a printable carrier rate confirmation from the approved carrier, lane details, freight requirements, and carrier rate.
14. Track rate confirmation state from drafted to sent to signed.
15. Add document metadata for rate confirmations, PODs, invoices, and other load documents.
16. Save invoice amount/status once POD and billing details are ready.

The document workflow is metadata-first. It records what document exists and where it should live later. Rate confirmations can be generated as printable HTML documents today. Durable upload storage, OCR, generated invoice PDFs, signed PDF downloads, email sending, and payment collection are still future work.

## Phone Intake and Call Intelligence Plan

Phase 1 now treats phone quote intake as the primary sales workflow. The quote request record stores the detailed load facts needed for a live pricing call, and those facts copy forward when an accepted quote becomes a load.

The Settings page includes editable call recording disclosure copy. Phase 2 adds the call intelligence foundation:

- Configure the Twilio inbound voice webhook to:

```txt
POST /api/twilio/voice/incoming
```

- The webhook plays the configured disclosure.
- If `TWILIO_FORWARD_TO_PHONE_NUMBER` is set, the call is bridged to that phone number and recorded.
- If no forwarding number is set, the caller can leave a recorded shipment-detail message.
- Recording and transcription callbacks update the call record when Twilio sends them.
- Internal users review calls at `/calls`, edit transcripts, run the Call Intake Agent, and approve quote request drafts.

For bridged live calls, Twilio recording metadata is stored now. Full automated transcription for bridged recordings should be added as a later worker/API integration; the call detail page supports manual transcript entry until then.

Phase 7 adds outbound outreach:

- Lead detail pages include click-to-call and SMS follow-up forms.
- Click-to-call creates an outbound `BrokerageCall`, calls the shipper contact through Twilio when credentials are configured, plays the configured recording disclosure, bridges to `TWILIO_FORWARD_TO_PHONE_NUMBER`, and records call metadata.
- SMS follow-up sends through Twilio when credentials are configured.
- If Twilio is not configured, outreach actions are validated and logged as `Activity` records so the workflow still works during setup.
- Outbound call and SMS actions are attached to the lead, shipper, and contact activity timeline.

## Grok Agent Architecture

Current agents implemented as wrappers:

- `Savings Audit Agent`
- `Quote Structuring Agent`
- `Sales Follow-Up Agent`
- `Quote Pricing Agent`
- `Carrier Coverage Agent`
- `Load Tracking Agent`
- `Billing Readiness Agent`
- `Carrier Compliance Agent`

The wrapper lives at:

```txt
src/lib/grok.ts
```

It uses the OpenAI-compatible SDK with xAI base URL:

```txt
https://api.x.ai/v1
```

The model is controlled by:

```txt
XAI_MODEL
```

Default:

```txt
grok-4.3
```

Internal agents are approval-first. They generate recommendations and write to
`AiAgentRun`, but they do not send messages, post loads, alter statuses, or
commit customer/carrier actions without a separate human-approved workflow.

Future agents:

- Lead Research Agent
- DAT/Truckstop Rate Intelligence Agent
- Automated Carrier Match Agent
- Twilio Call/SMS Follow-Up Agent
- CEO Daily Brief Agent

Every agent run should write to `AiAgentRun`.

Minimum agent log fields:

- Agent name
- Related entity type
- Related entity ID
- Status
- Prompt
- Input JSON
- Output JSON
- Confidence
- Error message
- Timestamp

This is important because AI automation needs traceability.

## DAT and Truckstop Integration Plan

The DAT/Truckstop adapter boundary is implemented for rate lookup, capacity search, and load posting. These calls use configured endpoint URLs from the brokerage's provider accounts, normalize useful data into internal records, and log provider payloads for audit/debugging.

Recommended abstraction:

```txt
src/lib/integrations/dat.ts
src/lib/integrations/truckstop.ts
src/lib/rating/rate-intelligence.ts
src/lib/marketplace/marketplace-workflow.ts
```

Current capability:

- Rate lookup by lane
- Normalize rate data into `RateBenchmark`
- Capacity search by load
- Normalize capacity matches into `CarrierSourcingCandidate`
- Post load to configured provider endpoints
- Store provider request/response logs in `IntegrationLog`

Future capabilities:

- Pull carrier responses
- Automated carrier quote sync

Data should flow into:

- `QuoteRequest`
- `CustomerQuote`
- `Carrier`
- `CarrierQuote`
- `Load`
- `AiAgentRun`
- `IntegrationLog`

Do not let API-specific payload shapes leak across the app. Normalize them into internal objects.

## Twilio Integration Plan

Twilio is partially implemented.

Current capabilities:

- Inbound call webhook
- Configurable recording disclosure
- Inbound recording/transcription callbacks
- Call review queue and call-to-quote approval flow
- Lead click-to-call with activity logging
- Lead SMS outreach with activity logging

Remaining capabilities:

- SMS shipment update templates
- Missed call handling
- Voicemail/transcription worker for bridged calls
- SMS delivery status callbacks
- Broader click-to-call and SMS surfaces on shippers, carriers, quotes, and loads

Data should flow into:

- `Activity`
- `Lead`
- `Contact`
- `Shipper`
- `ShipmentEvent`
- `AiAgentRun`

Recommended rule:

Every phone call, SMS, email, meeting, AI touch, and internal note should become an `Activity`.

## Auth Plan

Production internal access protection is implemented with:

```txt
Clerk
```

When Clerk keys are configured, internal CRM/TMS routes and internal write APIs require login at:

```txt
/login
```

Initial roles:

- `OWNER`
- `SALES`
- `OPS`
- `ADMIN`

The first signed-in user synced into Postgres is bootstrapped as `OWNER`. Later users default to `SALES` unless their Clerk public metadata contains a valid `role`. Settings and AI prompt-template updates are limited to `OWNER` and `ADMIN` when Clerk is active.

## Render Deployment Plan

Recommended Render services:

1. Web service
2. Render Postgres database
3. Background worker later, when AI/integration jobs become asynchronous

Suggested web service settings:

```txt
Build command: npm ci && npm run prisma:deploy && npm run build
Start command: npm run start
Node version: 22+
Health check path: /api/health
```

Environment variables:

- Set all required variables in Render.
- Use Render Postgres internal connection string for `DATABASE_URL`.
- Use SSL mode as required by Render Postgres.
- Set Clerk keys and redirect URLs before the app is publicly reachable.
- Use `INTERNAL_APP_PASSWORD` only as a temporary fallback if Clerk keys are not configured yet.

Blueprint files:

```txt
render.yaml
docs/render-deployment.md
docs/production-env-checklist.md
```

Before first production deploy:

1. Create Render Postgres.
2. Set `DATABASE_URL`.
3. Run Prisma migration.
4. Set `XAI_API_KEY`.
5. Set `NEXT_PUBLIC_APP_URL`.

## Development Roadmap

### Milestone 1: Foundation

Status: complete.

- Next.js app
- Prisma schema
- Public homepage
- Audit form
- Quote form
- Internal dashboard shell
- Grok wrapper
- README

### Milestone 2: Real CRM

Status: mostly complete for V1.

- Shared internal layout/navigation
- Clerk auth with temporary internal password fallback
- Intake queue for public audits and quote requests
- Leads page
- Lead detail page
- Lead stage/update form
- Lead activity creation
- Shippers and contacts page
- Quote request queue page
- Database-backed CRM read helpers
- Create lead API/form
- Create shipper/contact API/form
- Create quote request API/form
- CSV contact import API/form
- Activities/timeline view
- Follow-up task view
- AI sales assistant placeholder
- Shipper detail page
- Quote request detail page
- Carrier detail page
- Settings page

Remaining:

- Add edit pages for shippers, contacts, and quote requests
- Add contact detail pages
- Add follow-up completion

### Milestone 3: Savings Audit V1

- Add document storage
- Add PDF/image text extraction
- Add audit report data model refinements
- Add Grok prompt template for audit extraction
- Add branded one-page report generator
- Add email delivery
- Add internal audit review screen

### Milestone 4: Quote Workflow

- Add quote request queue
- Add quote detail page
- Convert accepted quote request to load
- Add rich phone quote intake fields
- Preserve detailed intake data through quote-to-load conversion
- Add pricing notes, urgency, target margin, accessorials, and customer reference fields
- Add manual rate benchmarks
- Add system buy/sell pricing recommendations
- Add same-lane internal history in quote detail
- Add quote validity and risk notes
- Add quote email draft
- Add quote email send/log workflow
- Add accepted/rejected status flow

Remaining:

- Add DAT/Truckstop pricing lookup

### Milestone 5: TMS Core

Status: started.

- Carrier management page
- Create carrier API/form
- Load operations page
- Internal load board with dense operational rows
- Load board KPI filters, search, equipment filter, and sorting
- Load board quick actions into coverage and marketplace workspaces
- Create load API/form
- Load detail page
- Load status update API/form
- Shipment event API/form
- Shipment timeline
- Customer rate, carrier rate, margin, and margin percent views
- Convert accepted quote to load
- Add document/POD metadata records
- Carrier assignment from load detail
- Carrier sourcing candidate pipeline
- Internal carrier candidate generation from carrier history
- Manual carrier candidate entry for DAT, Truckstop, relationships, texts, and dispatch calls
- Candidate quote-request status tracking
- Carrier offer entry and accept-to-book workflow
- POD document updates load status
- Billing readiness state
- Invoice amount/status records
- Customer update status and timeline handling
- Rate confirmation status tracking
- Generated printable rate confirmation documents
- Carrier compliance approval gate before accepting offers

Remaining:

- Add automated DAT/Truckstop carrier quote sync
- Add durable POD upload and downloads
- Add generated invoice PDFs and email sending
- Add signed rate confirmation PDFs and email sending

### Milestone 6: DAT and Truckstop

- Add API clients
- Add rate lookup
- Add capacity search
- Add load posting
- Add payload logging
- Add rate intelligence agent

Remaining:

- Add carrier response sync
- Map final provider-specific equipment IDs and payload fields from account documentation

### Milestone 7: Twilio and Outreach

- Add Twilio client
- Play configurable call recording disclosure from Settings
- Add inbound call webhook
- Add call recording metadata and transcription records
- Match calls to shipper/contact/recent activity by phone number
- Add Grok autofill for quote request drafts from call transcripts
- Add call review queue and approve-to-quote flow
- Add click-to-call
- Add SMS sending
- Add call/SMS activity logging

Remaining:

- Add AI follow-up suggestions
- Add shipment update templates
- Add SMS delivery status callbacks
- Add outbound outreach surfaces beyond leads

### Milestone 8: AI Command Center

- Approval-first agent run endpoint
- Entity-level agent forms
- Dashboard agent run visibility
- Dedicated AI Command Center page
- Agent approval queue
- Failed-agent retry queue
- Recent agent run explorer

### Milestone 9: AI Management Layer

- Prompt template management
- Daily management brief
- Exception dashboard
- Prompt templates persisted through existing app settings

Remaining:

- Add scheduled daily brief delivery
- Add exception assignment/ownership
- Add prompt version history

### Milestone 10: Internal Load Board

- Convert `/loads` from summary cards to a broker load board
- Add KPI filters for needs carrier, posted, customer update, POD, ready invoice, and exceptions
- Add board search, equipment filter, and pickup/margin/shipper/status sorting
- Add dense load rows for lane, dates, freight details, coverage, rates, DAT/Truckstop post state, tracking, documents, and billing readiness
- Add mobile load-board rows for smaller screens
- Add quick actions to open, cover, or post a load from the board

Remaining:

- Add saved board views per user
- Add column toggles
- Add server-side pagination for high load volume
- Add carrier response sync from DAT/Truckstop

### Milestone 11: Clerk Auth and Roles

- Add Clerk Next.js SDK
- Wrap the app with `ClerkProvider` when Clerk keys are configured
- Protect internal routes and write APIs with Clerk sessions
- Keep temporary password gate as a fallback only when Clerk keys are absent
- Add custom `/login` Clerk sign-in/sign-up surface
- Sync signed-in Clerk users into the local `User` table
- Bootstrap the first synced user as `OWNER`
- Support local roles: `OWNER`, `SALES`, `OPS`, and `ADMIN`
- Limit settings and AI prompt-template updates to `OWNER` and `ADMIN`
- Attribute new leads and customer quotes to the signed-in user when Clerk is active

Remaining:

- Add an owner/admin user-management screen
- Add per-route role permissions beyond settings and prompt templates
- Add Clerk webhook sync for profile/email/metadata changes
- Add invitation workflow for new internal users
- Add audit logs for permission-sensitive actions

### Milestone 12: Quote Status and Email Workflow

- Draft customer quote emails from saved pricing recommendations
- Send quote emails through Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured
- Log quote email attempts to the customer activity timeline
- Avoid marking quote emails as sent when email credentials are missing or provider delivery fails
- Mark quote requests and customer quotes as accepted or rejected from the quote detail page
- Move quotes back to pricing when the customer requests changes
- Include Resend readiness in `/api/health`

Remaining:

- Add quote email version history
- Add inbound reply tracking
- Add Resend webhook handling for delivered, bounced, and complained events
- Add owner/admin controls for quote email sender domains

### Milestone 13: Quote Email Templates

- Add a configurable quote email subject and body template in Settings
- Support explicit quote placeholders such as `{{quotedRate}}`, `{{serviceDetails}}`, and `{{validUntilMessage}}`
- Use the configured template when generating customer quote email drafts
- Keep quote template updates limited to owner and admin users
- Preserve no-database validation behavior for local and first-deploy environments

Remaining:

- Add quote email template version history
- Add separate templates for follow-up, reprice, accepted, and rejected responses
- Add per-user saved signatures
- Let AI agents draft from approved templates while preserving human approval

## Design Principles

- Keep the interface clean, operational, and fast.
- Build the usable app first, not a generic marketing page.
- Keep AI actions visible and auditable.
- Use structured data instead of free-form notes wherever possible.
- Keep integrations behind clean internal service boundaries.
- Keep manual override available for every AI-assisted workflow.
- Avoid coupling the app to any former employer terminology or workflow naming.

## Current Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:studio
```

## Verification Checklist

Before considering a milestone complete:

- `npm run lint` passes
- `npm run build` passes
- Forms submit without environment variables
- Forms persist records when `DATABASE_URL` is configured
- `/api/health` reports app and database status
- Grok wrapper returns placeholders without `XAI_API_KEY`
- Grok wrapper returns agent output with `XAI_API_KEY`
- No former-employer references exist in code, docs, UI, prompts, seed data, or schema

## Immediate Next Steps

Recommended next engineering steps:

1. Run the app locally and review the public/internal screens.
2. Confirm the lead stages, quote fields, and shipper fields with the operator.
3. Push the repo to GitHub.
4. Create the Render Blueprint from `render.yaml`.
5. Set Clerk keys, Clerk redirect URLs, `NEXT_PUBLIC_APP_URL`, and `XAI_API_KEY`.
6. Verify `/api/health` and Clerk login on the live Render URL.
7. Test feature by feature using `docs/render-deployment.md`.
8. Do the post-deploy aesthetics pass.
9. Invite the remaining internal users and assign roles.

The best next product step is to get the first live Render deployment working, then test the CRM workflow with real records before adding deeper automation.
