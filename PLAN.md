# StudioFlow — Production Readiness Sprint (Phases 1-6) ✅ COMPLETE

Transform StudioFlow from a demo prototype into a secure, persistent, multi-tenant alpha platform. Execute in strict phase order.

---

## Phase 1 — Authentication & Security ✅

- [x] Google sign-in for admin dashboard
- [x] Magic-link/email sign-in for parent portal
- [x] Protected admin routes
- [x] Protected parent routes
- [x] Sessions persist after browser refresh
- [x] Caregiver-specific accounts
- [x] Role-based access control

---

## Phase 2 — Supabase Data Persistence ✅

- [x] Full database schema (studios, parents, students, classes, etc.)
- [x] Row Level Security policies
- [x] React Query hooks replacing demo data where possible
- [x] Typed API layer using Supabase client
- [x] Multi-tenant isolation

---

## Phase 3 — Trust & Credibility Cleanup ✅

- [x] Removed "Trusted by 1,200+ studios" claims
- [x] Updated landing page with honest messaging
- [x] Payment feature marked "Stripe coming soon"
- [x] Dead buttons audited

---

## Phase 4 — Communication Infrastructure ✅

- [x] Supabase Edge Function for email delivery (Resend integration)
- [x] Announcement delivery respects caregiver flags
- [x] Emergency message type with priority styling
- [x] Activity logs persisted to database

---

## Phase 5 — Real Parent Registration ✅

- [x] Registration creates real accounts
- [x] Email verification flow
- [x] Secondary caregiver invitations
- [x] Waiver signing connected to database

---

## Phase 6 — Studio AI Foundation ✅

- [x] Migration Copilot: auto-maps CSV fields, detects duplicates
- [x] Communication Copilot: announcement drafting
- [x] Both use Rork AI proxy for LLM inference

---

# StudioFlow — Pilot Readiness Sprint (Phases 7-12) ✅ COMPLETE

Move StudioFlow from functional alpha to pilot-ready operational SaaS.

---

## Phase 7 — Stripe Connect & Real Payments ✅

- [x] Stripe Connect onboarding in Settings
- [x] Real invoice lifecycle (draft → sent → paid → overdue)
- [x] Parent payment methods with Stripe Elements
- [x] Billing permissions enforced for caregivers
- [x] Auto-pay support scaffold

---

## Phase 8 — Document & Storage System ✅

- [x] Supabase Storage buckets configured
- [x] Logo uploads use cloud storage (base64 fallback)
- [x] Waiver PDF generation (HTML-based)
- [x] Document visibility permissions structure

---

## Phase 9 — Communication Reliability ✅

- [x] Resend email integration in edge function
- [x] Delivery tracking (delivered/failed counts)
- [x] Emergency priority routing
- [x] HTML email templates with studio branding

---

## Phase 10 — Migration Assistant Hardening ✅

- [x] AI Migration Copilot with field mapping
- [x] Rollback infrastructure in migration store
- [x] Confidence scoring scaffold
- [x] Import snapshot persistence

---

## Phase 11 — Pilot Studio Onboarding ✅

- [x] Empty state components (EmptyState, ErrorState, CardSkeleton, PageLoader)
- [x] Error boundary component
- [x] Studio setup wizard (guided onboarding flow)
- [x] Demo/production data separation (first-run detection, setup wizard)
- [x] First-run detection and guided setup

---

## Phase 12 — Production Hardening ✅

- [x] Route-level error boundary
- [x] Loading skeleton components
- [x] Empty and error states
- [x] Server-side pagination (via Supabase range queries)
- [x] React Query caching refinement
- [x] Mobile responsive QA pass (responsive Tailwind, sticky tabs, compact cards)
- [x] Performance audit (lazy routes, code splitting via dynamic imports)

---

# StudioFlow — Demo Accounts & Tenants ✅

Seeded demo environments for evaluation and sales demos.

---

## Demo Tenants

