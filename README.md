# DAO Logistics OS

DAO Logistics OS is an AI-native CRM/TMS operating system for a non-asset
freight brokerage. It is built to manage the full brokerage workflow from
customer communication and quote intake through carrier coverage, tracking,
documents, billing, payables, commissions, analytics, portals, and AI-assisted
operations.

The feature roadmap is now treated as functionally complete. Remaining work is
final pre-launch QA, real credential verification, and live integration tuning.

## What It Does

The system supports the core freight brokerage operating loop:

```txt
Communications
-> Leads / Shippers / Contacts
-> Quotes & Pricing
-> DAT/Truckstop rate context
-> Load Board
-> Carrier sourcing and compliance
-> Rate confirmation
-> Tracking / POD
-> Invoicing / Payables
-> Commissions / Analytics
-> Repeat business
```

DAO Logistics is a pure brokerage. The platform does not manage owned trucks,
trailers, drivers, or warehouse inventory. It manages customer demand, carrier
capacity, load execution, margin, documents, communication history, and
AI-assisted work.

## Main Product Areas

- **Public site**: shipper-facing landing page with freight audit and quote
  request entry points.
- **Communications**: CRM-style workspace for customer context, calls, email
  events, SMS paths, notes, quote review, and follow-up.
- **Leads / Shippers / Contacts**: sales pipeline, company records, contact
  history, customer preferences, and lifetime client owner attribution.
- **Quotes & Pricing**: quote intake, editable shipment details, DAT/Truckstop
  benchmark placeholders/adapters, manual benchmarks, pricing recommendations,
  quote email drafts, customer quote history, and quote-to-load conversion.
- **Load Board**: dense brokerage board for active and completed loads, status,
  carrier coverage, margin, tracking, POD, billing readiness, and quick actions.
- **Carriers**: carrier profiles, compliance checklist, callback verification,
  documents, scorecard, sourcing candidates, offers, and blocked-carrier booking
  protection.
- **Tracking**: active load visibility, shipment events, check calls,
  exceptions, customer update state, POD risk, and public tracking links.
- **Documents**: central document register for BOL, POD, invoice, rate
  confirmation, W-9, COI, broker-carrier agreement, audit, and other paperwork.
- **Billing / Payables**: customer invoices, carrier invoices, approval gates,
  payment batches, payable status, and auditability.
- **Admin Controls**: users, roles, Clerk sync/invitations, audit logs,
  commission plan, attribution, and administrative controls.
- **Analytics**: lane, shipper, carrier, margin, revenue, and sales opportunity
  reporting.
- **AI Command Center**: agent runs, approval queue, retries, daily brief,
  prompt versions, automation modes, and audit trail.
- **Customer Portal**: customer quote requests, loads, tracking links,
  documents, invoices, lanes, and contacts.
- **Carrier Portal**: carrier load/tender visibility, check-call updates, and
  document uploads.
- **Integrations**: credential presence, provider health tests, retry actions,
  and integration logs for DAT, Truckstop, Twilio, Resend, xAI/Grok, FMCSA,
  HERE, EIA, CarrierOk, and storage-related workflows.

## AI Design

AI is designed as a controlled automation layer, not an invisible black box.
Agents can assist with:

- savings audit summaries
- quote structuring
- sales follow-up
- quote pricing
- carrier coverage
- load tracking/customer updates
- billing readiness
- carrier compliance
- document automation
- daily operational brief

Customer-facing, financial, compliance, and operationally risky actions keep
human approval gates. Autonomous/background behavior is prepared through agent
modes, logs, approvals, retries, prompt history, and integration logging.

## Integrations

Configured or prepared integration areas:

- **Grok / xAI**: OpenAI-compatible SDK pointed at xAI.
- **DAT**: rate, capacity, and posting adapter boundaries plus logging.
- **Truckstop**: rate, capacity, and posting adapter boundaries plus logging.
- **Twilio**: inbound voice, recording disclosure, call status callbacks,
  transcription callbacks, outbound click-to-call, SMS paths, and logging.
