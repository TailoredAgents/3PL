# Local QA Test Plan

Use this script for Phase 12 local validation. The goal is to test the system
the way the team will actually use it: create realistic records, move them
through the brokerage workflow, and capture bugs before relying on live
production usage.

This plan is local-first. Render, Twilio, Resend, Clerk, DAT, Truckstop, OCR,
storage, and payment provider dashboards are marked as external verification
items when they cannot be fully proven from a local run.

## 1. Local Validation Commands

Run these before starting workflow testing and after every bug fix:

```bash
git pull --ff-only
git status --short --branch
npm run prisma:generate
npm run lint
npx tsc --noEmit --incremental false
npm run build
git diff --check
```

If a command fails, stop and fix the failure before continuing the manual pass.

## 2. Local Setup

Minimum local configuration:

- `.env` exists and was copied from `.env.example`.
- `DATABASE_URL` points at a local or test Postgres database.
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
- Clerk keys may be omitted for password-gate testing.
- `INTERNAL_APP_PASSWORD` is set if Clerk keys are omitted.
- `XAI_API_KEY` may be omitted for fallback testing, then added for real agent
  testing.

Start local development:

```bash
npm run dev
```

Open `http://localhost:3000` and sign in through `/login`.

### Local QA Database

For record-based QA on Austin's local machine, use the dedicated local Postgres
database instead of Render:

```bash
createdb -h localhost dao_logistics_qa
```

Create a local ignored `.env`:

```txt
DATABASE_URL=postgresql://richardaustindugger@localhost:5432/dao_logistics_qa?schema=public
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_APP_PASSWORD=qa-phase-12
INTERNAL_AUTH_COOKIE=dao_logistics_internal
XAI_MODEL=grok-4.3
```

Apply migrations and seed realistic QA records:

```bash
npm run prisma:deploy
npm run qa:seed
```

Seeded records include:

- Users: Austin, Conner, Devon, and Michael.
- Commission plan: manager 35%, lifetime client owner 15%, Austin 20%,
  company 30%.
- Customer account: `jordan.reed@qa-apex.example`.
- Carrier portal account: `dispatch@qa-reliable.example`.
- Password-gate login: `qa-phase-12`.
- Primary quote: `qa-quote-atl-nash`.
- Active load: `qa-load-active`.
- Completed paid load: `qa-load-completed`.

The seed is idempotent; rerun `npm run qa:seed` whenever the local QA records
need to be restored.

## 3. Test Data To Create

Create realistic records instead of relying only on sample fallback data:

- One new shipper company with two contacts.
- One existing shipper with a lifetime client owner assigned.
- One converted customer lead.
- Two quote requests, one simple and one with accessorials.
- Two carriers, one compliant and one intentionally blocked.
- One active load with a compliant carrier.
- One active load with tracking risk.
- One completed load with POD, invoice, and carrier payable records.

Use obvious names such as `QA Shipper A`, `QA Carrier Approved`, and
`QA Carrier Blocked` so cleanup is easy.

## 4. Authentication And Roles

Pass when:

- Public pages load without internal access.
- Internal pages redirect to `/login` when not authenticated.
- Password fallback works when Clerk is not configured.
- Clerk login works when Clerk keys are configured.
- Owner/admin users can access Admin Controls, Settings, and Integrations.
- Sales/ops users cannot access owner/admin-only pages when Clerk is active.
- API writes return an access error when unauthenticated.

Bug checks:

- No internal page flashes sensitive data before redirect.
- Role-restricted nav items stay hidden for non-admin users.

## 5. Communications And CRM

Test:

- Create a lead.
- Add a lead activity.
- Move the lead through stages.
- Create a shipper and contacts.
- Import contacts from CSV.
- Use Communications to review calls, emails, SMS paths, notes, and follow-up
  context.
- Confirm the conversation-notes agent is treated as autonomous system context,
  while quote and sales follow-up agents are run intentionally.

Pass when:

- Lead, shipper, contact, and activity records persist.
- Communications shows recent customer context without duplicate pages or
  duplicate workflows.
- Follow-up state is visible from lead, shipper, dashboard, and communications
  surfaces.

## 6. Quote And Pricing Workflow

Test:

- Create a quote request from the internal form.
- Create a quote request from the customer portal.
- Enter lane, equipment, weight, pickup/delivery windows, accessorials,
  appointment requirements, and pricing notes.
- Add DAT and Truckstop benchmark placeholders/manual rate entries when real
  provider credentials are not available.
