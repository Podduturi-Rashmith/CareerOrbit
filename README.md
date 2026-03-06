<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CareerOrbit

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f50f6f21-cfc1-4453-bb96-6ee74f2b02ab

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure [.env.local](.env.local):
   - `GEMINI_API_KEY`
   - `DATABASE_URL`
   - `SESSION_SECRET`
3. Generate Prisma client:
   `npm run db:generate`
4. Run migrations:
   `npm run db:migrate`
5. Seed starter users:
   `npm run db:seed`
6. Run the app:
   `npm run dev`

## Account Flows

- Students can now self-register from the landing page (`/`) and are automatically signed in.
- Existing users can sign in from `/login`.
- Seeded test users still work after running `npm run db:seed`.
