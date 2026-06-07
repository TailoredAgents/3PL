# DAO Logistics OS System Overview

DAO Logistics OS is a custom CRM/TMS for a pure freight brokerage. It is built
around the actual brokerage workflow: talk to shippers, price freight, source
capacity, vet carriers, book loads, track shipments, collect documents, bill
customers, pay carriers, report margin, and use AI agents to reduce manual work.

## Operating Model

DAO Logistics does not own trucks, trailers, drivers, or warehouse space. The
business sells freight brokerage service:

1. A customer shares load details by phone, email, portal, quote form, or sales
   follow-up.
2. The team prices the load using DAT, Truckstop, internal history, lane rules,
   manual benchmarks, and AI-assisted recommendations.
3. The customer receives a quote.
4. If approved, the quote converts to a load.
5. The load is posted or shopped to carriers through DAT, Truckstop, carrier
   relationships, and internal sourcing records.
6. The carrier is vetted before booking.
7. A compliant carrier receives a rate confirmation.
8. Operations tracks pickup, transit, delivery, customer updates, exceptions,
   POD, and documents.
9. Finance invoices the customer, manages carrier payables, stages payment, and
   tracks commission readiness.

## Internal Navigation

The internal app is grouped by how the team works:

- **Command Center**: dashboard and search.
- **Sales & CRM**: leads, shippers, quotes/pricing, and communications.
- **Operations**: load board, tracking, carriers, and documents.
- **Finance**: invoicing and payables.
- **Reporting**: analytics.
- **Admin / AI**: integrations, AI Command Center, admin controls, and settings.

## Sales And Communications

Communications is the CRM-style workspace for customer interaction. It brings
together call records, email events, SMS paths, internal notes, recent customer
context, request review, and agent-assisted follow-up.

The conversation-notes style context should be treated as always-on operational
memory. Manual "run agent" actions are primarily for quote/pricing and sales
follow-up work where a salesperson wants a draft or recommendation.

Sales records flow through:

```txt
Lead
-> Shipper
-> Contact
-> Activity
-> QuoteRequest
```

Shippers can have a lifetime acquisition owner. Loads can have a separate
manager. Those two fields drive commission logic.

## Quote And Pricing

Quote requests capture detailed shipment facts:

- origin/destination cities, states, and addresses
- pickup and delivery dates/windows
- equipment
- commodity
- weight
- pallets/pieces/dimensions
- hazmat
- temperature
- appointments
- accessorials
- customer reference
- urgency
- pricing notes

Pricing supports:

- manual DAT benchmark records
- manual Truckstop benchmark records
- DAT/Truckstop adapter boundaries for real rates/capacity/posting
- internal same-lane history
- pricing recommendations
- quote email drafts
- saved customer quotes
- accepted/rejected/reprice state
- conversion to operational load

DAT and Truckstop are the intended market pricing sources. Until account-specific
payloads are finalized, manual benchmarks and adapter logging keep the workflow
usable without pretending fake live rates are real.

## Load Board And Operations

The Load Board is the main day-to-day operations view. It is designed to show
many loads at once without opening every detail page.

It surfaces:

- load status
- lane
- shipper
- carrier
- pickup/delivery timing
- customer rate
- carrier rate
- gross profit
- coverage state
- DAT/Truckstop posting/capacity context
- tracking state
- POD state
- billing state
- exceptions

The load detail page remains the source of truth for deeper work: shipment
events, carrier candidates, carrier quotes, carrier acceptance, documents, rate
confirmation, customer updates, invoice records, and commission attribution.

## Carrier Compliance

Carriers have a profile and compliance record:

- MC/DOT
- authority
- insurance
- safety rating
- fraud risk
- callback verification
- insurance expiration
- W-9 / COI / agreement documents
- notes
- blocked reason
- preferred lanes
- performance scorecard context

The carrier booking gate is enforced server-side. A blocked or non-approved
carrier offer cannot be accepted into a load booking.

Carrier 411 or comparable vetting remains an external provider choice to verify
before launch. The system is structured to add that provider without creating a
parallel carrier workflow.

## Tracking And Visibility

Tracking centralizes active shipment oversight:

