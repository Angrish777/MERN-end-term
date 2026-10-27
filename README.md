# DevElevate

A MERN app that audits code snippets and résumés, then generates a GitHub README and a 60-second elevator pitch for a project.

## Stack

- MongoDB with Mongoose
- Express and Node.js (REST API, JWT in an httpOnly cookie)
- React with Vite, React Router and Axios

## Features

- Register, log in and log out with a JWT stored in an httpOnly cookie
- Static analysis engine for JavaScript, HTML, CSS and Markdown résumés (security, style and performance findings)
- Quality score, complexity rating and security risk level, with category filters and search
- Scan history stored in MongoDB with search, sort, pagination, reopen and delete
- Usage stats and a score trend chart
- README and pitch generator, saved per user
- Export reports as Markdown, copy to clipboard, or save as PDF through the print dialog

## Project structure

```
backend/
  index.js
  controllers/  models/  routes/  middlewares/  utils/
frontend/
  vite-project/
    src/  vite.config.js  vercel.json
```

## Run locally

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend/vite-project
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

## API

| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | /api/auth/register | Create an account |
| POST | /api/auth/login | Log in |
| POST | /api/auth/logout | Log out |
| GET | /api/auth/me | Current user |
| POST | /api/scans | Run and save an audit |
| GET | /api/scans | List scans (search, sort, page, limit, kind) |
| GET | /api/scans/stats | Aggregate stats |
| GET | /api/scans/:scanId | Get one scan |
| DELETE | /api/scans/:scanId | Delete a scan |
| POST | /api/pitches | Generate and save a README and pitch |
| GET | /api/pitches | List saved pitches |
| DELETE | /api/pitches/:pitchId | Delete a pitch |
| GET | /health | Health check |

## Environment variables

Backend: `dbURL`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV`.
Frontend: `VITE_API_URL`.

## Deployment

Frontend on Vercel (root directory `frontend/vite-project`), backend on Render (root directory `backend`), database on MongoDB Atlas.

Live frontend: add your Vercel URL here
Live backend: add your Render URL here