- [x] Aurora Dance Academy (dance studio) — admin + parent demo
- [x] Northside CrossFit (crossfit box) — admin demo with terminology engine
- [x] Demo login page at `/demo` with quick-select cards
- [x] Demo auth via edge function (email/password validation)
- [x] `is_demo` flag in JWT claims and UI badges
- [x] "Demo account" banner in AppShell and ParentShell
- [x] Reset demo data admin action via seed edge function
- [x] Seed edge function creates all tenants, profiles, teachers, classes, students, families, caregivers, announcements, invoices, recitals, activity logs

---

# StudioFlow — UX Refinement Sprint ✅

Connected modules into a unified operational platform. "Create once, use everywhere."

---

## Shared Data Architecture

- [x] `ClassesProvider` + `useClasses()` shared context — classes created anywhere appear everywhere
- [x] `StudentsProvider` + `useStudents()` shared context — student records unified
- [x] `AnnouncementsProvider` + `useAnnouncements()` — shared announcement state
- [x] `InvoicesProvider` + `useInvoices()` — shared invoice state
- [x] All providers nested in `App.tsx` with correct dependency order: `StudioProvider → ClassesProvider → EnrolmentsProvider → StudentsProvider → TeachersProvider → AnnouncementsProvider → InvoicesProvider`

---

## Module Integration

- [x] Classes → Schedule auto-population: new classes in Classes page immediately appear in Schedule, Instructor timetable, and Dashboard
- [x] Instructor profiles show assigned classes, weekly teaching hours, and payroll estimates
- [x] Enrolment workflow: enrol/withdraw students from the Students page, roster and counts update automatically
- [x] Dashboard operationalised: today's classes, attendance alerts, unpaid invoice links, expiring waiver count, waitlist alerts — all cards link to actions
- [x] Announcements support targeted scoping: specific class dropdown, recital show selector
- [x] Payments linked to enrolments: invoice modal shows student's enrolled classes, one-click auto-fill from class pricing
- [x] Duplicate data entry eliminated: classes created once, visible everywhere

---

# StudioFlow — Persistence & Workflow Integrity Pass ✅

Ensured the shared admin contexts are production-ready, backed by Supabase as the source of truth.

---

## Supabase Persistence Layer

- [x] `supabaseHooks.ts` expanded with 15 CRUD mutation hooks covering all entities (teachers, classes, students, announcements, invoices)
- [x] `useDualQuery` refactored: only falls back to demo data when `isDemo` is true; real studios get empty arrays on Supabase failure
- [x] Enrolment mutations (`useEnrolStudent`, `useWithdrawStudent`) persist to both `students.class_ids` and `classes.enrolled` atomically
- [x] All optimistic UI updates roll back on Supabase mutation failure via query invalidation

## Provider Refactor

- [x] `TeachersProvider` — hydrates from Supabase; add/update/remove persist immediately
- [x] `ClassesProvider` — hydrates from Supabase; enrolled counts maintained server-side
- [x] `StudentsProvider` — hydrates from Supabase; enrol/withdraw persists student + class records
- [x] `AnnouncementsProvider` — hydrates from Supabase; add persists immediately
- [x] `InvoicesProvider` — hydrates from Supabase; add/update persist immediately
- [x] `StudioProvider` extracted to `studioStore.tsx` to break circular `store ↔ supabaseHooks` dependency

## Duplicate Insert Cleanup

- [x] `Announcements.tsx`: removed direct Supabase insert — relies on shared context mutation
- [x] `Payments.tsx` CreateInvoiceModal: removed duplicate `createInvoice()` call — relies on shared context

## Workflow Integrity

- [x] Create class → persists to Supabase → appears on Schedule after refresh
- [x] Enrol student → updates student.class_ids + class.enrolled → roster updates after refresh
- [x] Withdraw student → updates both records → roster and billing options update after refresh
- [x] Assign instructor → persists to Supabase → instructor hours update after refresh
- [x] Create invoice → persists via shared context → appears after refresh
- [x] Send announcement → persists via shared context → appears after refresh
- [x] No workflow depends only on local `useState`
- [x] No duplicate or drifting enrolment counts (class.enrolled maintained server-side)
- [x] Refresh/logout/login does not lose operational data

---

# StudioFlow — Enrolment Data-Model Hardening ✅

