# Contributing to CareerOrbit

## Branch Strategy

```
main       ← production only (protected, no direct pushes)
develop    ← integration branch, merge your feature here first
feature/*  ← all new features and bug fixes
hotfix/*   ← emergency production fixes only
```

**Never push directly to `main` or `develop`.** All changes go through a PR.

## Workflow

1. **Branch off `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** — keep PRs small and focused (under 400 lines if possible)

3. **Commit using Conventional Commits format**
   ```
   feat: add resume upload to profile page
   fix: resolve calendar timezone bug
   chore: update clerk dependency
   refactor: simplify job matching logic
   docs: update setup instructions
   ```

4. **Push and open a PR targeting `develop`**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub from your branch → `develop`

5. **PR must pass CI** (lint, type check, build) before it can be merged

6. **Get at least 1 approval** from a CODEOWNER (@Podduturi-Rashmith or @Tharun-de)

## Commit Message Rules

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Dependency updates, config changes |
| `refactor:` | Code restructure with no behavior change |
| `docs:` | Documentation only |
| `test:` | Adding or updating tests |
| `style:` | Formatting, no logic change |

## Local Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# Run dev server
npm run dev

# Check for issues before pushing
npm run lint
npx tsc --noEmit
npm run build
```

## What NOT to do

- Do not commit `.env.local` or any file with real secrets
- Do not push directly to `main` or `develop`
- Do not merge your own PRs without a review
- Do not use `--force` push on shared branches

## Questions?

Open a GitHub Issue or reach out to a CODEOWNER.
