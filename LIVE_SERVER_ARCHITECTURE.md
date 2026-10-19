# ☁️ Live Server & Cloud Architecture Guide
## LJ University ERP — Department Management System

---

## 📑 Table of Contents
1. [Live Cloud Overview & URLs](#1-live-cloud-overview--urls)
2. [The 3 Cloud Hosting Pillars](#2-the-3-cloud-hosting-pillars)
3. [End-to-End Live Request Flow](#3-end-to-end-live-request-flow)
4. [Local vs. Live Production Comparison](#4-local-vs-live-production-comparison)
5. [Database Cloud Architecture (Neon PostgreSQL)](#5-database-cloud-architecture-neon-postgresql)
6. [Backend API Cloud Architecture (Render Web Service)](#6-backend-api-cloud-architecture-render-web-service)
7. [Frontend Cloud Architecture (Vercel Edge Network)](#7-frontend-cloud-architecture-vercel-edge-network)
8. [Speech / Presentation Script (How to Explain to Evaluators)](#8-speech--presentation-script-how-to-explain-to-evaluators)
9. [Continuous Deployment (CI/CD) Workflow](#9-continuous-deployment-cicd-workflow)

---

## 1. Live Cloud Overview & URLs

The Department Management System is deployed across a decoupled 3-tier cloud infrastructure:

| Tier | Component | Cloud Platform | Live Production URL |
| :--- | :--- | :--- | :--- |
| **Presentation Tier** | React 19 Frontend SPA | **Vercel** | [https://department-management-nsts7zbfi-rajal1.vercel.app](https://department-management-nsts7zbfi-rajal1.vercel.app) |
| **Application Tier** | Node.js / Express API | **Render** | [https://nuv-department-api.onrender.com/api/health](https://nuv-department-api.onrender.com/api/health) |
| **Persistence Tier** | Serverless PostgreSQL 16 | **Neon** | `ep-holy-wave-b3fspyik-pooler...` (SSL Port 5432) |

---

## 2. The 3 Cloud Hosting Pillars

```mermaid
graph TD
    subgraph VercelHost ["1. FRONTEND: Vercel Edge Network"]
        VercelCDN["React 19 SPA (Vite Bundle)"]
        VercelEnv["VITE_API_URL pointing to Render"]
    end

    subgraph RenderHost ["2. BACKEND: Render Web Service"]
        RenderApp["Express.js REST API Server"]
        RenderAuth["JWT Auth & RBAC Guard"]
        RenderPool["pg.Pool Connection Pooler"]
    end

    subgraph NeonHost ["3. DATABASE: Neon Serverless PostgreSQL"]
        NeonDB["PostgreSQL 16 Engine"]
        NeonTables["Schools, Depts, Faculty, Programs, Users, Sessions"]
    end

    VercelCDN -->|"HTTPS REST API (Bearer JWT)"| RenderApp
    RenderApp --> RenderAuth
    RenderAuth --> RenderPool
    RenderPool -->|"Encrypted TCP/SSL (Port 5432)"| NeonDB
```

---

## 3. End-to-End Live Request Flow

When an end-user performs an action on the live website (such as logging in or creating a department):

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 End User (Browser / Mobile)
    participant Vercel as 🌐 VERCEL (Frontend CDN)
    participant Render as ⚙️ RENDER (Express API)
    participant Neon as 🗄️ NEON (PostgreSQL Cloud)

    User->>Vercel: 1. Navigates to https://your-app.vercel.app (HTTPS)
    Vercel-->>User: Delivers compiled React 19 HTML, CSS & JavaScript
    User->>Render: 2. Sends REST API call (e.g., POST /api/auth/login with JSON body)
    Note over Render: Express middleware verifies JWT token & user permissions
    Render->>Neon: 3. Executes parameterized SQL query over SSL (Port 5432)
    Neon-->>Render: 4. Returns query records / rows in JSON format
    Render-->>User: 5. Sends HTTP 200 OK + JSON Response payload
    Note over User: React updates state & re-renders UI instantly with zero page reload
```

---

## 4. Local vs. Live Production Comparison

| Attribute | Local Development (Laptop) | Live Production (Cloud) |
| :--- | :--- | :--- |
| **Frontend Location** | `http://localhost:5173` | `https://department-management...vercel.app` |
| **Frontend Host** | Vite Development Server | **Vercel** Global Edge CDN |
| **Backend Location** | `http://localhost:5000` | `https://nuv-department-api.onrender.com` |
| **Backend Host** | Local Node.js Process | **Render** Linux Cloud Container (Singapore) |
| **Database Location** | `localhost:5432` (`nuv_department_db`) | **Neon** Cloud PostgreSQL (`neondb`) |
| **Database Connection**| Direct TCP (Plain / Unencrypted) | Encrypted SSL/TLS (`sslmode=require`) |
| **Security Protocol** | HTTP | Full HTTPS / TLS 1.3 |
| **Continuous Delivery**| Manual Terminal Restart | Automated on `git push origin main` |

---

## 5. Database Cloud Architecture (Neon PostgreSQL)

* **Provider:** Neon Serverless Cloud
* **Engine:** PostgreSQL 16 (Relational Database Management System)
* **Physical Datacenter:** AWS Asia-Pacific (Singapore Region)
* **Connection Security:** Enforced SSL encryption (`sslmode=require` & `channel_binding=require`).
* **Connection Pooler:** Built-in PgBouncer pooling on port `5432` for high concurrency.
* **Point-in-Time Backups:** Automated continuous snapshots with branchable state recovery.

### Relational Tables Stored in Neon:
1. `schools` — Parent Institutes (SET, SBL, SEDA, SLAE, SOS)
2. `departments` — Academic departments with HOD assignments & room numbers
3. `faculty` — Professor profiles, designations, joining dates, specializations
4. `programs` — Degree catalogs (B.Tech, M.Tech, MBA, Ph.D.) with intake capacities
5. `academic_sessions` — Session lifecycle tracking (`2024–25` to `2027–28`)
6. `users` — Administrator & Dean accounts with Bcrypt password hashing
7. `password_resets` — OTP codes and cryptographic recovery tokens

---

## 6. Backend API Cloud Architecture (Render Web Service)

* **Provider:** Render.com
* **Runtime:** Node.js 18+ inside a containerized Linux environment
* **Port Configuration:** Render maps internal port `10000` to public HTTPS
* **Root Directory:** `backend`
* **Environment Variables Configured on Render:**
  * `NODE_ENV`: `production`
  * `PORT`: `10000`
  * `DATABASE_URL`: `postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require`
  * `DATABASE_SSL`: `true`
  * `JWT_SECRET`: Secure encryption secret key
* **Health Endpoint:** `GET /api/health` returns status `online` and `dbMode: POSTGRES`.

---

## 7. Frontend Cloud Architecture (Vercel Edge Network)

* **Provider:** Vercel
* **Framework Preset:** Vite + React 19
* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Routing Configuration (`vercel.json`):**
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
  *(Ensures that refreshing subpages like `/departments` or `/faculty` routes back to `index.html` without 404 errors).*

---

## 8. Speech / Presentation Script (How to Explain to Evaluators)

If you are asked in a viva, interview, or presentation to explain **how the project is hosted and running**, you can say:

> *"Our Department Management System is built using a modern, fully decoupled 3-tier cloud architecture:*
> 
> * **1. Presentation Layer (Frontend):** Our React 19 Single Page Application is deployed on **Vercel's Global Edge Network**, ensuring fast loading and responsive UI with client-side Excel exporting.
> * **2. Application Layer (Backend):** Our REST API is built with Node.js and Express, containerized on **Render** in Singapore. It handles JWT authentication, Role-Based Access Control (RBAC), and parameterized SQL execution.
> * **3. Persistence Layer (Database):** All relational records are securely managed in a **Neon Serverless PostgreSQL** cluster over encrypted SSL with connection pooling.
> 
> *Every user action in the browser triggers a secure HTTPS REST call to Render, which executes optimized SQL queries directly on Neon PostgreSQL and returns real-time JSON responses."*

---

## 9. Continuous Deployment (CI/CD) Workflow

```mermaid
graph LR
    Dev[💻 Developer Laptop\nLocal Git Repo] -->|"git push origin main"| GitHub[🐙 GitHub Repository\nrajal200218/department-management]
    GitHub -->|"Auto Webhook Trigger"| Vercel[🌐 Vercel Build Pipeline\nDeploys Frontend in 30s]
    GitHub -->|"Auto Webhook Trigger"| Render[⚙️ Render Build Pipeline\nDeploys Backend in 60s]
```

1. You edit code locally and test it on your machine.
2. You run `git add .`, `git commit -m "..."`, and `git push origin main`.
3. **GitHub** immediately notifies both **Vercel** and **Render**.
4. Both platforms automatically rebuild and deploy your changes with zero downtime!

---

*Document prepared for LJ University ERP Engineering Team.*