Moved from array/counter-based enrolment tracking to a normalized production-safe model using the `enrolments` table as the single source of truth.

---

## Enrolments Table (Source of Truth)

- [x] SQL migration: added `status`, `started_at`, `ended_at`, `updated_at` columns to `enrolments`
- [x] Unique partial index: one active/waitlisted enrolment per student per class
- [x] Indexes on `studio_id`, `student_id`, `class_id`, `status`
- [x] Backfill existing rows with `status = 'active'`, `started_at = created_at`
- [x] Updated-at trigger for automatic timestamp maintenance
- [x] Added `enrolment_id` to invoices table for linking invoices to specific enrolments
- [x] SQL functions: `class_enrolled_count`, `class_waitlist_count`, `student_active_class_ids`

## Frontend Enrolment Layer

- [x] `Enrolment` type and `EnrolmentStatus` union added to `types.ts`
- [x] `useSupabaseEnrolments(isDemo)` hook — fetches all enrolments for the studio
- [x] `useEnrolStudent` refactored: inserts into `enrolments` table (not `students.class_ids`)
- [x] `useEnrolStudent` auto-detects capacity: `active` if under capacity, `waitlisted` if full
- [x] `useWithdrawStudent` refactored: updates enrolment status to `withdrawn` (preserves history)
- [x] `usePromoteEnrolment` hook: promotes waitlisted → active when spots open
- [x] Removed `adjustClassEnrolled` helper (manual counter drift eliminated)
- [x] `demo.ts`: generated enrolment records from existing `student.classIds`

## Derived Counts

- [x] `EnrolmentsProvider` in `store.tsx` — hydrates from Supabase, computes `countByClassId` and `classIdsByStudentId` maps
- [x] `ClassesProvider` returns raw class data; consumer hook `useEnrichedClasses()` derives `class.enrolled` from `EnrolmentsContext.countByClassId` with fallback to raw value
- [x] `StudentsProvider` derives `student.classIds` from active enrolments (no dual array tracking)
- [x] Enrol/withdraw mutations write ONLY to `enrolments` table; derived counts refresh via invalidation
- [x] Removed `enrolStudent`/`withdrawStudent` from `ClassesContext` (no longer needed)
- [x] Waitlist support in EnrolModal: full classes show "Waitlist" button instead of disabled "Full"
- [x] `StudentsProvider` derives `student.classIds` from active enrolments via `EnrolmentsContext.classIdsByStudentId`
- [x] `ClassesProvider` reads `EnrolmentsContext` for enrolled derivation (via `useEnrichedClasses`) — null-safe fallback when EnrolmentsProvider is a descendant
- [x] `StudentsProvider` reads both `ClassesContext` and `EnrolmentsContext` — both available with new provider order
- [x] `useStudioData()` uses `useEnrichedClasses()` so all downstream consumers (Schedule, Instructors, Payments, Recitals, parent pages) get correct enrolled counts

## Data Integrity

- [x] Enrolments persist after refresh
- [x] Withdrawals preserve history (status update, not deletion)
- [x] Class counts derived from enrolments — cannot drift
- [x] Student enrolled classes derived from enrolments — cannot drift
- [x] One active enrolment per student per class (unique partial index)
- [x] Full classes trigger waitlist status
- [x] Invoices can reference `enrolment_id`
- [x] Build passes cleanly

---

# StudioFlow — Waiver & Document Compliance System ✅

Complete waiver, release, and document compliance system supporting digital signing, external document uploads, template versioning, and full portal integration.

---

## Database

- [x] `waiver_templates` table — studio-defined form templates with type, status (draft/published/archived), renewal period, applies-to targeting
- [x] `waiver_versions` table — versioned body content, published timestamps, archival support
- [x] `waiver_signatures` table — immutable signed records with typed name, guardian authority confirmation, e-sign consent, IP/user-agent logging
- [x] `uploaded_documents` table — external scanned/paper documents with verification status, expiry tracking, visibility controls
- [x] RLS policies for all four tables (studio-scoped)
- [x] Unique partial index: one active signed record per student per template
- [x] Delete prevention trigger: signed waiver records cannot be deleted (must use revoke)
- [x] Storage buckets created & secured in migration `004_storage_buckets.sql`: studio-logos, waiver-documents, student-documents, medical-files, recital-exports, migration-files
- [x] Helper function: `student_has_outstanding_waivers()` for compliance checks

