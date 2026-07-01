# SkillsNJobs

A full-stack skills-to-career platform: candidates discover jobs ranked by AI-style skill match scoring,
employers post roles and review applicants, and trainers publish courses that close candidates' skill gaps.

**Stack:** React (Vite) frontend + Node/Express API + SQLite (file-based, zero setup) database, JWT auth.

> This project was built in a sandbox without internet access, so dependencies could not be pre-installed
> or test-run here. The code is complete and ready to run — just follow the steps below on a machine with
> internet access (for the one-time `npm install`).

## 1. Backend (API)

```bash
cd server
npm install
cp .env.example .env     # edit JWT_SECRET if you like
npm start                 # runs on http://localhost:4000
```

On first run, `server/data/skillsnjobs.db` is created automatically and seeded with demo accounts:

| Role      | Email                     | Password     |
|-----------|----------------------------|--------------|
| Candidate | aisha@example.com          | password123  |
| Candidate | rahul@example.com          | password123  |
| Employer  | hr@technova.com             | password123  |
| Trainer   | trainer@skillbridge.in      | password123  |
| Admin     | admin@skillsnjobs.in        | password123  |

Two demo jobs and three demo courses are also seeded so the match-scoring and recommendation
features have data to work with immediately.

## 2. Frontend (web app)

In a second terminal:

```bash
cd client
npm install
npm run dev                # runs on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:4000`, so just open
`http://localhost:5173` and sign in with one of the demo accounts above (or register a new one).

For production, `npm run build` in `client/` outputs static files in `client/dist/` that can be
served by any static host or by Express itself.

## What's included

- **Auth** — register/login as Candidate, Employer, or Trainer; JWT-based sessions.
- **Jobs** — employers post/edit/close roles with required skills, salary range, location;
  candidates browse and search, and every listing shows a live **match score** computed from
  their profile skills + experience.
- **Applications** — candidates apply with one click; employers see ranked applicants per job
  and move them through Applied → Shortlisted → Interview → Hired/Rejected.
- **Courses** — trainers publish courses tagged by skill; candidates enroll. A recommendation
  endpoint cross-references open jobs' required skills against the candidate's own skills to
  surface the **biggest skill gaps** and the courses that close them.
- **Candidate pool** — employers/admins can browse all registered candidates and their profiles.
- **Dashboard** — role-aware KPIs and quick links for every user type.

## Project structure

```
server/
  src/
    db.js              # SQLite schema + demo seed data
    match.js            # skill-match scoring logic
    middleware/auth.js   # JWT auth + role guard
    routes/              # auth, users, jobs, applications, courses
    index.js             # Express app entry
client/
  src/
    api.js               # fetch wrapper for the REST API
    context/AuthContext.jsx
    components/Navbar.jsx
    pages/                # Login, Register, Dashboard, Jobs, JobDetail,
                           # MyJobs, Applications, Courses, Candidates, Profile
    styles.css            # design tokens shared across the app
```

## Notes on the matching algorithm

`server/src/match.js` scores a candidate against a job's required skills:

```
score = (matched skills / required skills) * 100 * 0.85 + min(experience_years, 5) * 2
```

This is intentionally simple and explainable rather than a black box — it rewards skill overlap
first, with a small bonus for relevant experience, capped at 100. It's a good starting point to
later swap in a more sophisticated model (e.g. weighted skills, semantic skill matching, or an
actual ML/embedding-based ranker) without changing any other part of the app.
