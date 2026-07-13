# Shepherd Connect — one-click Vercel deploy

Use this if you want the fastest path to a live URL on your phone.

## Deploy in about 5 minutes

### Step 1: Click Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faugustusarthur%2Fscripture-projection-app&project-name=shepherd-connect&env=AUTH_SECRET&envDescription=Random%20session%20secret%20%28run%3A%20openssl%20rand%20-base64%2032%29)

This opens Vercel, imports the GitHub repo, and prompts for `AUTH_SECRET`.

### Step 2: Add Postgres (Neon)

During or after import:

1. In the Vercel project → **Storage** → **Create Database** → **Neon**
2. Vercel adds `DATABASE_URL` automatically

### Step 3: Add Blob storage (for photos)

1. **Storage** → **Create Database** → **Blob**
2. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically

### Step 4: Deploy

Click **Deploy**. Migrations run automatically on build.

### Step 5: Seed demo pastors (one time, on your computer)

```bash
git clone https://github.com/augustusarthur/scripture-projection-app.git
cd scripture-projection-app
npm install
npx vercel login
npx vercel link
npx vercel env pull .env.production
export $(grep -v '^#' .env.production | xargs)
npm run db:seed
```

### Step 6: Open on your phone

Visit your Vercel URL, e.g. `https://shepherd-connect.vercel.app`

**Demo login:** `pastor1@example.com` / `pastor123`

---

## If you want the agent to finish deploy for you

Create a Vercel access token at [vercel.com/account/tokens](https://vercel.com/account/tokens) and share it in chat (or add `VERCEL_TOKEN` to this Cloud Agent environment). The agent can then:

- Create the Vercel project
- Set environment variables
- Deploy production
- Run the database seed

Without that token, Vercel requires a one-time login in your browser for security.
