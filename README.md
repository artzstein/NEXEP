# NEXEP — Placement Tracker

**NEXEP** is a frontend-powered **Placement Tracker** web application designed to streamline campus and entry-level hiring by connecting **Freshers (Candidates)** and **Recruiters** in one place. It helps students showcase their skills, resumes, and video introductions while enabling recruiters to post openings, track engagement, and manage offer outreach.

---

## Key Features

### 1. Role-Based Authentication & Route Protection
- Separate **Fresher** and **Recruiter** sign-up and sign-in flows.
- Client-side password authentication using per-user salted **SHA-256** hashing (`crypto.subtle` with pure-JS fallback) stored in `localStorage`.
- Role-aware route guards (`ProtectedRoute` and `RedirectIfAuthenticated`) for Fresher and Recruiter dashboards.

### 2. Fresher (Candidate) Placement Tools
- **Profile & Skill Card Builder (`/postskills`)**: Submit full name, phone, email, college status (currently studying with expected passout year or passed out), role preference (`Internship` or `Job`), skill tags, **PDF Resume**, and **Video Introduction**, complete with a live preview card.
- **My Applications (`/YourCard`)**: View and manage your submitted candidate cards, preview uploaded resumes, play intro videos, or delete cards.
- **Browse Open Roles (`/findjobs` & `/details/:id`)**: Explore Full-Time jobs and Internships with remuneration, internship duration, required skills, job descriptions, company briefs, and persistent one-click **Apply Now** status.

### 3. Recruiter Hiring Tools
- **Post Opportunities (`/postjobs`)**: Create Full-Time or Internship listings with position title, remuneration, company name, company brief, required skills, internship duration, and role description.
- **My Posted Jobs (`/PostedCard`)**: View and remove job postings owned by the logged-in recruiter.
- **Browse Candidates (`/findskills`)**: Inspect candidate details, view PDF resumes, play video introductions, and send offer letters directly from candidate cards.
- **Offer Email Templates (`/recruiterDashboard`)**: Create, edit, delete, preview, and select reusable offer letter templates supporting `{name}` placeholders.

### 4. Placement Analytics & Engagement Tracking (`/myanalytics`)
- Filter metrics across **Last 7 days**, **Last 30 days**, and **Last 90 days**.
- **Recruiter Analytics**: Tracks total jobs posted, total job views, and a sortable posting engagement table.
- **Candidate Analytics**: Tracks profile strength percentage with a 5-point completion checklist, total & unique recruiter profile views, a daily views trend chart, and open jobs count.
- **View Deduplication**: Counts at most one view per viewer per job or candidate profile per day.

### 5. 100% Frontend Storage (No Backend Required)
- Structured data (users, sessions, jobs, candidate profiles, views, applications, offer logs, and templates) is persisted locally in browser **`localStorage`**.
- Binary uploads (PDF resumes and video introductions) are persisted in browser **`IndexedDB`** (`nexepFilesDB`) and served via object URLs.

---

## Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide React, Headless UI
- **Client Persistence:** `localStorage` + `IndexedDB` + Web Crypto API

---

## Project Structure

```text
NEXEP/
├── NextStep/                  # React + Vite frontend application
│   └── src/
│       ├── Components/        # Dashboards, Auth, Jobs, Candidates, Analytics, Nav
│       ├── Context/           # AppContext state management
│       └── utils/             # localStore.js & useSkillFileUrl.js
└── README.md
```

---

## Running Locally

```bash
cd NextStep
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

To build for production:

```bash
cd NextStep
npm run build
```

---

## Creators

**CSE 11**

| Name | Roll Number | Branch / Section |
| :--- | :--- | :--- |
| **Akhil Singh** | `2400320100125` | CSE 11 |
| **Aditya Choudhary** | `2400320100074` | CSE 11 |
