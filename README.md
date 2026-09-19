# MELO Test Case Generation Studio

Full-stack Test Case Generation wizard (light theme): register/login, per-user projects, associate local `.txt`/`.md` context, design options, then Gemini-generated workflows, rules, user stories, and test cases. Export selected cases as CSV.

## Stack

- **Frontend:** React 18, Vite, Redux Toolkit, React Router
- **Backend:** Node.js, Express, JWT httpOnly cookie
- **Database:** MongoDB + Mongoose
- **AI:** Google Gemini JSON (`@google/genai`)

## Setup

```bash
cd server && npm install
cd ../client && npm install
cp .env.example .env
```

Set `GEMINI_API_KEY`, `JWT_SECRET`, and Atlas `MONGODB_USERNAME` / `MONGODB_PASSWORD` in the root `.env`.

```bash
cd server && npm run dev
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Register, then walk Home → name → context → design → generate → review → export.

## Environment

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Fallback URI |
| `MONGODB_USERNAME` / `MONGODB_PASSWORD` / `MONGODB_HOST` / `MONGODB_DB` | Atlas |
| `PORT` | API port (5000) |
| `CLIENT_ORIGIN` | CORS origin (credentials enabled) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Server-side Gemini |
| `JWT_SECRET` | Signs the login cookie |

## Architecture

```
browser  --cookie-->  Express  -->  Gemini
                         |
                         +--> MongoDB (users + sessions)
```

Sessions, uploaded context, and generated artifacts are scoped to `userId`. List/get/update/delete/generate/export all require the owner.

## Auth API

| Method | Path |
| --- | --- |
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| GET | `/api/auth/me` |
| PATCH | `/api/auth/password` |

## Session API (logged-in)

| Method | Path |
| --- | --- |
| POST/GET | `/api/sessions` |
| GET/PATCH/DELETE | `/api/sessions/:id` |
| POST | `/api/sessions/:id/files` |
| POST | `/api/sessions/:id/generate` and `/regenerate` |
| GET | `/api/sessions/:id/export.csv` |
