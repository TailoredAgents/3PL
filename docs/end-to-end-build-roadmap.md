# End-to-End Build Roadmap

This is the active build roadmap for finishing the freight brokerage operating
system. The README keeps historical context and completed milestones; this file
is the forward-looking execution plan.

## Current Build Position

The app already has the main internal brokerage spine:

```txt
Communications
-> Leads / Shippers / Contacts
-> Quotes & Pricing
-> Load Board
-> Carriers
-> Tracking / POD
-> Invoicing / Payables
-> Analytics
-> AI Command Center
```

The next work should deepen the operating system around documents, compliance,
accounting, integrations, portals, and AI automation. Do not restart the project
or duplicate existing flows. Extend the current pages, APIs, models, and helper
libraries wherever practical.

## Current State Log

- 2026-06-06: Phase 0 completed. Lint, TypeScript, and production build all
  pass. Render blueprint still uses `npm ci && npm run prisma:deploy &&
  npm run build`, `npm run start`, and `/api/health`.
- 2026-06-06: Phase 1 completed. Documents now have a central register,
  S3/R2-compatible storage metadata, a download route, file size/MIME/source/
  status/extraction fields, and document links on load, shipper, carrier,
  billing, and payables workflows.
- Phase 2.1 completed: Document text extraction foundation. Auto-extract for
  plain text uploads; runDocumentExtraction + clean adapter (text direct,
  PDF/image provider boundary) in src/lib/documents.ts; POST
  /api/documents/[id]/extract supporting auto + manual review overrides
  (sets COMPLETED/FAILED/PENDING using existing fields); review UI with
  Run/Review/Save flows + text snippets embedded in /documents (desktop +
  mobile); extractedText surfaced in document views; all without schema
  changes or duplicate systems. Validations (lint/tsc/prisma/build) and
  push passed. Prepares raw extractedText for later BOL/POD parsing,
  carrier invoice matching, and billing automation with human review gate.

- Phase 6.1 completed: Integrations admin page. New /integrations route with
  credential presence (env key checks for DAT, TRUCKSTOP, Twilio, Resend,
  xAI/Grok, FMCSA, HERE, EIA, CarrierOk), last success/failure + recent per-
  provider logs from IntegrationLog, global recent activity table (status
  badges, error surfacing), metrics (configured count, failure rate). Reuses
  existing marketplace logging, per-load log surfaces, InternalShell, nav
  patterns. No new models or migrations. Full validation + push passed. Roadmap
  updated. Followed all handoff rules.
- Phase 6.2 completed: Expanded logging + test actions. Added explicit
  migration extending IntegrationProvider (TWILIO/RESEND/XAI/FMCSA/HERE/EIA/
  CARRIEROK) and IntegrationAction (AGENT_RUN/DOCUMENT_EXTRACTION/HEALTH_CHECK/
  WEBHOOK_RECEIVED). New central logIntegration helper. All major Grok calls
  (agents + document extraction) now emit XAI logs automatically. New
  /api/integrations/test + "Test health" buttons on /integrations cards (XAI
  does real minimal ping). Updated views + page. No duplication of
  marketplace. Validation + push passed. Followed all handoff rules.
- Phase 6.3 completed: Twilio/Resend webhook + voice inbound instrumentation.
  Added logIntegration (WEBHOOK_RECEIVED) to Resend webhook and key Twilio
  voice routes (incoming, status callbacks, transcription). Inbound calls,
  transcripts, and email events now appear in /integrations activity. Updated
  page notes. Reused 6.2 helper/enum. Validation + push passed. Followed rules.
- Phase 6.4 completed: Safe retry for marketplace + FMCSA logging. Extended
  test endpoint + added Retry forms on /integrations for DAT/TRUCKSTOP
  (re-runs capacity/post, new logs). Instrumented FMCSA lookups in
  agent-enrichment. Page notes updated. Validation + push passed. Followed rules.
- Phase 6.5 completed: HERE/EIA logging + deeper actions. Real pings in test
  route for HERE mileage and EIA diesel (logged). Instrumented enrichment
  calls for HERE/EIA. Page updated for visibility. Validation + push passed.
  Followed rules.
- Phase 6.6 completed: Deeper per-provider dashboards. Added activity counts
  (recent/success/fail) to cards + tailored quick links per provider (carriers,
  comms, agents, pricing/loads, etc.) + payload note for DAT/Truckstop.
  Updated crm overview + page. Validation + push passed. Followed rules.
  Phase 6 substantially complete (dashboards + actions + logging for all).

## Multi-Agent Handoff Rules

Use these rules when switching between Codex, Grok terminal agent, and Claude
Code on the same local machine:

