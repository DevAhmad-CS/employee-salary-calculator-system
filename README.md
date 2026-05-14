# Employee Salary Calculator System

A full-stack web application for managing employees, compensation components (allowances, deductions, bonuses), salary slips, and reports—with role-based access and JWT authentication.

## Features

- Employee CRUD and related payroll data
- Allowances, deductions, and bonuses per employee
- Salary slip generation and history
- Monthly and annual reporting
- Dashboard summaries and analytics-oriented endpoints
- User authentication (JWT) and profile flows
- Email-related integrations configurable via environment (SMTP / optional providers)

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 19, TypeScript, Vite, React Router, Zustand, Axios, Zod, React Hook Form |
| **Backend** | Node.js, Express 5, TypeScript, PostgreSQL (`pg`), JWT, bcrypt, Helmet, CORS |
| **Architecture** | Clean Architecture on the backend (domain, application, infrastructure) |

## Folder structure

```
employee-salary-system/
├── backend/           # REST API (Express + TypeScript)
│   ├── src/           # domain, application, infrastructure
│   ├── scripts/       # maintenance / utility scripts
│   └── .env.example   # template for local configuration (safe to commit)
├── frontend/          # SPA (Vite + React)
│   └── .env.example   # template for API base URL (safe to commit)
├── DB/                # schema.sql (structure) + demo_seed.sql (safe demo data)
└── documentation/     # Extended project documentation
```

> **`mid/` and `plan/`** are excluded from version control via the root `.gitignore` by project choice. If you need them, remove those lines locally.

## Local setup

### Prerequisites

- Node.js (current LTS recommended)
- PostgreSQL

### Database

1. Create a database (e.g. `employee_salary_system`).
2. Create tables from the public schema file, then load the safe demo dataset:

   ```bash
   psql -U postgres -d employee_salary_system -f DB/schema.sql
   psql -U postgres -d employee_salary_system -f DB/demo_seed.sql
   ```

   The original full database dump (`DB/PostgreSQLDB.sql`) is **not** part of the public repo—it may contain real data and is excluded for privacy. Use only `schema.sql` + `demo_seed.sql` for GitHub and live demos.

3. **Demo logins** (password for all: **`Demo123!`**): `demo_admin`, `demo_hr`, `demo_accountant`, `demo_management`, `demo_employee`. Change or remove these in production.

4. Copy `backend/.env.example` to `backend/.env` and set **`DB_*`** and other variables for your machine.

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, CORS origin, etc.
npm install
npm run dev
```

Default API layout uses `/api` routes; set **`PORT`** in `backend/.env` (see `.env.example`). Use the same host/port in **`VITE_API_URL`** on the frontend (include `/api` if your app expects it, e.g. `http://localhost:<port>/api`).

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your running API (must match backend port and path)
npm install
npm run dev
```

## Security note

Real environment files (**`backend/.env`**, **`frontend/.env`**, and any local **`.env.*`**) are **not** committed. Only **`.env.example`** files (placeholders) belong in Git. Never commit secrets, database passwords, JWT signing keys, or SMTP/API credentials.

## Author

**Ahmad Mahmoud**