- **Resend**: quote email sending and email webhook logging.
- **Clerk**: internal authentication, role sync, invitations, and webhooks.
- **S3/R2-compatible storage**: document storage metadata and download route.
- **FMCSA / CarrierOk**: carrier enrichment and compliance readiness.
- **HERE / EIA**: mileage and diesel enrichment readiness.

Final account-specific payload mapping and live credential verification happen
in the final pre-launch step.

## Tech Stack

- Next.js 16 App Router
- React
- TypeScript
- Tailwind CSS
- Prisma 7
- Prisma Postgres adapter
- PostgreSQL
- Zod
- OpenAI-compatible SDK for xAI/Grok
- Lucide icons
- Render deployment blueprint

## Repository Structure

```txt
.
|-- prisma/
|   |-- migrations/
|   `-- schema.prisma
|-- docs/
|   |-- end-to-end-build-roadmap.md
|   |-- local-qa-test-plan.md
|   |-- production-env-checklist.md
|   |-- render-deployment.md
|   |-- sample-contacts.csv
|   `-- system-overview.md
|-- public/
|   `-- freight-hero.png
|-- scripts/
|   `-- seed-qa.mjs
|-- src/
|   |-- app/
|   |-- components/
|   `-- lib/
|-- .env.example
|-- package.json
|-- prisma.config.ts
|-- render.yaml
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

Start the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Useful commands:

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:migrate
npm run prisma:studio
npm run qa:seed
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

## Local QA Database

For local record-based testing, use the dedicated local Postgres QA database:

```bash
createdb -h localhost dao_logistics_qa
```

Use an ignored local `.env` like:

```txt
DATABASE_URL=postgresql://richardaustindugger@localhost:5432/dao_logistics_qa?schema=public
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_APP_PASSWORD=qa-phase-12
INTERNAL_AUTH_COOKIE=dao_logistics_internal
XAI_MODEL=grok-4.3
```

Apply migrations and seed realistic records:

```bash
npm run prisma:deploy
npm run qa:seed
```

Seeded QA access:

```txt
Internal password gate: qa-phase-12
Customer portal email: jordan.reed@qa-apex.example
Carrier portal email: dispatch@qa-reliable.example
Primary quote: qa-quote-atl-nash
Active load: qa-load-active
Completed paid load: qa-load-completed
```

## Key Routes

```txt
/                         Public site
/login                    Internal login
/dashboard                Internal command center
/communications           Calls, email/SMS paths, notes, request review
/leads                    Sales pipeline
/shippers                 Shipper accounts and contacts
/quote-requests           Quote queue and pricing workspace
/loads                    Load Board
/tracking                 Tracking and exceptions workspace
/carriers                 Carrier management and compliance
/documents                Document center
/billing                  Customer invoicing
/payables                 Carrier payables
/analytics                Reporting
/agents                   AI Command Center
/integrations             Integration health/logs
/admin                    Admin controls, audit, commission plan
/settings                 Operating settings and templates
/portal                   Customer portal
/carrier-portal           Carrier portal
/track/[token]            Public tracking link
/api/health               Health check
```

## Environment And Launch Docs

- [System overview](docs/system-overview.md)
- [End-to-end build roadmap](docs/end-to-end-build-roadmap.md)
- [Local QA test plan](docs/local-qa-test-plan.md)
- [Production environment checklist](docs/production-env-checklist.md)
- [Render deployment guide](docs/render-deployment.md)

## Current State

The roadmap phases are considered functionally complete. The remaining work is
final pre-launch hardening:

- run the full local QA script with realistic records
- fix bugs found during final usage testing
- verify real provider credentials and webhook URLs
- complete account-specific DAT/Truckstop payload mapping
- verify Twilio, Resend, Clerk, storage/OCR, xAI/Grok, FMCSA/HERE/EIA, and
  carrier compliance providers
- remove any stale sample copy before production use

Do not restart the project or create duplicate workflows. Extend the existing
pages, APIs, Prisma models, and helper libraries.