1. Start every session with `git pull`, `git status --short --branch`, and a
   quick read of this file.
2. Check the latest commits before editing so the agent knows what the previous
   agent changed.
3. Work one phase or sub-phase at a time.
4. Prefer existing modules and patterns over new duplicate code.
5. Commit and push after each completed phase or meaningful sub-phase.
6. Keep migrations explicit and do not rewrite existing migrations that are
   already pushed.
7. Run the relevant validation before committing. At minimum:

```bash
npx tsc --noEmit --incremental false
npm run build
```

8. If `npm run lint` fails because of known pre-existing lint debt, note the
   exact failures in the final message and continue only when TypeScript/build
   pass.
9. Update this roadmap when a phase is completed, partially completed, or
   intentionally deferred.

## Phase 0: Repo Health And Handoff Foundation

Goal: make the repo easier for every agent to continue safely.

Status: complete.

Build:

- Complete: fixed current lint debt so `npm run lint` passes.
- Complete: added a concise current-state section to this roadmap.
- Complete: kept README as the high-level project summary, not the detailed
  task tracker.
- Complete: confirmed Render build command and production deployment flow still
  match the expected setup.

Completion criteria:

- `npm run lint` passes.
- `npx tsc --noEmit --incremental false` passes.
- `npm run build` passes.
- Roadmap reflects the current phase status.

## Phase 1: Document Center Foundation

Goal: make documents real, downloadable, and usable by operations and AI.

Status: complete.

Build:

- Complete: added a dedicated internal Documents page.
- Complete: added durable file storage metadata using the existing storage
  boundary.
- Complete: supported upload/download for load, shipper, quote, audit, carrier,
  invoice, BOL, POD, and rate confirmation contexts through existing Document
  records.
- Complete: stores file size, MIME type, uploader, source, document status,
  storage key, and extraction status.
- Complete: added document download links on load, shipper, carrier, billing,
  and payables workflows.
- Complete: keeps generated rate confirmations as durable linked printable
  documents; signed PDF generation remains a later finance/document automation
  task.
- Complete: kept document metadata tied to existing `Document` records instead
  of creating parallel document systems.

AI-ready additions:

- Complete: stores extracted text when available.
- Complete: added extraction status so OCR/PDF parsing can run later without
  changing the document model again.

Completion criteria:

- Users can upload, view, and download POD/BOL/rate confirmation documents.
- Load billing readiness uses actual document presence.
- No duplicate document tables or one-off file handling paths.

## Phase 2: OCR And Document Automation

Goal: let the system read important freight paperwork.

Status: foundation complete (sub-phases 2.1 + 2.2). Full PDF OCR still needs
a dedicated parser/provider or PDF-to-image conversion step.

Build (Phase 2.1 completed — text extraction foundation):
- (See previous entry for details of raw text extraction, adapter, /extract API,
  DocumentExtractionControl for text, etc.)

Build (Phase 2.2 completed — structured parsing + real provider + review gates):
- Added `extractedFields` Json column to Document (explicit new migration
  20260607100000_phase2_structured_document_extraction).
- Added runDocumentStructuredExtraction in src/lib/grok.ts (re-uses existing
  xAI/OpenAI client + json_object mode). Supports:
    - Text-based structuring from extractedText.
    - Vision for image files (PNG/JPG etc.): downloads via storage, sends
      base64 data URL to model for OCR + structured field extraction in one pass.
- Extended runDocumentExtraction + POST /api/documents/[id]/extract to run
  structured extraction automatically (when possible) and support manual
  review/save of both text and fields.
- Major upgrade to DocumentExtractionControl: now shows rich review form with
  editable grid for common freight fields (BOL/PRO, pieces, weight, cities,
  rate, commodity, etc.) + raw text. "Save reviewed text + fields" only updates
  the Document (explicit human review gate — no auto-write to Load, CarrierInvoice,
  etc.).
- Basic exception hints come back from the LLM (in the fields object).
- UI surfaces "Structured" badge + review entrypoint on /documents (desktop +
  mobile) and load document lists.
- Because real STORAGE + XAI_API_KEY are present, image files can get
  meaningful structured output through the vision path. PDFs still require
  a dedicated OCR/PDF parsing provider or conversion step before they can be
  read automatically.
- All built by extending Phase 1/2.1 code and patterns. Followed every handoff
  rule (pull/status/roadmap, one sub-phase, explicit migration, full validation
  before commit/push, roadmap update).

This completes the core extraction foundation for Phase 2: the system can read
plain text uploads and image paperwork through the provider-backed vision path,
then store raw/structured results with human review before any operational
impact. PDF OCR remains a follow-up stabilization item.

