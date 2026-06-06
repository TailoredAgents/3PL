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
- 5.3: Public tracking links.
- 5.4: Provider adapters.
- 5.5: Agent workflows.

Completion criteria progress:
- Exceptions now have persistent ownership and resolution states.
- Visible/assignable in tracking workspace and per-load.
- Operators can manage active loads + exceptions in one place.

Next: 5.3 for public foundation when ready.

## Phase 6: Integration Admin And Monitoring

Goal: make external provider connectivity manageable from inside the app.

Status: not started.

Build:

- Add Integrations page or expand Settings with provider-specific panels.
- Show credential presence, webhook status, last successful sync, last failure,
  and test actions.
- Add integration logs by provider/action/entity.
- Add retry actions for failed integrations where safe.
- Add DAT and Truckstop final payload mappings once account documentation is
  available.
- Add SMS delivery callbacks and inbound SMS reply handling.
- Add inbound email reply tracking.

Completion criteria:

- Admins can tell whether DAT, Truckstop, Twilio, Resend, xAI, FMCSA, HERE,
  EIA, and carrier vetting providers are configured and healthy.
- Integration failures are visible without checking server logs.

## Phase 7: Customer Portal

Goal: give shippers a professional self-service experience.

Status: not started.

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

Status: not started.

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
