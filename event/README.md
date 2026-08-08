# Event Management Admin Dashboard

A complete, production-ready **Event Registration & Participant Management System** for religious organizations (or any organization) that runs multiple events per year.

Built as **one scalable system** — events are dynamic (created from the database). Add new events anytime without changing code.

---

## Features

- **Authentication** with role-based access (Super Admin, Registration Officer, Attendance Officer, Reports Officer)
- **Dashboard** with live stats, charts (Chart.js), recent activity
- **Event Management** – full CRUD, status control, multi-day support
- **Participant Management** – master records reusable across events
- **Registration** – auto-generated registration numbers, duplicate prevention
- **Attendance** – check-in / check-out for single-day and multi-day events
- **Reports** – gender, state, event participation, CSV export
- **Settings** – organization profile, theme
- **Responsive** professional UI (Bootstrap 5) with light/dark mode
- **Secure** – prepared statements, password hashing, session protection, CSRF tokens, role middleware

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML5, Bootstrap 5, Vanilla JS (ES Modules), Chart.js, Bootstrap Icons |
| Backend   | PHP 8+, REST-style JSON APIs, PDO   |
| Database  | MySQL 8+ / MariaDB 10.5+            |

---

## Quick Start

See **INSTALL.md** for full installation steps.

1. Create MySQL database `event_dashboard`
2. Import `database/schema.sql`
3. Configure `config/constants.php` and `config/database.php` (or use environment variables)
4. Point your web server document root (or virtual host) to the `event-dashboard` folder
5. Open the app in browser → Login

**Demo login:** `superadmin` / `Admin@123`

---

## Folder Structure

```
event-dashboard/
├── api/                  # REST API endpoints
├── assets/css|js|img     # Frontend assets
├── config/               # DB, auth, constants
├── database/             # schema.sql
├── includes/             # Shared layout (header, sidebar, footer)
├── pages/                # UI pages
├── uploads/              # Event banners, participant photos, logo
├── index.php
├── .htaccess
├── README.md
└── INSTALL.md
```

---

## Roles & Permissions

| Module        | Super Admin | Registration | Attendance | Reports |
|---------------|:-----------:|:------------:|:----------:|:-------:|
| Dashboard     | ✓           | ✓            | ✓          | ✓       |
| Events        | ✓           | ✓            |            |         |
| Participants  | ✓           | ✓            |            |         |
| Registration  | ✓           | ✓            |            |         |
| Attendance    | ✓           | ✓            | ✓          |         |
| Reports       | ✓           | ✓            |            | ✓       |
| Settings      | ✓           |              |            |         |

---

## API Overview

All endpoints return JSON: `{ "success": true|false, "message": "...", "data": ... }`

- `POST /api/auth/login.php`
- `POST /api/auth/logout.php`
- `GET  /api/auth/me.php`
- `GET|POST /api/events/index.php`
- `GET|PUT|DELETE /api/events/single.php?id=`
- `GET|POST /api/participants/index.php`
- `GET|PUT|DELETE /api/participants/single.php?id=`
- `GET|POST /api/registration/index.php`
- `GET|POST /api/attendance/index.php`
- `GET /api/reports/index.php?type=summary|gender|state|...`
- `GET|PUT /api/settings/organization.php`

---

## License

For internal / organizational use. Customize as needed.
