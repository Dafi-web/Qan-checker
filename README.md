# QAN Checker

MERN app for Quality Alert Notice (QAN) serial checks.

- **Operators** enter a serial number on the home page.
- If the serial is on an active QAN list → **Do not ship — send back to CM**.
- If not listed → **Good to ship**.
- **Admins** log in to create QANs and manage serial number lists.

## Requirements

- Node.js 18+
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/qan-checker`)

## Setup

```bash
cd qan-checker
npm run install:all
npm run seed
```

Default admin (from `backend/.env`):

- Username: `admin`
- Password: `admin123`

## Run

Start MongoDB, then:

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:5001  

## Usage

1. Open **Admin** → sign in → create a QAN and paste serial numbers (one per line).
2. Open the home page → enter a serial → see ship / do-not-ship result.

## Project structure

```
qan-checker/
  backend/     Express + MongoDB API
  frontend/    React (Vite) UI
```
