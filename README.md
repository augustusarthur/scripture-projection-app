# Shepherd Connect

Pastor-only singles coordination across First Love Church branches. Shepherd Connect lets pastors create and manage single member profiles within their congregation, then securely share profiles with trusted pastors at other branches for intentional, faith-centered introductions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faugustusarthur%2Fscripture-projection-app&project-name=shepherd-connect&env=AUTH_SECRET&envDescription=Random%20session%20secret%20%28run%3A%20openssl%20rand%20-base64%2032%29)

**Live deploy guide:** see [DEPLOY.md](./DEPLOY.md)

## Features

- **Pastor authentication** — Register and sign in with email/password; sessions are stored in HTTP-only JWT cookies.
- **Church branches** — Pastors select their branch from 12 First Love Church locations during registration.
- **Profile management** — Create, view, edit, and delete single member profiles with photos, faith background, interests, and private pastor notes.
- **Cross-branch sharing** — Share profiles with pastors at other branches; recipients see shared profiles under "Shared With Me."
- **Pastor directory** — Search pastors across the network by name, email, or church location.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Prisma 7](https://www.prisma.io/) with PostgreSQL (Neon)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for profile photos in production
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Zod](https://zod.dev/) for validation
- [jose](https://github.com/panva/jose) for JWT sessions
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Database setup

1. Create a free PostgreSQL database at [Neon](https://neon.tech) (or use Vercel Postgres).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres connection string.
3. Run migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

This creates:

- 12 First Love Church branches (Brooklyn, Manhattan, Philadelphia, Chicago, Cleveland, Detroit, Sacramento, Portland, Seattle, Denver, Atlanta, Miami)
- 3 demo pastors (password: `pastor123`):
  - `pastor1@example.com` — Brooklyn
  - `pastor2@example.com` — Chicago
  - `pastor3@example.com` — Sacramento
- 1 sample profile: Anna Volkova (Brooklyn)

### Environment variables

Copy `.env.example` to `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
AUTH_SECRET="your-secret-key-at-least-32-characters"
```

Optional for local photo uploads without Vercel Blob — photos save to `public/uploads/profiles/`. On Vercel, connect **Blob** storage so `BLOB_READ_WRITE_TOKEN` is set automatically.

`AUTH_SECRET` must be set in production. Generate one with:

```bash
openssl rand -base64 32
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # register, login, logout
│   │   ├── churches/      # list branches
│   │   ├── profiles/      # CRUD + photo upload
│   │   ├── shares/        # share profiles
│   │   └── pastors/       # pastor search
│   ├── dashboard/         # stats + profile list
│   ├── profiles/          # new, detail, edit
│   ├── shared/            # profiles shared with you
│   ├── pastors/           # find pastors
│   ├── login/
│   └── register/
├── components/
│   ├── AppShell.tsx       # sidebar layout
│   ├── AuthForm.tsx       # auth form styles
│   ├── ProfileForm.tsx    # profile create/edit
│   └── ShareProfileForm.tsx
└── lib/
    ├── auth.ts            # sessions, passwords
    ├── db.ts              # Prisma client
    ├── validations.ts     # Zod schemas
    └── utils.ts           # helpers
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Pastor registration |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/churches` | List church branches |
| GET | `/api/profiles` | Profiles for session church |
| POST | `/api/profiles` | Create profile |
| GET | `/api/profiles/[id]` | Get profile (owner or shared) |
| PUT | `/api/profiles/[id]` | Update profile (owner only) |
| DELETE | `/api/profiles/[id]` | Delete profile (owner only) |
| POST | `/api/profiles/[id]` | Upload profile photo |
| GET | `/api/shares` | Shares received by session pastor |
| POST | `/api/shares` | Share a profile |
| GET | `/api/pastors?q=` | Search pastors (excludes self) |

## Authorization

- Protected routes (`/dashboard`, `/profiles`, `/shared`, `/pastors`) require a valid session (enforced in middleware).
- Profiles are visible to their creator and pastors they have been shared with.
- Only the profile owner can edit, delete, upload photos, or share.

## Deploy to Vercel

This app is ready to deploy on [Vercel](https://vercel.com). You can open it on your phone from anywhere once deployed.

### Step 1: Push the code to GitHub

Make sure the `cursor/pastor-singles-app-0e26` branch is merged or use that branch when importing to Vercel.

### Step 2: Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `augustusarthur/scripture-projection-app`
3. Select the branch with Shepherd Connect

### Step 3: Add a Postgres database

In the Vercel project:

1. Open **Storage** → **Create Database** → **Neon** (or connect an existing Neon database)
2. Vercel will add `DATABASE_URL` automatically

Or create a database at [neon.tech](https://neon.tech), copy the connection string, and add it as `DATABASE_URL` in **Settings → Environment Variables**.

### Step 4: Add Blob storage for photos

1. In Vercel, open **Storage** → **Create Database** → **Blob**
2. This adds `BLOB_READ_WRITE_TOKEN` automatically

Without Blob, photo uploads will not persist on Vercel.

### Step 5: Set auth secret

In **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `AUTH_SECRET` | A long random string (`openssl rand -base64 32`) |

### Step 6: Deploy

Click **Deploy**. Vercel runs database migrations automatically during build.

### Step 7: Seed demo data (one time)

After the first deploy, run the seed against your production database from your computer:

```bash
# Pull production env vars (requires Vercel CLI: npm i -g vercel)
vercel env pull .env.production
export $(grep -v '^#' .env.production | xargs)
npm run db:seed
```

Or paste your production `DATABASE_URL` into a local `.env` and run `npm run db:seed`.

### Step 8: Test on your phone

Open your Vercel URL (e.g. `https://shepherd-connect.vercel.app`) in your phone browser and sign in with:

- `pastor1@example.com` / `pastor123`

---

## Photo uploads

- **Local dev:** Photos save to `public/uploads/profiles/`
- **Vercel:** Photos upload to Vercel Blob (requires `BLOB_READ_WRITE_TOKEN`)

Accepted formats: JPEG, PNG, WebP, GIF.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo data |
| `npm run lint` | Run ESLint |

## License

Private — First Love Church network use.
