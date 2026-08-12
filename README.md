# Doxa HRMS

Doxa HRMS is a modern, comprehensive Human Resource Management System built to simplify HR operations, payroll, and recruitment. Designed specifically with localized rules (like Ethiopian Payroll Regulations) in mind, Doxa offers a seamless experience for both HR administrators and employees.

## 🚀 Features

- **Employee Management:** Complete lifecycle management, profiles, and role assignments.
- **Advanced Payroll System:** 
  - Automated dynamic calculations for basic salary, allowances, overtime, bonuses, and deductions.
  - Built-in compliance with Ethiopian progressive income tax and pension contribution regulations.
  - Interactive payroll sheets, draft saving, and CSV exports.
  - Fully customizable tax brackets and rates directly from the UI.
- **Recruitment & Applicant Tracking:** Public job posting board and candidate tracking pipeline.
- **Leave & Attendance:** Track daily attendance, manage leave requests, and monitor balances.
- **Performance Management:** Track reviews, KPIs, and appraisals.
- **Role-Based Access Control:** Secure, robust authentication and authorization.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios

### Backend (API)
- **Framework:** [Laravel](https://laravel.com/) (PHP)
- **Database:** MySQL / PostgreSQL / SQLite (configured via `.env`)
- **Authentication:** Laravel Sanctum (Token-based)
- **Features:** Eloquent ORM, RESTful Controllers, automated database Seeders & Migrations.

## 📂 Project Structure

```
doxa-hrms/
├── backend/            # Laravel API application
│   ├── app/            # Models, Controllers, Middleware, Services
│   ├── routes/         # API routes (api.php)
│   ├── database/       # Migrations, Seeders, and Factories
│   └── config/         # Laravel configurations
└── frontend/           # Next.js Application
    ├── app/            # App Router (Pages, Layouts)
    ├── components/     # Reusable UI components
    ├── services/       # API interaction logic (Axios calls)
    └── public/         # Static assets
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- PHP (v8.1+)
- Composer
- A supported SQL database (MySQL/PostgreSQL)

### 1. Backend Setup (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Set up environment variables
cp .env.example .env
php artisan key:generate

# Configure your database in the .env file, then run migrations and seed the database
php artisan migrate --seed

# Start the local development server
php artisan serve
# (Runs on http://localhost:8000)
```

**Demo Credentials:**
The `UserSeeder` automatically provisions a default HR Admin user for testing:
- **Email:** `admin@doxa.com`
- **Password:** `SecurePass123`

### 2. Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install
# or yarn install / pnpm install

# Start the local development server
npm run dev
# (Runs on http://localhost:3000)
```
Ensure your frontend `.env.local` is configured to point `NEXT_PUBLIC_API_URL` to your Laravel backend (default: `http://localhost:8000`).

## 📜 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
