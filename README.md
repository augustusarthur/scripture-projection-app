# Shepherd Connect

Pastor-only singles coordination across First Slav Church branches. Shepherd Connect lets pastors create and manage single member profiles within their congregation, then securely share profiles with trusted pastors at other branches for intentional, faith-centered introductions.

## Features

- **Pastor authentication** — Register and sign in with email/password; sessions are stored in HTTP-only JWT cookies.
- **Church branches** — Pastors select their branch from 12 First Slav Church locations during registration.
- **Profile management** — Create, view, edit, and delete single member profiles with photos, faith background, interests, and private pastor notes.
- **Cross-branch sharing** — Share profiles with pastors at other branches; recipients see shared profiles under "Shared With Me."
- **Pastor directory** — Search pastors across the network by name, email, or church location.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Prisma 7](https://www.prisma.io/) with SQLite
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

Run migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

This creates:

- 12 First Slav Church branches (Brooklyn, Manhattan, Philadelphia, Chicago, Cleveland, Detroit, Sacramento, Portland, Seattle, Denver, Atlanta, Miami)
- 3 demo pastors (password: `pastor123`):
  - `pastor1@example.com` — Brooklyn
  - `pastor2@example.com` — Chicago
  - `pastor3@example.com` — Sacramento
- 1 sample profile: Anna Volkova (Brooklyn)

### Environment variables

Copy or edit `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-at-least-32-characters"
```

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

## Photo uploads

Profile photos are stored in `public/uploads/profiles/`. Accepted formats: JPEG, PNG, WebP, GIF.

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

Private — First Slav Church network use.
