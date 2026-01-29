# IHSB Event Management System

Next.js 16 (App Router) event management with public event listing, registration via API, Brevo confirmation emails, and an admin panel with events CRUD and CSV export.

## Features

- **Public**: `/events` (upcoming + past), `/events/[id]` with registration form (name, email, phone, school, note)
- **Registration**: `POST /api/register` — validate, duplicate check (email + eventId), create in `events/{eventId}/registrations`, send Brevo confirmation
- **Admin**: `/admin` protected by middleware (JWT + admin/superAdmin role). Events list, create/edit/delete, registrations list per event, **Export CSV**
- **Auth**: Firebase email/password login; `admins/{uid}` maintained via assign-role; non-admins redirected from `/admin`

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in:
   - Firebase (client + admin)
   - `BREVO_API_KEY`, `BREVO_FROM_EMAIL` (or `BREVO_SENDER_EMAIL`)
   - `SUPER_ADMIN_EMAILS` (comma-separated emails that get superAdmin on login)
   - Optional: `NEXT_PUBLIC_BASE_URL`, Cloudinary

2. Deploy Firestore rules: `firebase deploy --only firestore:rules` (after configuring Firebase project).

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Firestore

- `events` — public read; write by admin/superAdmin (Custom Claims).
- `events/{eventId}/registrations` — no client writes; read by authenticated (admin). Writes only via API (Admin SDK).
- `admins/{uid}` — read/write by own user; created server-side on assign-role.

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint
