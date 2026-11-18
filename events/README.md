# Static frontend

Place this directory at `events/` inside the existing site's publish directory.
The login page is available at `/events/`; application pages are static files
under `pages/`.

`config.js` selects the API URL by the current hostname. Localhost and loopback
hosts use `http://localhost/SD-api`; all other hosts use
`https://api.leadstar.com.ng/SD`. These URLs are API document roots, with any
required deployment path prefix included. The frontend appends routes such as
`/auth/me.php` and `/events/index.php`.

The API allows credentialed CORS requests from `http://localhost` and
`https://sulejadisciples.com` (the `/SD` path is not part of the browser
origin). The browser sends session requests with `credentials: 'include'`.
Because the production frontend and API are on different sites, the API's
session cookie must use `SameSite=None; Secure`.

Role-based page and navigation checks run in frontend JavaScript and are for
navigation only. The API remains responsible for enforcing authentication and
permissions.

Protected pages show a full-page skeleton while the session is verified, then
use section-level skeleton placeholders while API data loads.

Registrations are automatically recorded as present for Day 1 of every event.
Multi-day events continue to require separate check-in for each later day.

Super Admins can create, edit, assign one of the four fixed roles to, and
permanently delete user accounts from Settings. The API prevents self-deletion
and removal or deactivation of the last active Super Admin.

The Registration page defaults to an open event that is currently underway,
or the nearest upcoming open event when none is underway.