- Run the quote/pricing agent if `XAI_API_KEY` is configured.
- Send or preview the quote email.
- Convert an accepted quote to a load.

Pass when:

- Sales can edit details before pulling an estimated customer price.
- Recommended sell price is traceable to buy-rate inputs, target margin, and
  risk notes.
- DAT/Truckstop missing credentials are shown as unavailable, not as fake live
  rates.
- Quote conversion preserves customer, lane, equipment, price, notes, and
  attribution.

External verification:

- Real DAT rate payload mapping.
- Real Truckstop rate payload mapping.
- Real quote-email delivery through Resend.

## 7. Load Board And Operations

Test:

- Open the Load Board with multiple loads.
- Filter by status, equipment, tracking risk, coverage state, billing state,
  margin, and search text.
- Sort or scan dense rows without opening every load.
- Open a load detail.
- Update load status.
- Assign the load manager.
- Confirm lifetime client owner attribution copied from the shipper when
  expected.
- Post or prepare a marketplace posting.

Pass when:

- Active loads are manageable from the board.
- Key operational fields are visible at row level.
- Load detail remains the source of truth for deep work.
- No duplicate "loads" workflow exists outside the board/detail model.

External verification:

- Real DAT load posting.
- Real Truckstop load posting.

## 8. Carrier Compliance And Booking

Test:

- Create an approved carrier.
- Create a blocked or non-approved carrier.
- Upload W-9/COI/authority documents.
- Edit compliance status, insurance expiration, callback verification, fraud
  notes, and blocked reason.
- Attempt to book a load with the blocked carrier.
- Book a load with the approved carrier.
- Review carrier scorecard and related loads.

Pass when:

- Blocked/non-approved carriers cannot be booked.
- The UI explains why a carrier is blocked.
- Compliance changes write audit history.
- Required carrier documents are visible in the document center and carrier
  profile.

External verification:

- FMCSA lookup.
- Carrier 411 or comparable vetting adapter.
- CarrierOk or other fraud/compliance provider.

## 9. Tracking And Visibility

Test:

- Open Tracking.
- Confirm active loads show pickup risk, delivery risk, stale update risk,
  missing POD risk, and customer update due state.
- Log check calls or shipment events.
- Assign and resolve internal exceptions.
- Use customer update tools where available.
- Open a public tracking link if a tokenized view exists.

Pass when:

- Operations can manage active tracking from one workspace.
- Exceptions have an owner, state, and resolution path.
- Load detail timeline reflects tracking actions.

External verification:

- GPS/ELD/mobile tracking integration.
- Automated customer update delivery.

## 10. Documents And Automation

Test:

- Upload a BOL, POD, rate confirmation, carrier invoice, audit document, and
  shipper/carrier document.
- Confirm file metadata and download links work.
- Run extraction on text or image files.
- Review and save extracted text/fields.
- Confirm reviewed document data does not automatically overwrite operational
  records without a human approval path.
- Use the document automation queue.

Pass when:

- Documents are linked to the right record.
- Download routes work.
- Extraction status and reviewed fields are visible.
- Failed extraction is explainable and retryable.

External verification:

- Durable S3/R2 storage credentials.
- PDF OCR/provider path.

## 11. Billing, Payables, And Commissions

Test:

- Create a customer invoice.
- Send or preview invoice communication.
- Mark customer invoice states through normal flow.
- Create a carrier invoice.
- Try to mark a carrier invoice paid before approval.
- Approve a carrier invoice.
- Stage approved invoices into a payment batch.
- Mark paid as owner/admin.
- Review commission forecast and payout-ready values.

Pass when:

- Carrier payables cannot be paid before approval.
- Owner/admin payment restrictions work when Clerk is active.
- Audit history records invoice, approval, payment, and attribution changes.
- Commission split logic is visible:
  - Load manager: 35%.
  - Lifetime client converter: 15%.
  - Austin: 20%.
  - Company: 30%.
- Payout-ready commission requires customer payment and carrier settlement.

External verification:

- QuickBooks or accounting export.
- Stripe or payment processor if online payment is added.

## 12. AI Command Center And Agents

Test:

- Run quote/pricing agent.
- Run sales follow-up agent.
- Run carrier coverage agent.
- Run tracking/customer update agent.
- Run billing readiness or document automation agent.
- Review approval queue.
- Approve, reject, and retry agent output.
- Edit prompt templates in Settings/Admin surfaces where applicable.
- Review daily brief.