AI-ready additions (Phase 2):
- Raw text + structured fields (with review) available for Savings Audit Agent,
  Billing Readiness comparisons (POD vs load vs carrier invoice), and future
  autonomous document jobs (Phase 10).
- Document exception signals (mismatches) now possible at extraction time.

Completion criteria for full Phase 2:
- Uploaded text files and supported images produce stored extracted text and/or
  structured fields.
- Uploaded PDFs produce stored extracted text + structured fields after the
  dedicated OCR/PDF parser is wired.
- Users can review/edit both text and structured fields before any downstream
  records are affected.
- Provider-backed image vision path is live when credentials are configured.
- Human review gate is mandatory and visible.
- No duplicate systems; everything extends the existing Document model and
  document center.

## Phase 3: Carrier Onboarding And Compliance

Goal: turn carriers from simple records into fully vetted partner files.

Status: 3.1 + 3.2 complete. Onboarding checklist, docs integration, alerts, scorecard, callback workflow, and hard booking gate largely in place. External adapters remain for later.

Build (Phase 3.1 completed): (see prior entry)

Build (Phase 3.2 completed):

- Added computed performance scorecard fields (onTimePickupRate, issuesCount) to CarrierView, derived safely from load status (list + detail views). Surfaced in new "Performance Scorecard" section on carrier detail (loads, on-time proxy %, issues, margin).
- Enhanced callback verification into a lightweight workflow: CarrierComplianceForm now supports callbackNotes (appended to complianceNotes) + the existing callbackVerifiedAt. Notes + verified date provide auditable "callback" record.
- Improved additional contacts editing: compliance form accepts JSON array for additionalContacts (practical for ops; displayed on detail).
- Hardened the "cannot book" gate in the key path (`/api/loads/[id]/carrier-quotes/[id]/accept`): now rejects on APPROVED + blockedReason with clear messaging. UI badges and detail already flag blocked/non-approved.
- All extends 3.1 model + existing accept logic, documents, events, and forms. Followed handoff rules strictly.

Remaining for full Phase 3 / later:

- Deeper real on-time metrics (using full ShipmentEvent timestamps + ELD data — Phase 5).
- External vetting adapters (prepare boundaries; fmcsaSnapshot partially present).
- Polish callback into dedicated log (e.g., via activities or dedicated events).

Completion criteria (advanced significantly):

- A load cannot be booked with a non-compliant or blocked carrier (hard gate in accept + UI everywhere).
- Compliance status, required docs (W-9/COI via Document Center), expirations, blocked reasons, and performance are explainable from the model + linked records.

## Phase 4: Accounting, AR, AP, And Settlements

Goal: make the back office operational enough to get paid and pay carriers.

Status: complete (via 4.1 + 4.2). Core AR/AP models, credit terms, batch settlement, and printable invoices in place. QB sync and advanced exports can follow as needed.

Build (Phase 4.1 completed): (see prior entry)

Build (Phase 4.2 completed):

- Added customer invoice printable generation (src/lib/invoice.ts + generate/print API routes under /loads/[id]/invoice), modeled exactly on rate-confirmation pattern (text content → SYSTEM_GENERATED Document type=INVOICE with extractedText, nice printable HTML for browser print-to-PDF). Auto-generates on SENT status via existing invoice POST; generate/print links added to load detail billing tab.
- Added carrier payment batch workflow: /api/carrier-invoices/batch-pay endpoint finds all APPROVED carrier invoices, assigns batch ref (e.g. BATCH-YYYY-MM-DD), bulk-updates to PAID + paymentBatch + paidAt in transaction, records shipment events. "Pay All Approved as Batch" button added to /payables page. Queue rows now display paymentBatch when set. Leverages the paymentBatch field added in 4.1.
- Ties into existing payables UI, document links (invoices/rate cons), and status flows. (Email for SENT invoices was already present from earlier work.)
- All extends Phase 1–4.1 foundations and rate-con patterns. No parallel systems or duplication.
- Followed all handoff rules.

Remaining for Phase 4 (optional):
- QuickBooks-ready customer/vendor/invoice/bill sync + error tracking.
- Additional financial export views.
- Granular commission reporting.

Completion criteria:
- Billing moves from delivered/POD received → SENT (printable invoice + email) → PAID with full details.
- Payables moves received → approved → PAID (individual or batch), with metadata, variance, and remittance support.
- Finance exceptions visible/assignable in queues.

## Phase 5: Tracking And Visibility Workspace

Goal: make active loads easy to monitor without opening each load.

Status: 5.1 + 5.2 complete. Internal workspace with computed risks + persistent exception model with ownership/resolution. Public links and adapters deferred.

Build (Phase 5.1 completed): (see prior)

Build (Phase 5.2 completed):

