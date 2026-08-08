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
- MongoDB (default: `mongodb://127.0.0.1:27017/qan-checker`)

## Setup

```bash
npm run install:all
npm run seed
npm run dev
```

Default admin: `admin` / `admin123`

- App: http://localhost:5173  
- API: http://localhost:5001  

## Flow

1. Admin signs in → **Admin console** → create QANs and **Grant access** to shippers.
2. Shipper signs in → **Home** → pick QAN → paste serials → check.
