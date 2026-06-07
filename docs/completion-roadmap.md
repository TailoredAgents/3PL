# Completion Roadmap

This is the next roadmap after the main feature-build roadmap. The feature
system is treated as functionally complete. The remaining work is to polish the
product page by page, then close the production gaps that separate an internal
working OS from a finished brokerage platform.

Do this in order. Do not start the gap/integration work until the page-by-page
aesthetics and usability pass is complete.

## Phase 0: Page-By-Page Aesthetics And UX Pass

Goal: make the existing system feel clean, consistent, efficient, and ready for
daily sales/ops use before adding more capability.

Scope:

- Public site
- Login/internal auth screens
- Dashboard
- Search
- Communications
- Leads
- Shippers
- Contacts
- Quotes & Pricing
- Load Board
- Load detail
- Tracking
- Carriers
- Carrier detail
- Documents
- Billing
- Payables
- Analytics
- AI Command Center
- Integrations
- Admin Controls
- Settings
- Customer portal
- Carrier portal
- Public tracking page

Pass criteria:

- Navigation labels are consistent with brokerage language.
- Page hierarchy is clear at a glance.
- Important actions are visible without hunting.
- Dense operational pages are scannable.
- Buttons, forms, tables, cards, filters, badges, and empty states use
  consistent styling.
- Mobile layouts do not overlap or hide important actions.
- No text overflows its container.
- No page has obvious stale sample/product copy where production language should
  appear.
- CRM/TMS screens feel operational, not like marketing pages.
- Repeated UI patterns are reused instead of duplicated.

Recommended page order:

1. Dashboard and global navigation.
2. Communications.
3. Quotes & Pricing.
4. Load Board and load detail.
5. Tracking.
6. Carriers and carrier detail.
7. Documents.
8. Billing and Payables.
9. Admin, Settings, Integrations, AI Command Center.
10. Customer portal, Carrier portal, public tracking.
11. Public site.

Notes:

- This phase should mostly be frontend/UI work.
- Avoid schema changes unless a page cannot be made coherent without one.
- Do not add new major business features in this phase.
- Capture functionality bugs for later unless they block the page pass.

## Phase 1: DAT And Truckstop Live Workflow Completion

Goal: make pricing, capacity, and posting work with real DAT/Truckstop accounts.

Build:

- Final DAT rate payload mapping.
- Final Truckstop rate payload mapping.
- DAT capacity search payload mapping.
- Truckstop capacity search payload mapping.
- DAT load posting payload mapping.
- Truckstop load posting payload mapping.
- Clear labels separating live provider rates from manual benchmarks.
- Integration failure messages that are useful to sales/ops users.
- Logs for each request/response outcome.
- Retry behavior from Integrations and load/quote pages.

Completion criteria:

- A salesperson can price a quote using real DAT/Truckstop data.
- An operations user can search capacity for a load.
- A load can be posted to the configured marketplaces.
- Failures are visible and do not silently create fake rates.

## Phase 2: Carrier Vetting Provider Integration

Goal: connect carrier approval to a real compliance/fraud source before the team
trusts automated booking decisions.

Build:

- Choose the provider path: Carrier 411, SaferWatch, RMIS,
  MyCarrierPackets, CarrierOk, or comparable.
- Pull authority, insurance, safety, fraud/watchlist, and risk details.
- Store provider snapshots on the carrier record.
- Add expiration and high-risk alerts.
- Keep callback verification and human notes visible.
- Preserve the server-side blocked-carrier booking gate.

Completion criteria:

- A carrier can be vetted from its profile.
- The result explains whether the carrier is approved, pending, rejected, or
  blocked.
- Risky carriers cannot be booked.

## Phase 3: PDF OCR And Document Intelligence

Goal: make freight paperwork readable and useful without manual re-entry.

Build:

- Choose and wire the final PDF OCR/provider path.
- Parse BOLs, PODs, rate confirmations, and carrier invoices.
- Compare POD/BOL/invoice fields to load fields.
- Flag mismatches in document review.
- Keep human review before downstream record updates.
- Improve failed extraction retry and error display.

Completion criteria:

- Uploaded PDFs can produce extracted text and structured fields.
- Users can review and approve extracted fields.
- Billing/document readiness can use reviewed paperwork.

## Phase 4: Production Communications Automation

Goal: make customer and carrier communication reliable enough for daily use.

Build:

