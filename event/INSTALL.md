# Installation Guide – Event Management Dashboard

## Requirements

- PHP 8.0 or higher (with PDO MySQL extension)
- MySQL 8.0+ or MariaDB 10.5+
- Apache / Nginx (with mod_rewrite recommended for Apache)
- Modern browser

## Step 1 – Place Files

Copy the entire `event-dashboard` folder into your web root, e.g.:

- XAMPP / WAMP: `htdocs/event-dashboard`
- Linux: `/var/www/html/event-dashboard`
- Or configure a virtual host pointing to the folder

## Step 2 – Database

1. Create a database:

```sql
CREATE DATABASE event_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import the schema:

```bash
mysql -u root -p event_dashboard < database/schema.sql
```

Or use phpMyAdmin → Import → select `database/schema.sql`.

The schema includes:
- All tables
- Roles
- Demo users
- Sample organization
- 3 sample events + attendance days

## Step 3 – Configuration

Edit `config/constants.php`:

```php
define('APP_URL', 'http://localhost/event-dashboard');  // ← change to your URL
```

Edit `config/database.php` (or set environment variables):

```php
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'event_dashboard');
define('DB_USER', 'root');
define('DB_PASS', '');          // your MySQL password
```

Alternatively set:

```
DB_HOST, DB_NAME, DB_USER, DB_PASS, APP_URL
```

## Step 4 – Permissions

Make the uploads directories writable:

```bash
chmod -R 755 uploads
# or on some hosts:
chmod -R 775 uploads
```

## Step 5 – Open the App

Visit:

```
http://localhost/event-dashboard
```

You will be redirected to the login page.

### Demo Accounts

| Username       | Password   | Role                 |
|----------------|------------|----------------------|
| superadmin     | Admin@123  | Super Admin          |
| regofficer     | Admin@123  | Registration Officer |
| attofficer     | Admin@123  | Attendance Officer   |
| reportofficer  | Admin@123  | Reports Officer      |

> On first login with `Admin@123` the password hash is refreshed automatically.

## Apache Notes

The included `.htaccess` protects config/includes/database folders and adds basic security headers. Ensure `AllowOverride All` is set for the directory.

## Nginx Notes

Add appropriate `location` blocks to deny access to `/config`, `/includes`, `/database` and route PHP correctly.

## Production Checklist

- [ ] Change all demo passwords
- [ ] Set strong `DB_PASS`
- [ ] Use HTTPS and set `secure` cookie flag
- [ ] Restrict CORS in `config/cors.php`
- [ ] Disable error display (`display_errors = Off`)
- [ ] Regular database backups
- [ ] Set proper file upload limits in PHP

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank page | Check PHP error log; ensure PDO MySQL is installed |
| 401 / redirect loop | Clear cookies; verify `APP_URL` matches actual URL |
| Database error | Verify credentials and that schema was imported |
| Charts not showing | Check browser console; Chart.js is loaded via CDN |

---

You are ready to manage events!
