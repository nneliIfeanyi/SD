# Event Management Admin Dashboard

A complete, production-ready **Event Registration & Participant Management System** for religious organizations (or any organization) that runs multiple events per year.

Built as **one scalable system** â€” events are dynamic (created from the database). Add new events anytime without changing code.

---

## Features

- **Authentication** with role-based access (Super Admin, Registration Officer, Attendance Officer, Reports Officer)
- **Dashboard** with live stats, charts (Chart.js), recent activity
- **Event Management** â€“ full CRUD, status control, multi-day support
- **Participant Management** â€“ master records reusable across events
- **Registration** â€“ auto-generated registration numbers, duplicate prevention
- **Attendance** â€“ check-in / check-out for single-day and multi-day events
- **Reports** â€“ gender, state, event participation, CSV export
- **Settings** â€“ organization profile, theme
- **Responsive** professional UI (Bootstrap 5) with light/dark mode
- **Secure** â€“ prepared statements, password hashing, session protection, CSRF tokens, role middleware

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
5. Open the app in browser â†’ Login

**Demo login:** `superadmin` / `Admin@123`

---

## Folder Structure

```
event-dashboard/
â”œâ”€â”€ api2/                  # REST API endpoints
â”œâ”€â”€ assets/css|js|img     # Frontend assets
â”œâ”€â”€ config/               # DB, auth, constants
â”œâ”€â”€ database/             # schema.sql
â”œâ”€â”€ includes/             # Shared layout (header, sidebar, footer)
â”œâ”€â”€ pages/                # UI pages
â”œâ”€â”€ uploads/              # Event banners, participant photos, logo
â”œâ”€â”€ index.php
â”œâ”€â”€ .htaccess
â”œâ”€â”€ README.md
â””â”€â”€ INSTALL.md
```

---

## Roles & Permissions

| Module        | Super Admin | Registration | Attendance | Reports |
|---------------|:-----------:|:------------:|:----------:|:-------:|
| Dashboard     | âœ“           | âœ“            | âœ“          | âœ“       |
| Events        | âœ“           | âœ“            |            |         |
| Participants  | âœ“           | âœ“            |            |         |
| Registration  | âœ“           | âœ“            |            |         |
| Attendance    | âœ“           | âœ“            | âœ“          |         |
| Reports       | âœ“           | âœ“            |            | âœ“       |
| Settings      | âœ“           |              |            |         |

---

## API Overview

All endpoints return JSON: `{ "success": true|false, "message": "...", "data": ... }`

- `POST /api2/auth/login.php`
- `POST /api2/auth/logout.php`
- `GET  /api2/auth/me.php`
- `GET|POST /api2/events/index.php`
- `GET|PUT|DELETE /api2/events/single.php?id=`
- `GET|POST /api2/participants/index.php`
- `GET|PUT|DELETE /api2/participants/single.php?id=`
- `GET|POST /api2/registration/index.php`
- `GET|POST /api2/attendance/index.php`
- `GET /api2/reports/index.php?type=summary|gender|state|...`
- `GET|PUT /api2/settings/organization.php`

---

## License

For internal / organizational use. Customize as needed.

