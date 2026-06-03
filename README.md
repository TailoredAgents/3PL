# Atlanta Freight OS

AI-native CRM, TMS, and shipper portal foundation for a new Atlanta-based pure freight brokerage.

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
- Quote request queue page
- Database-backed CRM read helpers with sample-data fallback
- Create lead form and API
- Create shipper/contact form and API
- Create internal quote request form and API
- CSV contact import form and API
- Sample contact import CSV at `docs/sample-contacts.csv`
- Activity timeline and follow-up views
- AI sales assistant placeholders
- Shipper portal shell
- Prisma schema for the core brokerage domain
- API routes for audit intake and quote intake
- API routes for CRM creation and contact import
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

- Clerk production authentication
- Real document storage
- PDF parsing/OCR
- DAT integration
- Truckstop integration
- Twilio integration
- Email sending
- Payment processing
- Production role-based permissions
- Real shipper-specific portal data
- Background job processing

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

The system is designed around three surfaces:

1. Public website
2. Shipper portal
3. Internal CRM/TMS dashboard

The internal dashboard is the operational brain. The public site is the demand engine. The shipper portal is the customer retention layer.

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
├── prisma/
│   ├── migrations/                # SQL migrations for Render deploy
│   └── schema.prisma              # Core brokerage data model
├── docs/
│   ├── production-env-checklist.md
│   ├── render-deployment.md
│   └── sample-contacts.csv
├── public/
│   └── freight-hero.png           # Generated hero image used by homepage
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── freight-audit/
│   │   │   │   └── route.ts       # Audit intake endpoint
│   │   │   └── quote/
│   │   │       └── route.ts       # Quote intake endpoint
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Internal CRM/TMS shell
│   │   ├── portal/
│   │   │   └── page.tsx           # Shipper portal shell
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Public marketing site
│   ├── components/
│   │   └── forms.tsx              # Audit and quote client forms
│   └── lib/
│       ├── data.ts                # UI copy and placeholder metrics
│       ├── grok.ts                # xAI/Grok agent wrapper
│       ├── prisma.ts              # Prisma singleton
│       ├── utils.ts
│       └── validation.ts          # Zod schemas
├── .env.example
├── package.json
├── prisma.config.ts               # Prisma 7 database URL config
├── render.yaml                    # Render Blueprint
└── README.md
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
/internal-login Temporary internal password gate
/dashboard    Internal CRM/TMS shell
/intake       Audit and quote intake review queue
/leads        Lead pipeline, follow-ups, activity, create form, and CSV import
/leads/[id]   Lead detail, update form, and activity logging
/shippers     Shipper company and contact records
/quote-requests Quote request queue and create form
/portal       Shipper portal shell
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
DAT_CLIENT_ID
DAT_CLIENT_SECRET
TRUCKSTOP_CLIENT_ID
TRUCKSTOP_CLIENT_SECRET
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
```

Temporary internal gate:

```txt
INTERNAL_APP_PASSWORD
INTERNAL_AUTH_COOKIE
```

If `INTERNAL_APP_PASSWORD` is set, internal routes and CRM write APIs require login at `/internal-login`. If it is not set, internal routes remain open for local development. Set this before any public Render deployment until Clerk is wired.

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
- Equipment type
- Weight
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

Future behavior:

1. Normalize origin/destination with geocoding.
2. Fetch live rates from DAT and Truckstop.
3. Suggest target carrier buy rate.
4. Suggest customer sell rate.
5. Calculate projected margin.
6. Draft shipper quote email.
7. Queue carrier outreach.

## Internal Dashboard

Current route:

```txt
/dashboard
```

Current sections:

- Daily command center metrics
- Lead pipeline summary
- AI agent brief shell
- Operating checklist shell
- Next build modules

Current internal CRM routes:

- Leads
- Shippers
- Quote requests

Planned modules:

- Loads
- Carriers
- Documents
- Invoices
- AI command center
- Settings

The dashboard should become the main operating workspace for sales and brokerage operations.

## Shipper Portal

Current route:

```txt
/portal
```

Current sections:

- Portal overview
- Post-load placeholder
- Active shipment placeholder
- Invoice placeholder
- Shipment activity shell
- AI lane suggestion shell

Future portal features:

- Authentication
- Customer-specific records
- Post new load
- View active loads
- View shipment history
- Download PODs
- View invoices
- View savings reports
- Receive AI lane suggestions
- Approve quotes
- Message brokerage team

## Grok Agent Architecture

Current agents implemented as wrappers:

- `Savings Audit Agent`
- `Quote Structuring Agent`

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

Future agents:

- Lead Research Agent
- Sales Follow-Up Agent
- Rate Intelligence Agent
- Carrier Match Agent
- Tracking Agent
- Billing Agent
- Compliance Agent
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

These integrations are not implemented yet.

Recommended abstraction:

```txt
src/lib/integrations/dat.ts
src/lib/integrations/truckstop.ts
src/lib/rating/rate-intelligence.ts
```

Initial capabilities:

- Rate lookup by lane
- Capacity search by lane
- Post load
- Pull carrier responses
- Normalize carrier/rate data
- Store integration payloads for audit/debugging

Data should flow into:

- `QuoteRequest`
- `CustomerQuote`
- `Carrier`
- `CarrierQuote`
- `Load`
- `AiAgentRun`

Do not let API-specific payload shapes leak across the app. Normalize them into internal objects.

## Twilio Integration Plan

Twilio is not implemented yet.

Recommended capabilities:

- Click-to-call from CRM
- Call logging
- SMS outreach
- SMS shipment updates
- Missed call handling
- Voicemail transcription if needed

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

Temporary internal access protection is implemented with:

```txt
INTERNAL_APP_PASSWORD
```

When `INTERNAL_APP_PASSWORD` is set, internal CRM/TMS routes and internal write APIs require login at:

```txt
/internal-login
```

This is a deployment safety gate, not the final auth system.

Recommended provider:

```txt
Clerk
```

Initial roles:

- `OWNER`
- `SALES`
- `OPS`
- `ADMIN`

Portal users can be modeled later either as:

1. A separate `PortalUser` model, or
2. A `User` with a shipper-scoped role.

Recommendation:

Start with internal users first, then add shipper portal users once the internal workflow is stable.

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
- Set `INTERNAL_APP_PASSWORD` before the app is publicly reachable.

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
- Shipper portal shell
- Grok wrapper
- README

### Milestone 2: Real CRM

Status: started.

- Shared internal layout/navigation
- Temporary internal password gate
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

Remaining:

- Replace temporary password gate with Clerk auth
- Add edit/detail pages for shippers, contacts, and quote requests
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
- Add customer quote creation
- Add target buy/sell rate logic
- Add projected margin
- Add quote email draft
- Add accepted/rejected status flow

### Milestone 5: TMS Core

- Convert accepted quote to load
- Add carrier records
- Add carrier quotes
- Add load status workflow
- Add shipment events
- Add POD upload
- Add invoice generation

### Milestone 6: DAT and Truckstop

- Add API clients
- Add rate lookup
- Add capacity search
- Add load posting
- Add carrier response sync
- Add payload logging
- Add rate intelligence agent

### Milestone 7: Twilio and Outreach

- Add Twilio client
- Add click-to-call
- Add SMS sending
- Add call/SMS activity logging
- Add AI follow-up suggestions
- Add shipment update templates

### Milestone 8: Shipper Portal

- Add portal auth
- Add shipper scoping
- Add new load form
- Add active load list
- Add tracking view
- Add savings report view
- Add invoice view
- Add AI lane suggestions

### Milestone 9: AI Command Center

- Add prompt template management
- Add agent run explorer
- Add approval queues
- Add failed-agent retry
- Add daily brief
- Add exception dashboard

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
5. Set `INTERNAL_APP_PASSWORD`, `NEXT_PUBLIC_APP_URL`, and `XAI_API_KEY`.
6. Verify `/api/health` and internal login on the live Render URL.
7. Test feature by feature using `docs/render-deployment.md`.
8. Do the post-deploy aesthetics pass.
9. Replace the temporary internal password gate with Clerk auth.

The best next product step is to get the first live Render deployment working, then test the CRM workflow with real records before adding deeper automation.
