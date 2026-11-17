# Static frontend

Place this directory at `events/` inside the existing site's publish directory.
The login page is available at `/events/`; application pages are static files
under `pages/`.

Before deploying, edit `config.js` and set `window.APP_API_URL` to the API
origin, for example `https://api.your-domain.example`. Use the API document
root as the origin; do not append `/api` or a path segment. The frontend calls
API-root routes such as `/auth/me.php` and `/events/index.php`.

The API must allow credentialed CORS requests from the deployed frontend
origin. The browser sends session requests with `credentials: 'include'`;
cross-origin cookie and same-site settings must be compatible with the
frontend and API domains.

Role-based page and navigation checks run in frontend JavaScript and are for
navigation only. The API remains responsible for enforcing authentication and
permissions.
