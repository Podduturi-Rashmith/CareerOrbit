<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CareerOrbit

A Next.js 15 career platform powered by Google Gemini AI, with MongoDB for persistence and full auth flows.

**Team:** [@Tharun-de](https://github.com/Tharun-de) · [@Podduturi-Rashmith](https://github.com/Podduturi-Rashmith)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | MongoDB / Mongoose |
| AI | Google Gemini (`@google/genai`) |
| Auth | JWT via `jose`, Google OAuth |
| Email | Resend |

---

## Local Setup

**Prerequisites:** Node.js 20+, a MongoDB connection string

**Step 1 — Clone the repo**
```bash
git clone https://github.com/Podduturi-Rashmith/CareerOrbit.git
cd CareerOrbit
```

**Step 2 — Install dependencies**
```bash
npm install
```

**Step 3 — Set up environment variables**
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in your values. Required:
- `GEMINI_API_KEY` — from Google AI Studio
- `MONGODB_URI` — your MongoDB Atlas connection string
- `SESSION_SECRET` — any long random string
- `DATA_ENCRYPTION_KEY` — base64-encoded 32-byte key
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

**Step 4 — Seed the database**
```bash
npm run db:seed
```

**Step 5 — Start the dev server**
```bash
npm run dev
```
Open `http://localhost:3000`

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed MongoDB with starter data |

---

## How We Work — Git Workflow

> Read this before making any changes. This is how we keep `main` always working.

### The Golden Rule
**Nobody pushes directly to `main`.** All changes go through a Pull Request.

### Branch Naming
```
feature/what-you-are-adding     ← new features
fix/what-you-are-fixing         ← bug fixes
```

Examples: `feature/resume-upload`, `fix/login-redirect`

---

### Step by Step — Making a Change

**1. Always start from a fresh main**
```bash
git checkout main
git pull origin main
```

**2. Create your own branch**
```bash
git checkout -b feature/your-feature-name
```

**3. Write your code. When done, save it:**
```bash
git add .
git commit -m "short description of what you did"
```

**4. Push your branch to GitHub**
```bash
git push origin feature/your-feature-name
```

**5. Open a Pull Request on GitHub**
- Go to the repo on GitHub
- You'll see a yellow banner — click **"Compare & pull request"**
- Fill in what you changed and why
- Click **"Create pull request"**

**6. CI runs automatically**
- GitHub Actions will run lint + type check + build on your code
- Wait for the green ✓
- If it fails, fix the error locally → `git add . && git commit && git push` → CI re-runs

**7. Get a review**
- Tag the other person to review
- They go to the PR → **"Files changed"** tab → read the diff → click **"Review changes"** → **"Approve"**

**8. Merge**
- Once CI is green + 1 approval → click **"Merge pull request"** → **"Confirm merge"**
- Click **"Delete branch"** after merging (keeps things clean)

**9. Sync your computer**
```bash
git checkout main
git pull origin main
```

---

### Visual Flow

```
Write code on your branch
        ↓
git push → your branch on GitHub
        ↓
Open Pull Request
        ↓
CI checks run automatically  (lint + types + build)
        ↓
Other person reviews + approves
        ↓
Merge into main
        ↓
Deploy workflow builds the app automatically
```

---

## CI/CD Pipelines

We have two GitHub Actions workflows:

| Workflow | When it runs | What it does |
|---|---|---|
| **CI** (`.github/workflows/ci.yml`) | Every PR | Lint → Type check → Build |
| **Deploy** (`.github/workflows/deploy.yml`) | Every push to `main` | Build with real env vars, then deploy |

> The deploy step is ready but needs to be configured. See the deploy workflow file — uncomment the section for whichever platform you use (Vercel, Railway, or VPS).

---

## Setting Up Deployment (TODO)

When you're ready to go live:

**Option A — Vercel (easiest for Next.js)**
1. Go to vercel.com → Import the GitHub repo
2. Add all env vars from `.env.example` in the Vercel dashboard
3. Uncomment the Vercel deploy step in `.github/workflows/deploy.yml`
4. Add `VERCEL_TOKEN` to GitHub → Settings → Secrets → Actions

**Option B — Railway**
1. Go to railway.app → New Project → Deploy from GitHub
2. Add env vars in the Railway dashboard
3. Uncomment the Railway deploy step in `.github/workflows/deploy.yml`

---

## GitHub Repo Settings (TODO — do this once)

Go to **Settings → Branches → Add branch protection rule** for `main`:
- Check: **Require a pull request before merging**
- Check: **Require approvals → 1**
- Check: **Require status checks to pass** → select the `CI / Lint & Type Check` and `CI / Build` jobs
- Check: **Do not allow bypassing the above settings**

This prevents anyone from accidentally pushing broken code directly to `main`.

---

## Environment Variables

See [.env.example](.env.example) for all variables with descriptions.

**Never commit real secrets to the repo.** Use `.env.local` locally (it's gitignored) and GitHub Secrets for CI/CD.

To add a secret for CI: GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

---

## Project Structure

```
app/                  Next.js App Router pages and API routes
  api/                Backend API routes
  dashboard/          Student dashboard
  login/              Login page
  admin/              Admin panel
components/           Reusable React components
hooks/                Custom React hooks
lib/                  Shared utilities, auth, DB connection
scripts/              Database seed scripts
.github/
  workflows/          CI and deploy pipelines
  ISSUE_TEMPLATE/     Bug report and feature request templates
  PULL_REQUEST_TEMPLATE.md
```