Pass when:

- Human approval gates are visible for customer-facing or financial actions.
- Agent logs include inputs, outputs, confidence, status, and next action.
- Failed agent runs are retryable.
- Autonomous agents do not require a manual "Run agent" button where they are
  intended to work continuously from system events.

External verification:

- Real Grok/xAI key and model.
- Background worker or queue for scheduled autonomous runs.

## 13. Customer Portal

Test:

- Customer signs in through the intended route.
- Customer submits a quote request.
- Customer sees recent quote/load context intended for them.
- Customer cannot see other shippers' records.
- Portal actions create internal CRM/TMS records.

Pass when:

- Portal data is scoped to the authenticated customer.
- Internal team can continue the same record from Communications, Quotes, and
  Load Board.

## 14. Carrier Portal

Test:

- Carrier signs in through the intended route.
- Carrier sees assigned loads only.
- Carrier submits location/check-call updates.
- Carrier uploads POD or supporting documents.
- Updates appear on internal tracking/load detail views.

Pass when:

- Carrier data is scoped to the authenticated carrier.
- Carrier updates are visible to operations without re-entry.

## 15. Admin, Integrations, And Audit

Test:

- Admin creates/edits users.
- Admin sends or refreshes Clerk invitations when configured.
- Admin reviews audit logs and before/after JSON.
- Admin views integration health.
- Integration test actions log success/failure.
- Settings update call recording disclosure copy.
- Settings update quote email and agent prompt templates.

Pass when:

- Sensitive changes are attributable.
- Integration failures are visible and do not fail silently.
- Settings changes persist and are auditable where expected.

External verification:

- Clerk invitation email delivery.
- Clerk webhook dashboard.
- Twilio phone, SMS, recording, transcription, and callbacks.
- Resend email delivery and webhooks.
- DAT/Truckstop credentials and account-specific scopes.
- HERE, EIA, FMCSA, and carrier compliance provider credentials.

## 16. Search, Analytics, And Dashboard

Test:

- Dashboard metrics load from real records.
- Search finds loads, leads, shippers, carriers, and contacts.
- Analytics reflects lane, shipper, carrier, margin, and volume data.
- No page depends on sample fallback once a real database is configured and
  populated.

Pass when:

- Metrics are plausible and traceable to records.
- Empty states are clear when there is no data.
- Sample fallback is not confused with production data.

## 17. Negative And Security Tests

Test:

- Submit invalid API payloads.
- Attempt unauthorized API writes.
- Attempt cross-customer portal access.
- Attempt cross-carrier portal access.
- Attempt carrier booking with blocked carrier.
- Attempt payable payment before approval.
- Attempt owner/admin actions as sales/ops.
- Upload unsupported file type or oversized document.
- Run provider actions without credentials.

Pass when:

- Errors are clear and safe.
- No sensitive stack traces are shown to users.
- Business rules are enforced on the server, not only in the UI.

## 18. Branding And Production Copy Audit

Search before launch:

```bash
rg -n "Atlanta Freight|former[ -]employer|lorem|dum[m]y" README.md docs src prisma --glob '!docs/local-qa-test-plan.md'
rg -n "atlanta[_]freight" README.md docs src prisma .env.example --glob '!docs/local-qa-test-plan.md'
```

Pass when:

- No legacy product-name or prior-company wording appears in user-facing UI,
  prompts, seed data, docs intended for operators, or runtime defaults.
- Atlanta remains only where it is a real market, lane, address, or sample city.
- Sample fallback data is clearly labeled as sample when it appears.

Infrastructure note:

- Existing Render resource names may contain historical names. Rename those only
  as a planned infrastructure migration so the live service/database are not
  accidentally recreated.

## 19. Bug Capture Template

Use this format for every issue found:

```txt
Title:
Workflow:
URL:
Role:
Record ID:
Steps to reproduce:
Expected:
Actual:
Screenshot/video:
Severity: blocker | high | medium | low
Owner:
Fixed in commit:
Retest result:
```

## 20. Phase 12 Exit Criteria

Phase 12 is complete when:

- Local lint, typecheck, build, Prisma generation, and diff checks pass.
- Every workflow above has been tested with realistic records.
- Blocker and high-severity bugs are fixed.
- Medium bugs are fixed or intentionally scheduled.
- External verification items are either tested with real credentials or tracked
  as explicit post-credential tasks.
- The roadmap reflects what passed, what was deferred, and why.
