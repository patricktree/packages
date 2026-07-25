# crowd-lense

A crowd-sourced event photo app: guests upload photos from their phones, an admin moderates them, and approved photos rotate on a big-screen slideshow. Built for the "Ballermannparty 2025" event and deployed to Vercel at [ballermann.vercel.app](https://ballermann.vercel.app).

## How it works

- **Upload** (`/upload`, the default landing page) — Guests select up to 10 images (JPEG, PNG, GIF, or WebP, max 10 MB each). Each file is stored in Vercel Blob and recorded in the database with status `PENDING`.
- **Review** (`/admin/review`) — A moderator, gated behind HTTP Basic Auth, steps through pending photos and marks each `APPROVED` or `REJECTED`.
- **Manage** (`/admin/images`) — Also gated behind HTTP Basic Auth, a two-column grid of every non-deleted photo with a delete button floating over each one. Deleting asks for confirmation and is a **soft delete**: the photo's status becomes `DELETED` so it disappears from the grid, but the database row and the blob are both kept, so flipping the status back restores it.
- **Slideshow** (`/view`) — A fullscreen carousel cycles through `APPROVED` photos, least-viewed first, so every submission gets screen time. Promotional images (see below) are interleaved, and a QR code links guests back to the upload page.

## Tech stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma (schema in `prisma/schema.prisma`); production runs on Prisma Postgres
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
│   │   ├── admin/images/    # Grid of all images with soft delete (Basic Auth)
│   │   └── api/
│   │       ├── upload/              # POST: validate + store to Blob + DB
│   │       ├── images/              # GET: `type=user` (approved) or `type=promo`
│   │       ├── images/[id]/view/    # POST: increment view count
│   │       └── admin/images/        # GET list / PATCH approve|reject / DELETE soft-delete (Basic Auth)
│   ├── components/          # Upload widget, UI primitives, providers
│   └── lib/                 # `db` (Prisma), `blob`, `auth`, `utils`
└── next.config.mjs          # `/` → `/upload` redirect, Blob remote image patterns
```

## Data model

A single `Image` model tracks each submission: `filename`, `originalFilename`, `mimeType`, `fileSize`, `blobUrl`, a `status` (`PENDING` / `APPROVED` / `REJECTED` / `DELETED`), a `viewCount`, and upload/review timestamps.

`DELETED` is the soft-delete tombstone set by `/admin/images`. It is excluded from every listing, but the row and its blob survive, so restoring an image is a matter of setting its status back to one of the other three.

### Promotional images

The slideshow can mix in "promotional" images that are not part of the moderation flow. These live directly in the Blob store under the `promotional-images/` prefix and are served by `GET /api/images?type=promo` — upload them to that prefix to have them appear.

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable                | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (direct `postgresql://` URL) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token                              |
| `ADMIN_USERNAME`        | Username for the `/admin/*` Basic Auth gate               |
| `ADMIN_PASSWORD`        | Password for the `/admin/*` Basic Auth gate               |

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

Deployed to the Vercel project `crowd-lense` (root directory `packages/crowd-lense`). There is no Git integration, so deploy with the Vercel CLI from the **monorepo root** (Vercel builds using the configured root directory):

```bash
vercel deploy --prod
```

### Storage

Production is backed by two Vercel-managed resources, each wiring its own project environment variables:

- **Database** — Prisma Postgres, provisioned through the Vercel Marketplace. It injects a direct `postgres://…@db.prisma.io` `DATABASE_URL` (server-side pooled), which the plain Prisma client (`new PrismaClient()`) connects to directly — no Accelerate / Data Proxy layer is required.

  ```bash
  vercel integration add prisma/prisma-postgres
  ```

- **File storage** — a public Vercel Blob store, which injects `BLOB_READ_WRITE_TOKEN`.

  ```bash
  vercel blob create-store crowd-lense-blob --access public --yes
  ```

After the database exists, create the schema once with `prisma db push` (see the `db:push` script), and set `ADMIN_USERNAME` and `ADMIN_PASSWORD` as project environment variables for the `/admin/review` Basic Auth gate.

### Enabling and disabling the site

The site is switched on and off with a **Vercel Firewall** custom rule named `Block everything`, which denies all requests to `/`. When the rule is **active**, every request returns `403` (`x-vercel-mitigated: deny`); when it is **inactive**, the site serves normally.

- **Disable the site**: activate the `Block everything` rule.
- **Enable the site**: deactivate it.

Toggle it under the project's **Firewall** settings in the Vercel dashboard (or via the Firewall config API). Leave the other rules in place — in particular the `Rate limit image upload API requests` rule and the managed WAF (CRS) rules. Pausing the project or toggling deployment protection are separate switches and are not the intended on/off control here.
