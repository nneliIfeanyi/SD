# Static frontend

Place this directory at `events/` inside the existing site's publish directory.
The login page is available at `/events/`; application pages are static files
under `pages/`.

The event app can be installed as **Event Management** from a supported
browser's install menu (on iOS, use Share > Add to Home Screen). Installation
requires HTTPS, or localhost for development. The installed app opens at the
event login page. An internet connection is still required for authentication
and event data; the existing offline page is shown when navigation fails.
When a supporting browser offers installation, the app may show an install
dialog every five page loads. It stops after installation or when running as an
installed app. Browsers without an install-prompt API, including iOS Safari,
use their own installation menu instead.

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

The Registration page links to WhatsApp Invitations for Super Admin,
Registration and Attendance roles. It defaults to an open event using the same
selection logic as Registration, and staff can select any other event. Save an
optional group invite link and local country code per event; these settings are
shared with authorized staff across devices. Use Reload settings to discard
local edits or retrieve changes made by another user. The country code applies
to phone numbers starting with 0; international numbers should include their
country code. Use Open WhatsApp to prepare an individual message.
Staff must check consent and manually mark invitations and confirmed group
membership; opening WhatsApp does not send a message or change the status.
The list shows up to 15 registrations per page. Search and invitation-status
filters cover the entire selected event; the status counts remain event-wide.

Deploy the corresponding API changes and apply
`database/whatsapp_invitations.sql` and `database/whatsapp_event_settings.sql`
in the separate API project to existing databases before using this page.
The tracking status and its last editor are shared between authorized users.
Group membership is not verified by the app.
