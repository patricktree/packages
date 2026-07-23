# crowd-lense

A crowd-sourced event photo app: guests upload photos from their phones, an admin moderates them, and approved photos rotate on a big-screen slideshow. Built for the "Ballermannparty 2025" event and deployed to Vercel at [ballermann.vercel.app](https://ballermann.vercel.app).

## How it works

- **Upload** (`/upload`, the default landing page) — Guests select up to 10 images (JPEG, PNG, GIF, or WebP, max 10 MB each). Each file is stored in Vercel Blob and recorded in the database with status `PENDING`.
- **Review** (`/admin/review`) — A moderator, gated behind HTTP Basic Auth, steps through pending photos and marks each `APPROVED` or `REJECTED`.
- **Slideshow** (`/view`) — A fullscreen carousel cycles through `APPROVED` photos, least-viewed first, so every submission gets screen time. Promotional images (see below) are interleaved, and a QR code links guests back to the upload page.

## Tech stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma (schema in `prisma/schema.prisma`)
- **File storage**: Vercel Blob (`@vercel/blob`)
- **Data fetching**: TanStack Query
- **UI**: Tailwind CSS + Radix UI primitives
- **Hosting**: Vercel

## Project structure

```txt
crowd-lense/
├── prisma/
│   └── schema.prisma        # `Image` model + `ImageStatus` enum
├── src/
│   ├── app/
│   │   ├── upload/          # Guest upload page (default route via redirect)
│   │   ├── view/            # Fullscreen slideshow carousel
│   │   ├── admin/review/    # Moderation UI (Basic Auth)
│   │   └── api/
│   │       ├── upload/              # POST: validate + store to Blob + DB
│   │       ├── images/              # GET: `type=user` (approved) or `type=promo`
│   │       ├── images/[id]/view/    # POST: increment view count
│   │       └── admin/images/        # GET pending / PATCH approve|reject (Basic Auth)
│   ├── components/          # Upload widget, UI primitives, providers
│   └── lib/                 # `db` (Prisma), `blob`, `auth`, `utils`
└── next.config.mjs          # `/` → `/upload` redirect, Blob remote image patterns
```

## Data model

A single `Image` model tracks each submission: `filename`, `originalFilename`, `mimeType`, `fileSize`, `blobUrl`, a `status` (`PENDING` / `APPROVED` / `REJECTED`), a `viewCount`, and upload/review timestamps.

### Promotional images

The slideshow can mix in "promotional" images that are not part of the moderation flow. These live directly in the Blob store under the `promotional-images/` prefix and are served by `GET /api/images?type=promo` — upload them to that prefix to have them appear.

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable                | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (direct `postgresql://` URL) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token                              |
| `ADMIN_USERNAME`        | Username for the `/admin/review` Basic Auth gate          |
| `ADMIN_PASSWORD`        | Password for the `/admin/review` Basic Auth gate          |

## Getting started

This package is part of the `packages-private` pnpm monorepo; run commands from the repo root or this directory.

```bash
pnpm install              # install dependencies (from the monorepo root)
pnpm run db:push          # create the schema in your database
pnpm run dev              # start the Next.js dev server
```

Then open <http://localhost:3000> (it redirects to `/upload`).

## Scripts

| Script              | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `dev`               | Start the Next.js dev server                          |
| `build`             | `tsc` typecheck, `prisma generate`, then `next build` |
| `start`             | Start the production server                           |
| `lint` / `lint:fix` | Run ESLint (with autofix)                             |
| `db:generate`       | Generate the Prisma client                            |
| `db:migrate`        | Create/apply a dev migration                          |
| `db:push`           | Push the schema to the database without a migration   |
| `db:studio`         | Open Prisma Studio                                    |
| `nuke`              | Remove build artifacts and `node_modules`             |

## Deployment

Deployed to the Vercel project `crowd-lense` (root directory `packages/crowd-lense`). There is no Git integration, so deploy via the Vercel CLI from the monorepo root:

```bash
vercel deploy --prod
```

The app requires a PostgreSQL database and a Vercel Blob store. Set `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` as project environment variables, and run `prisma db push` against the database once to create the `images` table.