- Added LoadException model + LoadExceptionStatus enum to prisma/schema (explicit migration 20260610100000_phase5_tracking_exceptions_model).
- Added relations on Load and User.
- Updated crm.ts: LoadExceptionView type, included in LoadView, mapLoad now maps exceptions (with owner), queries in getLoadViews/getLoadDetailView include exceptions with owner.
- Added loadExceptionCreate/Update schemas in validation.ts.
- New API route /api/loads/[id]/exceptions supporting POST create and PATCH update (status, owner, notes).
- Added LoadExceptionCreateForm and LoadExceptionUpdateForm in crm-forms.tsx.
- Integrated in loads/[id]/page.tsx: exceptions section with list + update forms, create form.
- Enhanced tracking/page.tsx: per-load exceptions display (from persistent model), inline create/update forms using the new components.
- Persistent model supports ownership (assign to user), status (OPEN/ASSIGNED/RESOLVED), notes, resolvedAt.
- Computed risks from 5.1 remain alongside persistent exceptions.
- All internal-only, reuses existing user, load, forms, revalidation patterns. No duplication.
- Followed handoff rules.

Deferred:
- 5.4: Provider adapters.
- 5.5: Agent workflows.

Build (Phase 5.3 completed):

- Added PublicTrackingLink model (token, expiresAt, revoked) with explicit migration.
- Added to Load model and views (PublicTrackingLinkView in crm.ts, included in queries and mapLoad).
- New generatePublicTrackingLink() and getPublicLoadView(token) in crm.ts (validates token/expiry/revoked, returns scoped public data: loadNumber, lane, status, dates, limited events, hasPod + POD download link. No rates, margins, or sensitive info).
- New API /api/loads/[id]/public-tracking-link (POST to generate 30-day link).
- New public page /track/[token] (unauthenticated, minimal view with shipment basics and POD link if available).
- UI in load detail: "Public tracking link" section with generate button (form posts to API, revalidates page to show active link + URL). Links are shareable, token-based, time-limited, scoped.
- Generation from internal tracking/load detail only. Reuses existing document download (open by design for PODs), events, formatting. No duplication or new auth surface.
- Followed handoff rules.

Completion criteria progress:
- Public tracking link foundation complete (secure tokens, expiration, customer data scoping to basics only).
- Internal operators can generate and share limited views for shippers.
- No full customer portal yet.

Next: 5.4 for provider adapters when needed.

## Phase 6: Integration Admin And Monitoring

Goal: make external provider connectivity manageable from inside the app.

Status: 6.6 complete; DAT/Truckstop payload mapping details and any ultra-final surfaces deferred (pending account docs for mappings).

Build (Phase 6.1 completed): [see prior entry in Current State Log + previous roadmap update]

Build (Phase 6.2 completed):

- Extended IntegrationProvider enum (TWILIO, RESEND, XAI, FMCSA, HERE, EIA, CARRIEROK) and IntegrationAction enum (AGENT_RUN, DOCUMENT_EXTRACTION, HEALTH_CHECK, WEBHOOK_RECEIVED) with one explicit migration (20260607..._phase6_expand_integration_providers/migration.sql). "OTHER" preserved as escape hatch.
- Added reusable logIntegration() helper in src/lib/integrations/logging.ts (central, safe, mirrors the exact data shape used by marketplace-workflow capacity/post log builders; accepts provider/action/status + optional json/message/error/loadId; never throws).
- Instrumented src/lib/grok.ts comprehensively: runSavingsAuditAgent, runQuoteStructuringAgent, runBrokerageAgent, runCallIntakeAgent, and runDocumentStructuredExtraction now emit IntegrationLog entries (provider "XAI", appropriate action, SUCCESS/FAILED with minimal context). Used a small withLoggedXai wrapper for most; manual log calls in document extraction to preserve existing graceful error-return contracts for callers.
- New server Route Handler POST /api/integrations/test: for XAI performs a minimal low-cost chat completion ping (HEALTH_CHECK); for others reports credential presence and logs a check. Always calls the central logger.
- Enhanced the /integrations page (from 6.1): every provider card now renders a "Test health" form button that POSTs the provider key. Resulting log entry appears in the recent cross-provider activity table (revalidate on success). Updated header description, per-card links, and global notes to reflect automatic xAI logging + the new test capability.
- Updated crm.ts: providersList now uses stable `key` (for enum matching and log grouping) + `label` (for display); ProviderStatus and the overview mapper adjusted; no-DB fallback kept in sync. The page continues to work with provider.name as the human label.
- All changes extend existing patterns (grok client, IntegrationLog model + recentGlobalLogs surface, form posting + revalidate, InternalShell). Zero duplication of DAT/Truckstop adapters or the marketplace transaction logging. No customer-facing surfaces.
- Full validation (lint clean, tsc --noEmit, prisma:generate after schema, npm run build including new test route) + commit + push + roadmap update.
- Followed all Multi-Agent Handoff Rules exactly.

