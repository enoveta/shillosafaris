# Shilo Safaris local setup

## Requirements

- Node.js 20.19+ or 22.12+
- PostgreSQL 14+ for storing enquiries

## Configure the backend

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL database named `shilo_safaris` (or update `DATABASE_URL` to use an existing database).
3. Set `DATABASE_URL`, `ADMIN_PASSWORD`, and `JWT_SECRET` in `.env`. Use a long, unique admin password and a random JWT secret. Do not commit `.env`.
4. Start the app with `npm run dev:all`.

The API creates its enquiry, site-content, and visit tables on startup, and seeds the current services, destinations, About, and Contact copy once. The public site has built-in defaults, but saving enquiries or dashboard changes requires a valid database connection and server credentials.

## Open the site

- Website: `http://localhost:5173`
- Separate content dashboard: `http://localhost:5173/dashboard`
- API health: `http://localhost:3001/api/health`

The dashboard manages services, destinations, About/Contact copy, enquiry statuses, and anonymous page-visit counts. Visit tracking stores only the page path and timestamp, not IP addresses. `/admin` redirects to `/dashboard`. Vite proxies `/api` requests to the Express server during development.
