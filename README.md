# 🎓 Navrachana University (NUV) ERP — Phase 2, Module 12: Department Management System

[![PostgreSQL 14+](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)](https://www.postgresql.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![RBAC Protected](https://img.shields.io/badge/Security-RBAC%20%2B%20JWT%20%2B%20Bcrypt-orange.svg)]()
[![Documentation](https://img.shields.io/badge/Manual-USER__GUIDE.md-blueviolet.svg)](USER_GUIDE.md)

A high-performance, enterprise-grade academic administration platform engineered for **Navrachana University (NUV)** under **Phase 2 (Academic Structure), Module 12: "Department Management System"**.

---

## 📑 Quick Links
- **Master User & System Manual (Markdown):** [USER_GUIDE.md](USER_GUIDE.md)
- **Printable / Interactive Manual (HTML):** [USER_GUIDE.html](USER_GUIDE.html)
- **Database Schema Definition:** [database/schema.sql](database/schema.sql)
- **Initial Seed Dataset:** [database/seed.sql](database/seed.sql)

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER (Frontend SPA)                        │
│   • React 18 Single-Page Application (Vite Dev Server @ port 5173)             │
│   • Dark Glassmorphism Custom Design System (Design Tokens in index.css)       │
│   • Lucide React Vector Icons • SheetJS (XLSX) Exporter • MultiSelect Filters  │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │ REST API Calls (JSON / Bearer JWT Token)
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                        API & BUSINESS LOGIC (Backend)                          │
│   • Node.js & Express.js REST API Server (@ port 5000)                         │
│   • RBAC Middleware (authenticate, requireAuth, requireAdmin, requireAdminOrHOD│
│   • Parameterized SQL Query Dispatcher with Query Performance Timing           │
│   • In-Memory Ring Buffer for Live SQL Query Auditing (Max 50 items)           │
│   • Nodemailer SMTP Service for Password Recovery OTPs (with Dev Fallback)     │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │ Native PostgreSQL Client Pool (pg.Pool)
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                         DATA PERSISTENCE LAYER                                 │
│   • PostgreSQL 14+ Relational Database Engine (nuv_department_db)              │
│   • Relational Schema with Foreign Key Constraints & B-Tree Indexes            │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Features & Modules

### 1. Multi-Tier Role-Based Access Control (RBAC)
- **Administrator (`admin`):** Full institutional governance across all schools, departments, faculty rosters, programs, live SQL inspection, and password resets.
- **Dean of School (`dean`):** University-wide observer with read-only analytics, school directories, and Excel exports.
- **Head of Department (`HOD`):** Department-scoped access to manage their own department profile, appoint faculty, and configure degree programs.
- **Faculty Member (`Professor`, `Associate Professor`, `Assistant Professor`):** Department-scoped access to view departmental colleagues and manage their personal profile/credentials.

### 2. Authentication & Password Security Lifecycle
- **Dual-Table Account Resolution:** Transparent lookup across `users` (Admins/Deans) and `faculty` (HODs & Teaching staff).
- **Transparent Bcrypt Upgrade:** Automatically upgrades plaintext or legacy hashes to standard `bcrypt` (10 rounds) upon login.
- **Self-Service Password Recovery:** 6-digit cryptographic OTP generation with a 15-minute expiration window and SMTP email dispatch (with dev preview fallback).
- **Authenticated Password Change:** Modal allowing any logged-in user to verify their current password and update it.
- **Account Inactivity Guard:** Inactive accounts (`status = 'Inactive'`) are immediately blocked with HTTP `403 Forbidden`.

### 3. Academic Sessions & Historical Cutoff Context
- **Session Selector:** Switch between Active (`2026–2027`), Archived (`2025–2026`, `2024–2025`), and Upcoming (`2027–2028`) academic sessions.
- **Automated Joining Date Cutoffs:** Filters faculty members whose `joining_date` is on or before the session's closing date (`YYYY-06-30`).
- **Dynamic Status Calculation:** Departments established in future years are dynamically labeled as `'Upcoming'` in historical sessions.
- **Contextual UI Notice Banners:** Color-coded banners when viewing historical or upcoming planning years.

### 4. Department Management & 360° Profile (Module 12)
- **Departments Directory:** Searchable and multi-filterable list with real-time HOD status, parent school, and faculty counts.
- **Department Profile:** 360-degree view featuring HOD Spotlight card, academic vision, faculty roster, and degree program offerings.
- **Automated Faculty Counts:** Synchronous recalculation of `faculty_count` on faculty addition, deletion, or department reassignment.

### 5. Constituent Schools & Degree Programs (Modules 11 & 13)
- **Schools & Institutes (Module 11):** Manage parent schools (SET, SBL, SOS, SDA, SLA, SEHD) with dean assignments and building locations.
- **Academic Programs (Module 13):** Catalog undergraduate (B.Tech, BBA, BCA, B.Arch), postgraduate (M.Tech, MBA, MCA), and doctorate (Ph.D.) offerings with intake capacities and durations.

### 6. Special Tools & Data Utilities
- **Live SQL Query Inspector:** Slide-out drawer displaying executed parameterized SQL statements, bound parameters, and latencies in milliseconds.
- **Universal Excel (.xlsx) Exporter:** Single-click client-side spreadsheet generation via SheetJS (`xlsx`) formatted for AICTE, UGC, NAAC, and NIRF audits.
- **Multi-Select Dropdown Filters:** Popovers with internal search, select-all/clear-all shortcuts, and active filter removal tags.
- **Sync DB Button:** Explicit synchronization trigger to refresh client state directly from PostgreSQL.

---

## 🗄️ Relational Database Schema

The database consists of **7 relational tables** defined in [`database/schema.sql`](database/schema.sql):

```
 ┌───────────────────────────┐
 │          SCHOOLS          │
 │  • id (PK)                │
 │  • school_name            │
 │  • school_code (UNIQUE)   │
 │  • dean_name              │
 └─────────────┬─────────────┘
               │ 1
               │ (ON DELETE SET NULL)
               ▼ N
 ┌───────────────────────────┐         1 (ON DELETE SET NULL)       ┌───────────────────────────┐
 │        DEPARTMENTS        │ ───────────────────────────────────► │          FACULTY          │
 │  • id (PK)                │ ◄─────────────────────────────────── │  • id (PK)                │
 │  • department_name        │     N (ON DELETE CASCADE)            │  • department_id (FK)     │
 │  • department_code(UNIQUE)│                                      │  • name, email (UNIQUE)   │
 │  • school_id (FK)         │                                      │  • password (bcrypt hash) │
 │  • hod_id (FK -> faculty) │                                      │  • designation, joining   │
 └─────────────┬─────────────┘                                      └───────────────────────────┘
               │ 1
               │ (ON DELETE CASCADE)
               ▼ N
 ┌───────────────────────────┐
 │         PROGRAMS          │
 │  • id (PK)                │
 │  • department_id (FK)     │
 │  • program_name           │
 │  • program_code (UNIQUE)  │
 │  • intake_capacity, years │
 └───────────────────────────┘
```

1. **`users`:** Administrators and Deans (`id`, `name`, `email`, `password`, `role`, `avatar_url`, `created_at`).
2. **`academic_sessions`:** Academic calendars (`id`, `session_name`, `term`, `start_date`, `end_date`, `status`, `is_current`).
3. **`schools`:** Constituent Institutes (SET, SBL, SOS, etc.) (`id`, `school_name`, `school_code`, `dean_name`, `building`).
4. **`departments`:** Core academic departments (`id`, `department_name`, `department_code`, `school_id`, `hod_id`, `email`, `phone`, `established_year`, `faculty_count`, `building`, `room_no`, `description`, `status`).
5. **`faculty`:** Academic teaching staff roster (`id`, `department_id`, `name`, `email`, `password`, `phone`, `designation`, `qualification`, `specialization`, `joining_date`, `experience_years`, `status`).
6. **`programs`:** Degree offerings (`id`, `department_id`, `program_name`, `program_code`, `degree_level`, `intake_capacity`, `duration_years`, `status`).
7. **`password_resets`:** OTP codes and reset tokens (`id`, `email`, `otp_code`, `reset_token`, `expires_at`, `used`).

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js:** v18.0 or higher
- **PostgreSQL:** v14.0 or higher running on port `5432` with database `nuv_department_db`

---

### Step 1: Clone & Configure Environment

1. Ensure PostgreSQL is running and create the database:
   ```sql
   CREATE DATABASE nuv_department_db;
   ```

2. Configure backend environment in `backend/.env`:
   ```env
   PORT=5000
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=postgres
   PGDATABASE=nuv_department_db
   JWT_SECRET=nuv_erp_department_management_secure_key_2026
   ```

---

### Step 2: Run with 1-Click Batch Script (Windows)

Double-click `start-all.bat` or run:
```cmd
start-all.bat
```

---

### Step 3: Run Manually (Separate Terminals)

**Terminal 1: Start Backend Server**
```bash
cd backend
npm install
npm run dev
```
*Backend runs at: `http://localhost:5000`*

**Terminal 2: Start Frontend Application**
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 🔑 Default Login Credentials

| Role | Email Address | Password | Scoped Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@nuv.ac.in` | `admin123` | Full access across all modules, Live SQL, Sync DB |
| **Dean of School (SET)** | `dean.set@nuv.ac.in` | `admin123` | University-wide observer, School directory, Excel exports |
| **Head of Dept (CSE HOD)** | `r.sharma@nuv.ac.in` | `admin123` | Scoped to manage Computer Science & Engineering |
| **Faculty Member (Professor)** | `amit.patel@nuv.ac.in` | `admin123` | Scoped to view department roster, edit self profile |

---

## 📁 Project Directory Structure

```
Department Management/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Department, Faculty, Program, School, Auth, Dashboard, Session
│   │   ├── db/                  # PostgreSQL pool connection & query logging
│   │   ├── middleware/          # RBAC & JWT authentication middleware
│   │   ├── routes/              # Express REST API routes
│   │   ├── services/            # Nodemailer SMTP email service
│   │   ├── utils/               # Bcrypt password hashing & JWT token helpers
│   │   └── server.js            # Express server initialization
│   ├── .env                     # Database & server environment configuration
│   └── package.json
├── database/
│   ├── schema.sql               # PostgreSQL DDL schema with foreign keys & indexes
│   └── seed.sql                 # Comprehensive initial dataset (Schools, Depts, Faculty, Programs)
├── frontend/
│   ├── src/
│   │   ├── components/          # Modals, Navbar, Sidebar, MultiSelect, SQL Inspector, Pagination
│   │   ├── pages/               # Dashboard, Departments, DepartmentProfile, Faculty, Schools, Programs, Login
│   │   ├── services/            # API client service & RBAC permissions helpers
│   │   ├── utils/               # SheetJS Excel (.xlsx) exporter
│   │   ├── App.jsx              # Main React application & state manager
│   │   └── index.css            # Dark glassmorphism design system tokens
│   ├── package.json
│   └── vite.config.js
├── USER_GUIDE.md                # Exhaustive Master User & Technical Manual (Markdown)
├── USER_GUIDE.html              # Printable / Interactive User Guide (Single-Page HTML)
├── README.md                    # Project overview & architecture guide
└── start-all.bat                # 1-click startup script for Windows
```

---

## 📜 License & Accreditation Note

Developed for **Navrachana University (NUV)** under Phase 2 of the Academic ERP Modernization Initiative. Designed in accordance with statutory academic accreditation guidelines (AICTE, UGC, NAAC, NIRF).