Completion criteria progress:
- Admins can now see real-time xAI (Grok) health via automatic logs from every agent invocation and document extraction, plus on-demand "Test health" pings that appear instantly in the activity feed.
- The /integrations page (core deliverable of Phase 6) is now meaningfully populated for the AI provider that powers the Command Center.
- "Integration failures are visible without checking server logs" is true for xAI in addition to DAT/Truckstop.
- 6.2 directly delivers on the roadmap's call for "expanded logging (Twilio/Resend/xAI/FMCSA calls)" and "safe retry/test actions".

Build (Phase 6.3 completed):

- Instrumented inbound/webhook receivers using the central logIntegration helper (WEBHOOK_RECEIVED action, provider TWILIO/RESEND):
  - Resend /webhook: logs email events (delivered, bounced, etc.) with externalEventId and type after Activity creation.
  - Twilio voice/incoming: logs inbound call webhooks (with fromPhone, callSid) after BrokerageCall + Activity.
  - Twilio voice/outbound/status: logs call status/delivery callbacks.
  - Twilio voice/transcription: logs transcription received (or failed) for inbound call intelligence.
- These logs now automatically appear in the /integrations recent cross-provider activity table and in the per-provider "Recent activity" lists for Twilio and Resend cards (last success/failure will reflect webhook health).
- Updated page text (health summary box and global logs note) to document that Twilio/Resend inbound (calls, transcripts, email events) are now logged.
- Reuses existing DB work, revalidates, and the enum/helper from 6.2. No changes to Activity model or call/email business logic (no duplication). No new UI beyond the automatic visibility in existing tables.
- Full validation + commit + push + roadmap update.
- Followed all handoff rules.

Completion criteria progress:
- Twilio and Resend webhook/voice instrumentation (inbound replies, delivery callbacks) complete.
- Inbound events from these providers are now visible in the central Integrations admin page without checking server logs.
- The /integrations page now shows meaningful recent activity for communication providers when webhooks fire (e.g. customer calls or email deliveries).

Build (Phase 6.4 completed):

- Added safe retry support to /api/integrations/test for DAT/TRUCKSTOP marketplace: accepts loadId + action ("retry-capacity" or "retry-post"), calls the existing searchAndStoreMarketplaceCapacity or postLoadToMarketplaces (which auto-create fresh IntegrationLog entries via the workflow).
- Added "Retry capacity" and "Retry post" forms (with loadId input) directly on the DAT and TRUCKSTOP provider cards in /integrations page. Retries are explicit, user-triggered, and surface new logs in the recent activity table.
- Instrumented FMCSA lookups: added logIntegration calls (provider "FMCSA", action "CARRIER_RESPONSE_SYNC") in the two main call sites in src/lib/agent-enrichment.ts (enrichCarrierCoverage and enrichCarrierCompliance paths). Uses the result's found/error fields to set status.
- Minor page updates: health summary and global notes now reference retry capability and FMCSA logging.
- Reuses logIntegration (from 6.2), marketplace-workflow functions (no duplication of posting logic), existing form posting + revalidate pattern, and the /integrations card structure. Safe (no auto-retries, explicit loadId required). Starts delivering on "FMCSA logging" and "safe retry buttons for failed marketplace posts".
- Full validation (lint clean, tsc, prisma:generate, build) + commit + push + this roadmap update.
- Followed all handoff rules.

Completion criteria progress:
- Safe retry buttons for failed marketplace posts (DAT/TRUCKSTOP capacity and load post) are now available on the admin Integrations page.
- FMCSA activity is now logged when agents/enrichment run carrier lookups (visible in /integrations logs).
- The page has deeper per-provider actions (test + retry) for the marketplace providers.

Build (Phase 6.5 completed):

- Extended /api/integrations/test to support real pings for HERE (getTruckMileage sample route) and EIA (getEiaDieselPrice). Results logged as HEALTH_CHECK with details (miles/price, cached, errors).
- Instrumented HERE and EIA usages in src/lib/agent-enrichment.ts (enrichQuotePricing for mileage+diesel, load tracking for HERE, diesel-only path) with logIntegration calls (provider HERE/EIA, action HEALTH_CHECK, status derived from result.error/configured/found, message with value).
- Updated /integrations page description and aside notes to document real Test health pings for HERE/EIA and logging coverage for all listed providers.
- Reuses logIntegration, the external here/eia libs, enrichment patterns (no duplication). Makes "Test health" actionable for routing/fuel providers and completes logging for FMCSA/HERE/EIA.
- Full validation (lint, tsc --noEmit, prisma:generate, build) + commit + push + roadmap update.
- Followed all handoff rules.

