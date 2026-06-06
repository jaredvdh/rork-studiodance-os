# Redesign StudioFlow landing page with premium SaaS look, 5-tier pricing, and vertical-aware content

## Overview

A complete redesign of the public `/` landing page (Landing.tsx). The current 696-line page is replaced with a polished, multi-section SaaS page that communicates StudioFlow as a modern self-service platform for class-based studios.

## Design

- **Canvas**: Warm cream (#FAF8F5) background with soft ambient blurs and grain texture
- **Typography**: Fraunces display font for headings, Inter for body — keeps the editorial/premium feel
- **Accent**: Rose/pink (#e85d75) for CTAs and highlights, deep navy (#1a1423) for dark sections and primary buttons
- **Cards**: Rounded-2xl/3xl with subtle borders and shadows, hover lift animations
- **Mockups**: Layered floating UI cards (dashboard, attendance, billing, migration wizard, mobile portal) instead of stock imagery — shows the actual product

## Sections (top to bottom)

### 1. Navigation (sticky)

- Logo, desktop links (Features, How it works, Migration, Pricing, Portal, Log in)
- "Open dashboard" CTA button
- Mobile hamburger menu
- "Parent/Student Portal" renamed to just "Portal"

### 2. Hero

- Updated headline: "Run your studio from one calm dashboard."
- Updated subheadline: "Classes, members, students, billing, waivers, staff, events and communication — all in one operating system built for modern studios."
- Trust statement badge: "No sales calls. No onboarding fees. No long implementation projects."
- Primary CTA: "Start Free Trial", Secondary: "View Live Demo"
- Large floating mockup panel on desktop: browser chrome with layered cards showing class schedule, student profile, billing, waivers, migration wizard, mobile portal — all animated with stagger delays

### 3. Business Type Selector

- 5 tab-style buttons: Dance Studio, Fitness Studio, Music School, Martial Arts, Yoga / Pilates
- Selecting updates: product screenshots context, use cases list, feature highlights, and testimonial-like content
- Each type has its own mockup card (e.g., Dance shows recital/costume cards, Fitness shows membership/attendance, etc.)

### 4. Features ("Everything your studio needs.")

- 10 feature cards in a responsive grid (2-col tablet, 3-col desktop)
- Icons with rose background that fills on hover
- Cards: Scheduling & Classes, Students/Members/Families, Attendance Tracking, Billing & Payments, Digital Waivers, Communication Tools, Events & Recitals, Instructor Management, Migration Assistant, Parent/Member Portal

### 5. Migration ("Switching software should not be painful.")

- Headline: "Switching software should not be painful."
- Subheadline about moving from spreadsheets or existing platforms
- 4-step wizard visual (Upload → Map → Validate → Launch) with numbered circles and connecting lines
- Checklist card with 6 items (CSV/Excel, smart mapping, duplicate detection, family linking, class/enrolment preview)
- Competitor mention: "Whether you're moving from spreadsheets, Jackrabbit, Mindbody, WellnessLiving or another platform..."

### 6. How It Works ("Start today. Open registration tonight.")

- Headline: "Start today. Open registration tonight."
- Subheadline: "Most studios can create their account, import data and begin accepting registrations within a single session."
- 4 numbered steps in a horizontal layout (desktop) / vertical (mobile): Create your studio → Import your data → Open registration → Run everything in one place

### 7. Pricing ("Simple pricing that grows with your studio.")

- 5-tier pricing cards: Startup ($29/mo, 150 students), Studio ($59/mo, 300, **Most Popular**), Growth ($99/mo, 750), Pro ($149/mo, 1500), Enterprise (Custom, multi-location)
- Each card shows features specific to the tier in a comparison layout
- "Start Free Trial" CTA on every card (Enterprise: "Contact us")
- Subheadline: "No contracts. No forced demos. No surprise onboarding fees."

### 8. Portal Section

- Dedicated section highlighting the parent/member portal
- Shows mockup of mobile portal screens
- Copy: "A secure portal for students, members, families and caregivers."

### 9. Final CTA

- Headline: "Spend less time managing your studio. More time growing it."
- Subheadline: "Join modern studios using StudioFlow to simplify scheduling, communication, billing and events."
- Two CTAs: Start Free Trial, View Demo
- Dark navy background with rose ambient glows

### 10. Footer

- Copyright, section links, Portal link, Log in link

## Responsive Behavior

- Mobile: single-column cards, collapsed nav hamburger, stacked mockup panels hidden below tablet
- Tablet: 2-column grids where appropriate
- Desktop: full multi-column layouts, floating mockup panels visible
- All buttons ≥44px touch targets on mobile

