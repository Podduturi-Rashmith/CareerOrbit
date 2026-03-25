<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CareerOrbit

A Next.js 15 career platform powered by Google Gemini AI, with MongoDB for persistence and full auth flows.

---

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4
- **Database** — MongoDB / Mongoose
- **AI** — Google Gemini (`@google/genai`)
- **Auth** — JWT via `jose`, Google OAuth
- **Email** — Resend

---

## Local Setup

**Prerequisites:** Node.js 20+, a MongoDB connection string

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
   Required variables: `GEMINI_API_KEY`, `MONGODB_URI`, `SESSION_SECRET`, `DATA_ENCRYPTION_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

3. Seed the database:
   ```bash
   npm run db:seed
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed MongoDB with starter data |

---

## Branching Strategy

```
main        ← production (protected, requires PR + review)
develop     ← integration branch
feature/*   ← new features
fix/*       ← bug fixes
```

Always branch off `develop`, open a PR back to `develop`, then `develop` → `main` for releases.

---

## Contributing

1. Branch off `develop`: `git checkout -b feature/your-feature develop`
2. Make your changes
3. Open a PR to `develop` — the CI pipeline will run automatically
4. Get a review from a codeowner before merging

---

## Environment Variables

See [.env.example](.env.example) for all required and optional variables. **Never commit real secrets.**