Completion criteria progress:
- Full FMCSA/HERE/EIA logging complete (via enrichment paths and test pings).
- Deeper per-provider actions on /integrations (real pings now for HERE/EIA; retries for marketplace).
- "Integration failures are visible" expanded to routing and fuel benchmark providers.

Build (Phase 6.6 completed):

- Enhanced ProviderStatus type and getIntegrationsOverview (src/lib/crm.ts) to compute/expose per-provider recentCount, successCount, failureCount (from the fetched logs) for deeper visibility without extra queries.
- Updated /integrations page cards with explicit "Activity summary" counts right after success/failure, and greatly expanded the actions section with tailored quick links per provider (e.g. FMCSA -> /carriers, Twilio/Resend -> /communications, XAI -> /agents, HERE/EIA -> quote-requests/loads for their usage in pricing/routing, plus retained Loads + conditional Test/Retry forms).
- Added prominent note on DAT/TRUCKSTOP cards: "Payload mapping details pending account documentation."
- Updated the health summary box and global logs aside to document the deeper per-provider dashboards (counts + provider-specific quick links/actions/summaries for all 9 providers).
- All using existing InternalShell, Link, form patterns, log data, and provider keys -- no duplication, no new routes/models, no breaking changes.
- Full validation (lint, tsc --noEmit, prisma:generate, build) + commit + push + roadmap update.
- Followed all handoff rules exactly.

Completion criteria progress:
- Deeper per-provider dashboards now live on the Integrations admin page (activity counts + tailored quick links to operational surfaces like loads, carriers, comms, AI, pricing).
- DAT/Truckstop payload mapping details explicitly noted as pending (per original roadmap caveat).
- Provides a more "dashboard-like" monitoring experience for admins across all integrations.

DAT/Truckstop final payload mappings and any ultra-final surfaces remain for when account docs are available or future phases. Phase 6 core (admin visibility, logging, test/retry actions, deeper dashboards) is now complete. 

- Phase 7.1 completed: Customer portal account model + basic login. Added portalEnabled + CustomerAccount model, toggle in internal UI, customer login API/page, /portal home. Reused public tracking. Validation + push passed. Followed rules.
- Phase 7.2 completed: Customer quote request/view in portal. Added scoped getCustomerQuoteRequestViews, /api/portal/quote-requests create, list + submit form in /portal. Scoped to shipper. Validation + push passed. Followed rules.
- Phase 7.3 completed: Active loads, tracking, documents in customer portal. Populated sections in /portal using getShipperDetailView for customer's loads/docs with status, links, public track. Scoped. Validation + push passed. Followed rules.
- Phase 7.4 completed: Saved preferences, fuller invoices, basic load details in customer portal. Added preferences section with lanes/contacts forms, expanded invoices list, enhanced loads display. Reused forms and views. Validation + push passed. Followed rules.
- Phase 8.1 completed: Carrier portal foundation + document submission. Carrier login (email to contact/additional), /carrier-portal with loads list + upload form for POD/BOL/invoices/W9 etc (flows to Document Center via existing logic). Symmetric to customer portal. Validation + push passed. Followed rules.
- Phase 8.2 completed: Carrier tenders accept/decline, check-calls, payments in portal. Added tenders list with Accept (reuse route) / Decline (new route), check-call form (reuse), payments list. Scoped. Validation + push passed. Followed rules.

## Phase 7: Customer Portal (next)

## Phase 7: Customer Portal

Goal: give shippers a professional self-service experience.

Status: 7.1 complete (foundation); remaining quote viewing/approval, full load/tracking/docs/invoice views, saved preferences, etc. in 7.2+.

Build (Phase 7.1 completed):

- Added portalEnabled flag to Shipper model + new CustomerAccount model (email accounts linked to shipper) via explicit migration.
- Updated shipper edit form/API/validation/detail views to allow internal users to enable/disable portal access for a shipper.
- Added basic customer auth cookie support and /api/customer-login (matches email to CustomerAccount or Contact on portalEnabled shipper; sets session).
- New /customer-login page (public-facing email form).
- New /portal page (customer self-service landing with links to their quotes, loads, tracking, documents; falls back gracefully if not logged in or access disabled). Reuses public tracking foundation from Phase 5.3.
- Internal control: shipper toggle enables customer login. Scoped to shipper records (data filtering in later sub-phases).
- No duplication of internal auth or public track logic. Extends existing forms, prisma queries, cookie patterns.
- Full validation + commit + push + roadmap update.
- Followed all handoff rules.