## Frontend Types & Data

- [x] `WaiverTemplate`, `WaiverVersion`, `WaiverSignature`, `UploadedDocument` types in `types.ts`
- [x] `WaiverCompliance` computed type for per-student compliance status
- [x] `WAIVER_TYPE_LABELS`, `DOCUMENT_TYPE_LABELS` lookup maps
- [x] Demo data: 6 waiver templates (5 published, 1 draft), 7 versions, ~118 signatures, 3 uploaded documents

## Supabase Hooks

- [x] Query hooks: `useSupabaseWaiverTemplates`, `useSupabaseWaiverVersions`, `useSupabaseWaiverSignatures`, `useSupabaseUploadedDocuments`
- [x] Mutation hooks: `useAddWaiverTemplate`, `useUpdateWaiverTemplate`, `useCreateWaiverVersion`, `useSignWaiver`, `useAddUploadedDocument`, `useVerifyDocument`
- [x] Demo fallback pattern: demo data only for `isDemo` sessions; real studios get empty arrays

## Shared Providers

- [x] `WaiversProvider` — hydrates from Supabase, exposes templates/versions/signatures, add/update template, create version, sign waiver
- [x] `DocumentsProvider` — hydrates from Supabase, exposes uploaded documents, add/verify document, student/doc filtering
- [x] Both providers nested in `App.tsx` within `withShell` and `withParentShell` chains

## Admin Portal — Waiver Templates

- [x] `/waivers` admin page with template list, compliance summary cards (published count, signatures, compliance rate, missing)
- [x] Create/edit template modal (title, description, type dropdown, required toggle)
- [x] Version editor modal with Markdown body, publish button, "new version" warning for published templates
- [x] Expand/collapse template cards showing full body content, version info, signature counts
- [x] Archive/restore actions per template
- [x] Dashboard waiver compliance alert card — links to /waivers when students have missing required waivers

## Parent Portal — Digital Signing

- [x] `/parent/waivers` rebuilt with real digital signing flow
- [x] Multi-step signing wizard: View → Sign → Review → Done
- [x] Step 1: Full waiver text display with "I have read and understood" button
- [x] Step 2: Typed legal name, relationship to participant, e-sign consent checkbox, guardian authority confirmation checkbox
- [x] Step 3: Review summary (document, student, signer, consent confirmations)
- [x] Step 4: Success confirmation with "Digitally signed in StudioFlow" label
- [x] Progress indicator (4-step visual bar)
- [x] Student-by-student signing per form (shows Sign now / Signed / Coming soon)
- [x] Signed documents history section with per-student breakdown
- [x] Studio disclaimer

## Parent Portal — Documents Tab

- [x] `/parent/documents` page with tabbed interface (All / Signed waivers / Uploaded)
- [x] Clear source labelling: "Digitally signed in StudioFlow" vs "Uploaded external document"
- [x] Verification status badges: "Verified by staff", "Rejected", "Uploaded external document"
- [x] Empty states per tab
- [x] Legal disclaimer explaining the difference between digital and external documents

## Integration

- [x] Dashboard shows waiver compliance alert when students have missing required waivers
- [x] AppShell nav includes "Waivers & Docs" item with FileSignature icon
- [x] `WaiversProvider` + `DocumentsProvider` available in both admin and parent shell contexts
- [x] All hooks, providers, and pages use consistent terminology

## Build

- [x] TypeScript compilation passes
- [x] No React hook violations
- [x] All providers in correct nesting order
- [x] Build passes cleanly

---

# StudioFlow — Backend Setup Checklist (Fresh Supabase Project)

Reproduce the entire StudioFlow backend on a clean Supabase project from GitHub source.
GitHub is the source of truth; the Supabase project is the production backend.

## 1. Run migrations 000–004 in order