- pickup confirmation
- location/check-call events
- delays
- delivered status
- POD uploaded state
- stale update risk
- customer update due state
- internal exceptions
- exception owner/resolution
- public tracking links

Carrier portal check calls and internal shipment events both write into the same
tracking/load event model.

## Documents

Documents are central records, not one-off attachments. Documents can link to:

- loads
- shippers
- quote requests
- carriers
- savings audits
- users

Supported document types include:

- BOL
- POD
- invoice
- rate confirmation
- audit upload
- W-9
- certificate of insurance
- broker-carrier agreement
- other

The document model supports storage metadata, download route, MIME type, file
size, source, status, extracted text, structured fields, and extraction status.
Image/text extraction and review gates are in place. Full PDF OCR/provider
verification is a final pre-launch item.

## Finance And Commissions

Customer invoicing and carrier payables are built around load records.

Carrier payables include:

- carrier invoice amount
- agreed rate
- approval state
- approval user
- paid state
- paid user
- payment method
- payment batch
- dispute notes
- remittance notes

Payables cannot be marked paid before approval. Owner/admin restrictions apply
when Clerk is active.

The commission plan uses the current DAO Logistics split:

- load manager: 35%
- lifetime client converter: 15%
- Austin: 20%
- company: 30%

Commission reporting separates forecast from payout-ready commission. Payout
readiness requires both customer payment and carrier settlement.

## Portals

Customer portal:

- customer login by enabled account/contact email
- quote request visibility
- new quote request submission
- lane preferences
- contact preferences
- active loads
- tracking links
- documents
- recent invoices

Carrier portal:

- carrier login by carrier/contact email
- assigned load visibility
- tender visibility
- check-call update submission
- document upload

Portal auth is intentionally lightweight today and should be hardened with final
auth/magic-link behavior before external launch.

## AI Command Center

AI output is logged as `AiAgentRun` records. The system tracks:

- agent name
- related entity
- status
- prompt/input/output
- confidence
- automation mode
- risk level
- approval required
- review notes
- approval/rejection users
- prompt version snapshot

The major agents are:

- Savings Audit Agent
- Quote Structuring Agent
- Sales Follow-Up Agent
- Quote Pricing Agent
- Carrier Coverage Agent
- Load Tracking Agent
- Billing Readiness Agent
- Carrier Compliance Agent
- Document Automation Agent
- Daily Brief Agent

AI is meant to help salespeople make more money with less manual work. It should
draft, summarize, flag exceptions, recommend next actions, and prepare work for
approval. Customer-facing messages, compliance-sensitive decisions, financial
actions, and load execution decisions should remain gated until the business is
comfortable increasing automation.

## Integrations And Monitoring

The Integrations page shows credential readiness, health checks, retry actions,
and recent logs for major providers:

- DAT
- Truckstop
- Twilio
- Resend
- xAI/Grok
- FMCSA
- HERE
- EIA
- CarrierOk

Integration logs track provider, action, status, payload snippets, messages,
errors, external IDs, and related load/quote where applicable.

## Local QA State

The app has a local QA database and seed workflow:

```bash
npm run prisma:deploy
npm run qa:seed
```

Seeded records cover the main workflow:

- Austin, Conner, Devon, Michael
- standard commission plan
- QA shipper/contact/customer account
- two quote requests
- DAT/Truckstop benchmark placeholders
- pricing recommendation
- approved carrier
- blocked carrier
- active load
- completed paid load
- tracking exception
- documents
- customer invoice
- paid carrier invoice
- AI approval item
- call transcript
- audit log

## Final Pre-Launch Work

The roadmap is functionally complete. Final launch work is intentionally pushed
to the pre-launch step:

- run the full local QA test plan
- fix bugs found during realistic usage
- verify real Clerk, Twilio, Resend, xAI/Grok, storage/OCR, DAT, Truckstop,
  FMCSA/HERE/EIA, and carrier compliance provider credentials
- finalize DAT/Truckstop account-specific payload mapping
- verify webhook URLs in provider dashboards
- remove stale sample copy before production use
- decide whether payment processing or accounting sync is needed before launch