Completion criteria progress:
- Customer portal account model exists.
- Internal users can control portal access per shipper.
- Basic customer login + portal home page live (reduces need for broker to manually share status/docs via email).

Build (Phase 7.2 completed):

- Added getCustomerQuoteRequestViews(shipperId) in crm.ts for scoped customer quote list.
- New /api/portal/quote-requests POST: creates QuoteRequest for the logged-in customer's shipper (from cookie), basic fields (origin/dest/equip).
- Updated /portal page: replaced placeholder with "Your Quotes & Requests" section showing list of their recent quote requests (status, lane, equip) + inline form to submit new request.
- Reuses QuoteRequest model, existing map, revalidates, customer session from 7.1. Customers only see/act on their shipper's data.
- Full validation + commit + push + roadmap update.
- Followed rules.

Completion criteria progress:
- Customers can request quotes via portal.
- View their quote requests/history (scoped list).
- (Approve/reject for quoted ones and full load views in 7.3+)

Build (Phase 7.3 completed):

- Enhanced /portal with real "Active Loads & Tracking" section: list of customer's active loads (status, lane, carrier, public tracking links if generated from Phase 5.3).
- "Documents & Invoices" populated with recent documents list + download links (invoices referenced via loads).
- Used getShipperDetailView(shipperId from customer cookie) for scoping; reuses LoadView, Document types, public track.
- Customers see only their shipper's data. Placeholders replaced with functional scoped views.
- Full validation + commit + push + roadmap update.
- Followed rules.

Completion criteria progress:
- Customers can view active loads, tracking (via public links), documents, invoices (basic) in portal.
- Data scoped to their account.

Build (Phase 7.4 completed):

- Added "Your Saved Preferences" section to /portal: displays current lanes and contacts from shipper detail, reuses ShipperLanesForm and ShipperContactCreateForm (with shipperId from customer session) for updates.
- Expanded "Documents & Invoices" with separate "Recent Invoices" list (fetched for the shipper via prisma, showing load ref, amount, status).
- Enhanced loads list display with additional details (lane, status, carrier, pickup, public track links).
- Reuses existing shipper preference forms, getShipperDetailView, prisma for invoices, customer scoping. Customers can manage basic preferences and see fuller financial/operational data.
- Full validation + commit + push + roadmap update.
- Followed rules.

Completion criteria progress:
- Customers can manage saved preferences (lanes, contacts) in portal.
- View fuller invoices and load details.
- Continues to reduce routine interactions with broker.

Next for Phase 7: 7.5+ for deeper auth (Clerk customer support), full load details/POD views, other preferences. Phase 7 core (accounts, quotes, loads/docs/invoices, preferences) now substantially complete. 

## Phase 8: Carrier Portal (next)

Build:

- Add customer login/portal account model.
- Let customers request quotes, view quotes, approve/reject quotes, and view
  quote history.
- Let customers view active loads, tracking, documents, invoices, and shipment
  history.
- Add saved addresses, contacts, facilities, lanes, and preferences.
- Add customer-facing tracking links before exposing full portal login if useful.

Completion criteria:

- Customers can see their own records only.
- Internal users can control which customers have portal access.
- The portal reduces routine calls/emails for status, PODs, and invoices.

## Phase 8: Carrier Portal

Goal: reduce manual carrier paperwork, updates, and document chasing.

Status: 8.1 complete (foundation + documents); remaining tender accept/decline, check-calls, payment views in 8.2+.

Build:

- Let carriers submit onboarding documents.
- Let carriers accept or decline tender/rate confirmation.
- Let carriers upload POD/BOL/invoices.
- Let carriers send tracking/check-call updates.
- Let carriers view payment status for their loads.

Completion criteria:

- Carrier paperwork and POD collection no longer require only internal manual
  entry.
- Uploaded carrier documents flow into the existing Document Center.

Build (Phase 8.1 completed):

- Added carrierAuthCookie helper.
- New /api/carrier-login (email match to carrier.email or additionalContacts JSON array, sets carrier cookie with id).
- New /carrier-login page + form (email-based login, styled like customer portal).
- New /carrier-portal page: shows recent loads for the carrier, recent documents, form to upload POD/BOL/INVOICE/W9/COI/agreement (with optional load link for PODs). Uploads create Document records linked to carrier (and load), using existing buildDocumentCreateData, source MANUAL_UPLOAD, appear in central Document Center.
- New /api/carrier-portal/documents for handling carrier uploads (reuses document creation logic, scoped by carrier cookie).
- Reuses Carrier model (email, additionalContacts, documents, loads), Document model/flows, cookie pattern from customer 7.1, no new models. Carriers get self-service for docs without internal manual entry.
- Full validation + commit + push + roadmap update.
- Followed all handoff rules.