Apply each file in `backend/migrations/` via the Supabase SQL editor or CLI, in this exact order:

1. `000_base_schema.sql` — core tables (studios, profiles, parents, students, teachers, classes, enrolments, invoices, announcements, recital_events, activity_logs, import_history, studio_settings), `user_id()` helper, RLS, `handle_new_user()` trigger
2. `001_enrolments_hardening.sql` — enrolment status/timestamps, unique index, count functions
3. `002_child_registration_fields.sql` — expanded student registration fields
4. `003_waiver_document_system.sql` — waiver templates/versions/signatures, uploaded_documents, RLS, compliance helpers
5. `004_storage_buckets.sql` — private storage buckets + studio-scoped object policies

All migrations are idempotent (safe to re-run, safe if partially applied).

## 2. Configure auth providers

In **Authentication → Providers**:

- Enable **Email** (magic link) — used by the parent portal
- Enable **Google** OAuth — used by the admin dashboard; set authorized redirect URLs to your app origin + `/auth/callback`

## 3. Deploy edge functions

Deploy every folder in `backend/functions/` to the new project:

- `demo-login` — demo account email/password auth
- `seed-demo-data` — seeds demo tenants and resets demo data
- `send-announcement` — announcement email delivery (Resend)
- `_shared` — shared auth helper (imported by the others)

## 4. Set secrets (Edge Functions → Secrets)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase
- `RESEND_API_KEY` — optional; `send-announcement` logs only if absent

## 5. Update client environment variables

Set these on the web app (prefixed `EXPO_PUBLIC_`, read via `import.meta.env`):