- Quote email send and delivery verification.
- Email bounce/complaint handling.
- SMS delivery status callbacks.
- Customer update message workflow.
- Carrier check-call reminder workflow.
- Sales follow-up sequences or reminders.
- Communication activity logging on the right shipper/contact/load.

Completion criteria:

- Sales can send quote/follow-up messages from the system.
- Operations can send or queue customer tracking updates.
- Delivery failures are visible in Communications and Integrations.

## Phase 5: Background Jobs And Automation Worker

Goal: allow AI and operational checks to run on schedules or events instead of
only manual button clicks.

Build:

- Background worker or queue.
- Daily brief scheduled run.
- Document extraction jobs.
- Stale tracking checks.
- Customer update due checks.
- Follow-up reminders.
- Failed integration retry jobs.
- Autonomous conversation notes/context updates.

Completion criteria:

- Scheduled work runs without a user sitting on a page.
- Agent/integration results are logged.
- Risky actions still require the correct approval gate.

## Phase 6: Portal Auth Hardening

Goal: make external customer/carrier access safe enough for production users.

Build:

- Magic-link or stronger external auth.
- Customer portal scoping tests.
- Carrier portal scoping tests.
- Expiring portal sessions.
- Portal audit logs.
- Document download permission checks.
- Better external-user empty/error states.

Completion criteria:

- Customers cannot see other customer data.
- Carriers cannot see other carrier data.
- Portal access is auditable and revocable.

## Phase 7: Accounting Export Or QuickBooks Sync

Goal: reduce back-office re-entry and prevent accounting/payment mistakes.

Build:

- Decide QuickBooks/Xero/export-first direction.
- Customer invoice export/sync.
- Carrier payable export/sync.
- Payment batch export.
- Invoice aging view.
- Collections/reminder workflow.
- Duplicate payment protection.

Completion criteria:

- Finance can move invoice/payable data into the accounting process without
  re-keying every load.
- Paid/approved/batched status stays explainable.

## Phase 8: Tracking Automation And Escalation

Goal: make active load monitoring more proactive.

Build:

- Automatic customer update reminders.
- Carrier check-call reminders.
- Exception escalation rules.
- Optional GPS/ELD/mobile tracking integration.
- Public tracking page polish.
- Tracking message templates.

Completion criteria:

- Operations can manage exceptions from the Tracking workspace.
- Customers get proactive updates before they ask for them.
- Stale loads are visible and assigned.

## Phase 9: Claims And Disputes Workflow

Goal: handle damaged, short, late, disputed, or claim-sensitive loads cleanly.

Build:

- Claim/dispute record.
- Claim owner and status.
- Linked documents and photos.
- Customer/carrier notes.
- Financial reserve/impact.
- Resolution outcome.
- Audit history.

Completion criteria:

- A problem load can be tracked from exception to resolution.
- Finance can see whether the claim affects invoice or payable status.

## Phase 10: Automated Tests For High-Risk Workflows

Goal: protect money, compliance, and data access rules from regressions.

Test targets:

- Blocked carrier cannot be booked.
- Carrier payable cannot be paid before approval.
- Customer portal data is scoped.
- Carrier portal data is scoped.
- Quote-to-load conversion preserves pricing and attribution.
- Commission payout readiness requires customer payment and carrier settlement.
- Document extraction requires review before downstream updates.
- Owner/admin route restrictions work.
- Twilio malformed callbacks return controlled errors.

Completion criteria:

- High-risk API tests run locally and in CI.
- A future agent cannot break money/compliance/security rules unnoticed.

## Not Recommended Until Later

Do not prioritize these unless the business model changes or the team has
already completed the phases above:

- full LTL rating/consolidation
- EDI
- parcel, rail, ocean, or multimodal operations
- driver app
- fleet maintenance
- IFTA
- owned-truck dispatching
- advanced shipper procurement
- complex contract tariffs
- factoring marketplace

## Definition Of Complete

The project can be considered complete when:

- The aesthetics/UX pass is complete page by page.
- DAT/Truckstop live workflows are verified.
- Carrier vetting is connected to a real provider.
- PDF document automation works with review gates.
- Twilio/Resend workflows are production-verified.
- Background jobs run scheduled automation.
- Portals are hardened for external use.
- Accounting export/sync is decided and implemented if needed.
- Tracking automation handles stale updates and exceptions.
- Claims/disputes are manageable.
- High-risk automated tests pass.
- The full local QA script passes with realistic records.
