# StudioFlow — Production Readiness Sprint (Phases 1-6)


# StudioFlow Production Readiness Sprint

Transform StudioFlow from a demo prototype into a secure, persistent, multi-tenant alpha platform. Execute in strict phase order.

---

## Phase 1 — Authentication & Security (HIGHEST PRIORITY)

**What users get:**
- Real email/password or Google sign-in for admin dashboard
- Real magic-link or email/password sign-in for parent portal
- Admin routes are locked behind login — inaccessible without authentication
- Parent routes are locked behind login — inaccessible without authentication
- Sessions persist after browser refresh
- Caregiver-specific accounts with separate logins (no shared family passwords)
- Role-based access: studio_admin, instructor, parent/caregiver, emergency_contact_only

**Technical approach:**
- Provision Rork Auth (Google OAuth) via `getOrCreateAuthConfig`
- Create `useAuth` hook following the web auth guide (PKCE via crypto.subtle, JWT decode)
- Create `ProtectedRoute` component that redirects unauthenticated users to login
- Create `AuthCallback` route for production redirect flow
- Create admin login page with Google sign-in and email/password fallback
- Update parent login to use real auth instead of decorative form
- Wire AuthProvider into the app root
- Apply route guards to all admin and parent routes

---

## Phase 2 — Supabase Data Persistence

**What users get:**
- All data survives browser refresh
- Added students, classes, caregivers persist across sessions
- Migration imports are stored in the database permanently
- Registration creates real persistent records
- Multi-tenant isolation via Row Level Security

**Technical approach:**
- Provision Supabase backend
- Create full database schema (studios, users, families, caregivers, students, classes, enrolments, announcements, invoices, waiver_templates, waiver_signatures, activity_logs)
- Add Row Level Security policies on every table
- Replace demo data with React Query hooks (useQuery/useMutation)
- Create typed API layer using Supabase client
- Add loading, empty, and error states to all data-backed pages

---

## Phase 3 — Trust & Credibility Cleanup

**What users get:**
- No misleading claims or fake metrics
- Every button does something real or explains why it's coming soon
- Empty studios onboard cleanly without broken screens
- Loading skeletons and graceful error states everywhere

**Technical approach:**
- Remove "Trusted by 1,200+ studios" fake claim from landing page
- Remove fake revenue chart data from landing hero
- Audit every CTA — ensure it works or shows "coming soon" messaging
- Add skeleton loading components
- Add empty state components for studios with no data
- Add error boundary and retry handling

---

## Phase 4 — Communication Infrastructure

**What users get:**
- Announcements actually deliver to email
- Caregiver permission flags control who receives what
- Emergency messages get priority delivery
- All sensitive actions are audit logged to the database

**Technical approach:**
- Deploy Supabase Edge Function for email delivery (Resend integration)
- Create announcement delivery service that respects caregiver flags
- Add emergency message type with priority styling
- Persist activity logs to the database

---

## Phase 5 — Real Parent Registration

**What users get:**
- Families can onboard fully online
- Registration creates real accounts, families, student records, and waiver records
- Email verification flow
- Secondary caregiver invitations work end-to-end

**Technical approach:**
- Update registration flow to call auth sign-up and database creation
- Add email verification via Rork Auth
- Wire invite flow to real email delivery
- Connect waiver signing to the database

---

## Phase 6 — Studio AI Foundation

**What users get:**
- Migration Copilot: auto-maps CSV fields, detects duplicates, normalizes phone numbers, suggests corrections, explains errors conversationally
- Communication Copilot: drafts recital reminders, cancellation notices, emergency updates, overdue payment reminders

**Technical approach:**
- Add AI-assisted field mapping in the Migration Wizard
- Add AI draft generation in the Announcements page
- Both use Rork AI proxy for LLM inference
- Contextual, not chatbot-style — AI appears inside existing workflows