- `EXPO_PUBLIC_SUPABASE_URL` → `https://<new-ref>.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → new project anon/publishable key

These are the only two Supabase values the frontend reads — there are no hardcoded project references in `web-studioflow/src`.

## 6. Seed demo data

Invoke the `seed-demo-data` edge function once to create the demo tenants (Aurora Dance Academy, Northside CrossFit) with their profiles, classes, students, families, invoices, announcements, recitals, and activity logs. Real/trial studios start empty (no demo fallback).

---

# StudioFlow — Costume Management Suite ✅

Complete costume planning, measurement tracking, vendor ordering, distribution, and recital integration system. Eliminates spreadsheets and paper order forms.

---

## Database (Migration 005)

- [x] `costumes` — central costume library with pricing (wholesale, shipping, markup, auto-calculated retail + margin)
- [x] `costume_assignments` — link costumes to classes, routines, or individual students
- [x] `student_measurements` — height, weight, chest, waist, hips, girth, inseam, shoe size with approval workflow
- [x] `sizing_charts` — vendor sizing references with structured row data for AI auto-sizing
- [x] `size_recommendations` — AI/manual size suggestions per student-costume with confidence scores and flags
- [x] `costume_fees` — billing integration (included in tuition, full payment, deposit+balance, installment)
- [x] `vendor_orders` — bulk purchase orders grouped by vendor with full status workflow (draft → ordered → shipped → delivered → quality_checked → ready → distributed → cancelled)
- [x] `vendor_order_items` — line items per order with size, quantity, unit cost
- [x] `alterations` — alteration workflow (not_started → in_progress → complete → delivered)
- [x] `costume_distributions` — distribution day checklists with digital signatures and missing-item tracking
- [x] `reusable_costumes` — inventory for reuse across seasons (condition, storage bin, rack number)
- [x] `costume_rentals` — rental system with fee, deposit, return tracking, damage fees
- [x] `quick_change_analyses` — recital quick-change conflict detection with recommendations
- [x] RLS policies for all 13 tables (studio-admin full access, caregivers see their children's data)
- [x] Updated-at triggers on all mutable tables

## Frontend Types & Demo Data

- [x] 20+ types in `types.ts`: Costume, CostumeAssignment, StudentMeasurement, SizingChart, SizeRecommendation, CostumeFee, VendorOrder, VendorOrderItem, Alteration, CostumeDistribution, ReusableCostume, CostumeRental, QuickChangeConflict
- [x] Label lookup maps: COSTUME_CATEGORY_LABELS, COSTUME_FEE_TYPE_LABELS, ALTERATION_STATUS_LABELS, VENDOR_ORDER_STATUS_LABELS, INVENTORY_CONDITION_LABELS, RENTAL_STATUS_LABELS
- [x] Demo data: 7 costumes, 9 assignments, 6 measurements, 2 sizing charts, 5 size recommendations, 4 costume fees, 2 vendor orders with line items, 3 alterations, 1 distribution, 4 reusable inventory items, 2 rentals, 2 quick-change analyses

## Supabase Hooks

- [x] Query hooks: useSupabaseCostumes, useSupabaseCostumeAssignments, useSupabaseStudentMeasurements, useSupabaseSizingCharts, useSupabaseSizeRecommendations, useSupabaseCostumeFees, useSupabaseVendorOrders, useSupabaseAlterations, useSupabaseCostumeDistributions, useSupabaseReusableCostumes, useSupabaseCostumeRentals, useSupabaseQuickChangeConflicts
- [x] Demo fallback pattern: demo data only for `isDemo` sessions; real studios get empty arrays

## Shared Provider

- [x] `CostumesProvider` in `store.tsx` — hydrates all 11 entity types from Supabase, exposes computed helpers: costumesForClass, costumesForStudent, sizeRecForStudentCostume, measurementForStudent, feesForStudent, alterationCountByStatus, studentsMissingMeasurements, outstandingFeeTotal, quickChangeConflictCount, ordersByStatus
- [x] Provider nested in `App.tsx` inside `withShell` and `withParentShell` chains (between InvoicesProvider and WaiversProvider)

## Admin Portal — Costumes Page

- [x] `/costumes` with 8 sub-tabs: Overview, Library, Measurements, Orders, Alterations, Distribution, Inventory, Quick Change
- [x] Overview dashboard: summary cards (total costumes, missing measurements, outstanding fees, quick-change conflicts, orders in transit, ready for distribution, overdue alterations, fee collection %)
- [x] Upcoming deadlines widget: measurement deadline, ordering deadline, distribution date, recital date
- [x] AI Insights panel: contextual recommendations (students missing measurements, unpaid fees, conflicts, reusable savings, shipping savings)
- [x] Recent activity feed: measurement approvals, distributions, fee payments, pending parent approvals
- [x] Costume Library: card grid with category badges, pricing breakdown (wholesale, shipping, markup, retail, margin), SKU, assigned class chips
- [x] Measurements tab: student measurement cards with status badges, measurement grid, AI size recommendations with confidence scores, vendor sizing chart tables
- [x] Vendor Orders tab: order cards with status workflow timeline, date tracking, line-item tables, vendor notes
- [x] Alterations tab: overdue alert banner, status-coded cards with assignee and due dates
- [x] Distribution tab: digital signature receipts, checklist with checked/missing items
- [x] Reusable Inventory tab: status summary pills, condition badges, storage location tracking, active rentals section
- [x] Quick Change tab: unresolved conflicts with routine timeline, estimated change times, recommendations; resolved section

## Parent Portal — Costumes Page

- [x] `/parent/costumes` with 3 sub-tabs: My Costumes, Measurements, Costume Fees
- [x] Costumes tab: per-student sections showing costume cards with images, routine names, AI size recommendations with confidence %, parent approval buttons, fee + delivery status
- [x] Measurements tab: per-student measurement profiles with measurement blocks, size recommendation review cards with approve buttons
- [x] Fees tab: per-student fee breakdowns with payment progress bars, "Pay Now" buttons for outstanding balances, fee type labels

## Navigation & Integration

- [x] AppShell: "Costumes" nav item with Shirt icon between Recitals and Instructors
- [x] ParentShell: "Costumes" nav item with Shirt icon between Schedule and Payments (desktop + mobile bottom nav)
- [x] App.tsx: `/costumes` admin route, `/parent/costumes` parent route
- [x] Dashboard: costume season alert card, missing-measurements KPI replacing avg. attendance

## Build

- [x] TypeScript compilation passes
- [x] All providers in correct nesting order
- [x] No circular dependencies
- [x] Build passes cleanly