Completion criteria progress:
- Carriers can submit (onboarding and operational) documents via portal; they flow to Document Center.
- Basic carrier portal foundation and login live (symmetric to customer).

Build (Phase 8.2 completed):

- Enhanced /carrier-portal with "Your Tenders / Quotes" section: lists pending CarrierQuotes (REQUESTED/RECEIVED) with load info, quoted rate, Accept (reuses existing /api/loads/[id]/carrier-quotes/[quoteId]/accept route with compliance gate), Decline (new scoped /api/carrier-portal/tenders/[id]/decline that sets status REJECTED).
- Added "Send Check-Call / Tracking Update" using existing ShipmentEventCreateForm for one of the carrier's loads (creates event, appears in load history/tracking).
- Added "My Payments" section: lists recent CarrierInvoices for the carrier's loads (amount, status, paid date, load ref).
- Reuses CarrierQuote, ShipmentEvent, CarrierInvoice models and forms/APIs, carrier cookie scoping from 8.1, existing revalidate patterns. No duplication of internal tender/payment logic.
- Updated loads list note and UI to reflect new self-service actions.
- Full validation + commit + push + roadmap update.
- Followed all handoff rules.

Completion criteria progress:
- Carriers can accept/decline their tenders directly.
- Send check-call updates.
- View payment status for their loads.
- All without broker manual intervention for these workflows.

Next for Phase 8: 8.3+ for any remaining (e.g. deeper tender details, payment disputes). Phase 8 core (docs, tenders, updates, payments) now complete.

## Phase 9: Lane Intelligence And Revenue Growth

Goal: help salespeople quote better and build repeat lanes.

Status: not started.

Build:

- Add lane profile records or structured lane history derived from quotes/loads.
- Show customer lane history, carrier lane history, margin history, win/loss,
  seasonality, and quote confidence.
- Add saved quote templates for recurring lanes.
- Add target margin rules by customer, lane, equipment, and urgency.
- Add sales opportunity insights: dormant shippers, repeat-lane opportunities,
  underpriced lanes, and customers needing follow-up.

Completion criteria:

- Sales can price repeat freight faster using internal history and DAT/Truckstop
  benchmarks.
- Management can see which lanes/customers are profitable.

## Phase 10: AI Automation Expansion

Goal: automate repetitive work only after the data and workflows are stable.

Status: not started.

Build:

- Add scheduled Daily Brief Agent delivery.
- Add autonomous document extraction jobs with human review for exceptions.
- Add AI draft suggestions inside communications composer.
- Add AI carrier shortlist generation based on compliance, lane history, and
  pricing.
- Add AI tracking exception triage.
- Add AI billing exception triage.
- Add prompt version history and agent output audit views.
- Add clear approval gates for any AI action that contacts customers/carriers,
  posts loads, books carriers, changes money, or changes compliance status.

Completion criteria:

- AI saves salesperson and operator time without hiding decisions.
- Every autonomous action is logged, reversible where practical, and visible in
  `AiAgentRun` or related audit records.

## Phase 11: Permissions, Audit Logs, And Admin Controls

Goal: protect sensitive workflows as real users operate the system.

Status: not started.

Build:

- Add owner/admin user management.
- Add invitations for internal users.
- Add per-route and per-action permissions.
- Add audit logs for settings, pricing overrides, compliance decisions, invoice
  changes, carrier payments, and AI approvals.
- Add Clerk webhook user sync.

Completion criteria:

- Owners can manage users and roles without database access.
- Sensitive changes are attributable and reviewable.

## Phase 12: Final QA, Test Pass, And Launch Hardening

Goal: stabilize the finished product after all major functionality exists.

Status: not started.

Build:

- Create a full manual test script for each workflow.
- Add automated tests around high-risk APIs where practical.
- Test Render deployment after each major phase.
- Verify real environment variables and webhook URLs.
- Fix all bugs found during workflow testing.
- Remove stale sample copy where production data should appear.
- Confirm no former-employer terminology exists anywhere.

Completion criteria:

- Every page and workflow has been tested with real or realistic records.
- Production build, typecheck, and lint pass.
- Render deploy is stable.

## Current Known Technical Debt

- `npm run lint` currently fails on existing explicit `any` usage in carrier
  invoice APIs and CRM helpers, plus a few unused imports/variables.
- Document storage + extraction foundation complete (Phase 1 + 2.1). Full OCR
  provider integration, structured BOL/POD/invoice parsing, and autonomous
  extraction jobs remain for later phases.
- DAT/Truckstop adapters exist, but final account-specific provider mappings are
  still required.
- Background workers/queues are not yet implemented.
