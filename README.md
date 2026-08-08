# QAN Checker

Professional MERN app for Quality Alert Notice (QAN) serial checks.

## Two experiences

| Area | Who | URL |
|------|-----|-----|
| **Home (shipper)** | Shippers | `/` — select a QAN, paste up to 100 serials, verify before shipping |
| **Admin console** | Admins | `/admin` — manage QANs, grant/revoke user access |

Home page is shipper-only. Admin tools never appear there.

## Requirements

- Node.js 18+
- MongoDB (local or Atlas)

## Local setup

```bash
npm run install:all
# set backend/.env MONGODB_URI
npm run seed
npm run dev
```

Default admin: `admin` / `admin123`

- App: http://localhost:5173  
- API: http://localhost:5001  

## Vercel deploy

1. Import the GitHub repo in Vercel (root of repo).
2. Add **Environment Variables**:
   - `MONGODB_URI` — your Atlas connection string (include `/qan-checker`)
   - `JWT_SECRET` — long random string
3. Deploy. `vercel.json` builds the frontend and routes `/api/*` to the Express serverless function.
4. Seed admin once (from your machine against Atlas):

```bash
cd backend
# MONGODB_URI already in .env pointing at Atlas
npm run seed
```

## Flow

1. Admin signs in → **Admin console** → create QANs and **Grant access** to shippers.
2. Shipper signs in → **Home** → pick QAN → paste serials → check.
