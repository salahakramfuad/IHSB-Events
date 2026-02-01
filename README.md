# IHSB Event Management System

A full-featured event management system for **International Hope School Bangladesh** built with Next.js 16 (App Router), Firebase/Firestore, and Brevo for email notifications.

---

## Features

### Public Features

- **Event Listing** (`/events`)
  - Browse upcoming and past events
  - Search by title, description, location, venue, tags
  - Sorted by date (upcoming soonest first, past most recent first)
  - Event cards with logo or initials

- **Event Detail Page** (`/events/[id]`)
  - Full event information (date, time, venue, description)
  - Event logo or initials display
  - Category selection (if event has categories)
  - Registration form: name, email, phone, school, note, category
  - Awardees section with positions 1–20
  - Gold/silver/bronze backgrounds for 1st, 2nd, 3rd place
  - Registration number, name, school displayed for each awardee

- **Registration API** (`POST /api/register`)
  - Validates required fields
  - Duplicate check (email + eventId)
  - Generates unique registration ID (e.g., REG-20260130-2AW33)
  - Stores in Firestore
  - Sends Brevo confirmation email

### QR Code Verification

- **Verification Page** (`/verify/[id]`)
  - Scan QR code from registration PDF
  - **Verified**: Green screen with participant name, school, event, registration ID, category, position (if winner)
  - **Not Verified**: Red screen if registration not found in database

### Admin Dashboard

- **Sidebar Navigation**
  - Collapsible sidebar with toggle (icons only when collapsed)
  - Dashboard, Events, Profile, Admins (super admin only)
  - Profile icon and Sign out fixed at bottom
  - Smooth animations

- **Dashboard Home** (`/admin`)
  - Next upcoming event highlight card
  - Quick access to events and registrations

- **Events Management** (`/admin/events`)
  - Search events by title, venue, created by
  - Sort by date (upcoming first, then past)
  - Create new events
  - Inline edit button on event detail page

- **Event Creation/Edit**
  - Title, description, full description
  - Date picker and time picker (custom UI)
  - Venue/location
  - Categories (multiple)
  - Event logo upload (Cloudinary)
  - Event image/banner

- **Event Detail Page** (`/admin/events/[id]`)
  - Collapsible event details (expand/collapse to save space)
  - Wider layout for registrations
  - **Winners Section**: Registrations with positions 1–20
    - Individual publish button per winner
    - Sends congratulatory email to participant
    - Gold/silver/bronze styling for top 3
    - Name, school, registration number, category
  - Registration stats and export options

### Registrations Management

- **Search & Filter**
  - Search by name, email, phone, school, category, note, registration ID
  - Filter by position (1st–20th or none)
  - Filter by category
  - Filter by notified status (yes/no)

- **Position Assignment**
  - Assign position 1st–20th to each registration
  - Registrations with positions appear in Winners section

- **Export**
  - **Download Excel**: Export filtered registrations to `.xlsx`
  - **Download PDF**: Individual registration certificate per student
  - **Download All PDFs**: Combined PDF with all (filtered) registrations

- **Registration PDF**
  - Event logo (or event initials if no logo)
  - Event name and International Hope School Bangladesh
  - Registration details section
  - Registration ID (highlighted)
  - Participant: name, email, phone, school, category, note
  - Event: date, time, venue
  - Position badge (if winner)
  - QR code for verification (links to production URL)

- **Super Admin Only**
  - Edit registration: update student name, email, phone, school, note, category

### Email Notifications

- **Registration Confirmation** (Brevo)
  - Sent on successful registration
  - Event details, registration ID, venue, date

- **Awardee Congratulations** (Brevo)
  - Sent when admin publishes result for a winner
  - Personalized with name, position, event
  - Beautiful design with gold/silver/bronze theming
  - Motivational quote and celebratory messaging

### Authentication

- Firebase email/password login
- JWT-based admin session
- Roles: `admin` (event owner) and `superAdmin`
- Super admins: manage admins, edit any registration
- `SUPER_ADMIN_EMAILS` env var for initial super admins

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Firebase Admin SDK, Firestore
- **Auth**: Firebase Auth, JWT, Custom Claims
- **Email**: Brevo (transactional)
- **Storage**: Cloudinary (event logos/images)
- **PDF**: jsPDF, qrcode
- **Excel**: SheetJS (xlsx)

---

## Setup

1. **Environment variables**  
   Copy `.env.local.example` to `.env.local` and configure:
   - Firebase (client + admin credentials)
   - `BREVO_API_KEY`, `BREVO_FROM_EMAIL` (or `BREVO_SENDER_EMAIL`)
   - `SUPER_ADMIN_EMAILS` (comma-separated super admin emails)
   - `NEXT_PUBLIC_BASE_URL` (e.g. `https://ihsb-events.vercel.app`) for QR codes and verification links
   - Cloudinary (for logo/image uploads)

2. **Firestore rules**  
   Deploy: `firebase deploy --only firestore:rules`

3. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

---

## Firestore Structure

- `events` — public read; write by admin/superAdmin
- `events/{eventId}/registrations` — read by admin; writes via API (Admin SDK)
- `admins/{uid}` — read/write by own user; created on assign-role

---

## Scripts

| Command        | Description          |
|----------------|----------------------|
| `npm run dev`  | Development server   |
| `npm run build`| Production build     |
| `npm run start`| Start production     |
| `npm run lint` | Run ESLint           |

---

## License

Proprietary — International Hope School Bangladesh
