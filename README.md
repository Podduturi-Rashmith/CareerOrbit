

# CareerOrbit

A career platform built with Next.js 15, Google Gemini AI, and MongoDB.

**Built by [@Tharun-de](https://github.com/Tharun-de) and [@Podduturi-Rashmith](https://github.com/Podduturi-Rashmith)**

</div>

---

## Table of Contents

1. [What is this project?](#what-is-this-project)
2. [Tech Stack](#tech-stack)
3. [Run it on your computer](#run-it-on-your-computer)
4. [Git & GitHub — Complete Beginner Guide](#git--github--complete-beginner-guide)
   - [What is Git? What is GitHub?](#what-is-git-what-is-github)
   - [One-time setup](#one-time-setup-do-this-once-ever)
   - [How to get the latest code](#how-to-get-the-latest-code)
   - [How to make changes and push them](#how-to-make-changes-and-push-them)
   - [How to review and approve someone's PR](#how-to-review-and-approve-someones-pr)
   - [How to merge a PR](#how-to-merge-a-pr)
   - [The one rule](#the-one-rule)
5. [How our CI pipeline works](#how-our-ci-pipeline-works)
6. [Project folder structure](#project-folder-structure)
7. [Environment variables](#environment-variables)

---

## What is this project?

CareerOrbit is a web app that helps students track job applications, prep for interviews, and get AI-powered career advice. Students sign up, fill in their profile, and the platform organizes everything in one place.

---

## Tech Stack

| What | Technology |
|---|---|
| Frontend + Backend | Next.js 15 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB |
| AI | Google Gemini |
| Authentication | JWT + Google OAuth |
| Email | Resend |

---

## Run it on your computer

**Before you start, you need:**
- Node.js installed — download from nodejs.org (get version 20 or higher)
- A code editor — VS Code recommended

---

**Step 1 — Download the code**

Open a terminal (on Windows: search "Terminal" or "Command Prompt") and run:

```bash
git clone https://github.com/Podduturi-Rashmith/CareerOrbit.git
cd CareerOrbit
```

---

**Step 2 — Install packages**

```bash
npm install
```

This downloads all the libraries the project needs. Takes 1-2 minutes.

---

**Step 3 — Set up your environment file**

```bash
cp .env.example .env.local
```

Then open `.env.local` in VS Code and fill in the values. Ask Tharun for the actual values — never share these or commit them to GitHub.

---

**Step 4 — Set up the database**

```bash
npm run db:seed
```

---

**Step 5 — Start the app**

```bash
npm run dev
```

Open your browser and go to `http://localhost:3000` — you should see the app running.

---

## Git & GitHub — Complete Beginner Guide

> This section is written for someone who has never used Git before. Read it fully once before doing anything.

---

### What is Git? What is GitHub?

Think of it like this:

- **Git** is like a "save history" for your code. Every time you save (called a "commit"), Git remembers exactly what changed. You can go back to any previous save at any time.

- **GitHub** is where that save history lives online. It's the shared copy that both you and Tharun can access.

- **Branch** — think of it as your own personal copy of the code to work in. You make changes in your branch without affecting Tharun's work or the live code.

- **Pull Request (PR)** — when your work is ready, you open a PR. It's basically saying "hey, I made these changes, can you check them and add them to the main code?"

- **Merge** — when a PR is approved and looks good, you merge it. That adds your changes into the main codebase.

---

### One-time Setup (do this once, ever)

**1. Install Git**

Download from git-scm.com and install it. Keep all the default settings.

**2. Tell Git who you are** (open a terminal and run these):

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Use the same email as your GitHub account.

**3. Clone the repo** (this downloads the project to your computer):

```bash
git clone https://github.com/Podduturi-Rashmith/CareerOrbit.git
cd CareerOrbit
```

You only need to do this once. After this, the folder is on your computer.

---

### How to get the latest code

Whenever Tharun (or you) merges something, the `main` branch on GitHub gets updated. To get those updates on your computer:

```bash
git checkout main
git pull origin main
```

**Always do this before starting any new work.** Otherwise you're working on old code.

---

### How to make changes and push them

Follow these steps every single time you want to make a change — big or small.

---

**Step 1 — Get the latest code first**

```bash
git checkout main
git pull origin main
```

---

**Step 2 — Create a branch for your work**

```bash
git checkout -b feature/what-you-are-working-on
```

Replace `what-you-are-working-on` with something descriptive. Examples:
- `feature/add-resume-upload`
- `feature/fix-login-button`
- `fix/dashboard-not-loading`

You are now in your own branch. Whatever you change here does not affect `main` or Tharun's work.

---

**Step 3 — Make your changes**

Open VS Code, make your changes, save your files normally (Ctrl+S).

---

**Step 4 — Save your changes to Git**

```bash
git add .
git commit -m "describe what you changed"
```

The message should be short and clear. Examples:
- `"Add resume upload button to profile page"`
- `"Fix typo on dashboard"`
- `"Update color of submit button"`

---

**Step 5 — Push your branch to GitHub**

```bash
git push origin feature/what-you-are-working-on
```

Use the same branch name you created in Step 2.

---

**Step 6 — Open a Pull Request on GitHub**

1. Go to `github.com/Podduturi-Rashmith/CareerOrbit` in your browser
2. You will see a yellow banner at the top that says **"Compare & pull request"** — click it

   > If you don't see the banner, click the **"Pull requests"** tab → **"New pull request"**

3. You'll see a form. Fill in:
   - **Title** — short description of what you did
   - **Description** — explain what changed and why (a checklist will auto-appear)
4. Click **"Create pull request"**

---

**Step 7 — Wait for the checks to pass**

At the bottom of your PR, you'll see checks running automatically:

- A yellow circle = still running, wait
- A green ✓ = all good, you can merge
- A red ✗ = something failed

If it fails, don't panic. Read the error, fix it in your code, then:

```bash
git add .
git commit -m "fix the error"
git push origin feature/your-branch-name
```

The checks will run again automatically.

---

**Step 8 — Ask Tharun to review it**

Message Tharun and share the PR link. He will look at the code and either:
- Approve it ✓ (you can merge)
- Leave comments asking for changes

If he leaves comments, make the fixes on your computer → `git add . && git commit && git push` → the PR updates automatically.

---

**Step 9 — Merge the PR**

Once checks are green and Tharun approved:

1. Click the green **"Merge pull request"** button
2. Click **"Confirm merge"**
3. Click **"Delete branch"** (cleans up the old branch)

Your changes are now in `main`. Done!

---

**Step 10 — Sync your computer**

```bash
git checkout main
git pull origin main
```

---

### How to review and approve someone's PR

When Tharun pushes something and asks you to review:

**1. Go to the PR**
- Click the **"Pull requests"** tab on the repo
- Click the PR that needs review

**2. See what changed**
- Click the **"Files changed"** tab
- Green lines = code that was added
- Red lines = code that was removed
- Read through and make sure it looks right

**3. Leave a comment (optional)**
- Click the `+` button that appears when you hover over any line
- Type your comment and click **"Start a review"**

**4. Approve it**
- Click the green **"Review changes"** button (top right of the Files changed tab)
- Select **"Approve"**
- Click **"Submit review"**

Tharun can now merge his PR.

---

### How to merge a PR

You can merge a PR if:
- The CI checks are green ✓
- At least one person approved it

Steps:
1. Go to the PR
2. Scroll to the bottom
3. Click **"Merge pull request"**
4. Click **"Confirm merge"**
5. Click **"Delete branch"**

---

### The one rule

> **Never push directly to `main`.** Always create a branch, push to that branch, open a PR, and merge through GitHub.

If you push directly to `main`, there are no checks, no review, and broken code can go live. The whole PR process exists to prevent that.

---

## How our CI pipeline works

Every time you open a PR, GitHub automatically runs three checks:

| Check | What it does |
|---|---|
| **Lint** | Checks your code follows the style rules |
| **Type check** | Makes sure TypeScript types are correct |
| **Build** | Makes sure the whole app compiles without errors |

You don't need to do anything — it runs on its own. Just wait for the green ✓.

If it fails, click on the failed check to see the exact error and line number. Fix it, push again, and it re-runs.

---

## Project Folder Structure

```
CareerOrbit/
│
├── app/                    All pages and API routes
│   ├── api/                Backend endpoints (auth, students, admin)
│   ├── dashboard/          Student dashboard page
│   ├── login/              Login page
│   ├── admin/              Admin panel pages
│   └── page.tsx            Landing / home page
│
├── components/             Reusable UI pieces (buttons, forms, sidebar)
├── hooks/                  Custom React hooks (e.g. useAuth)
├── lib/                    Shared utilities (database, auth, email)
├── scripts/                Database seed script
│
├── .github/
│   ├── workflows/          CI and deploy pipelines (run automatically)
│   ├── ISSUE_TEMPLATE/     Templates for bug reports and feature requests
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .env.example            List of all env variables needed (no real values)
└── README.md               This file
```

---

## Environment Variables

All the secret keys the app needs are listed in `.env.example`. To run the app locally:

1. Copy the file: `cp .env.example .env.local`
2. Fill in the real values (ask Tharun)
3. Never commit `.env.local` to GitHub — it is already in `.gitignore` so Git ignores it automatically

For the CI/CD pipeline, secrets are stored in GitHub:
**Repo → Settings → Secrets and variables → Actions**

---

<div align="center">

If anything is unclear, message Tharun or open an Issue on GitHub.

</div>
