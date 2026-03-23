<h1 align="center">Health Tracker</h1>

<p align="center">
  A self-hosted health application for tracking and predicting menstrual cycles, managing birth control, and logging migraines. Own your health data.
</p>

<p align="center">
  <a href="https://github.com/dfsf5263/health-tracker/actions/workflows/ci.yml"><img src="https://github.com/dfsf5263/health-tracker/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/dfsf5263/health-tracker/actions/workflows/codeql.yml"><img src="https://github.com/dfsf5263/health-tracker/actions/workflows/codeql.yml/badge.svg" alt="CodeQL" /></a>
  <a href="https://github.com/dfsf5263/health-tracker/actions/workflows/semgrep.yml"><img src="https://github.com/dfsf5263/health-tracker/actions/workflows/semgrep.yml/badge.svg" alt="Semgrep" /></a>
  <a href="https://github.com/dfsf5263/health-tracker/actions/workflows/trivy.yml"><img src="https://github.com/dfsf5263/health-tracker/actions/workflows/trivy.yml/badge.svg" alt="Trivy" /></a>
  <a href="https://codecov.io/gh/dfsf5263/health-tracker"><img src="https://codecov.io/gh/dfsf5263/health-tracker/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://github.com/dfsf5263/health-tracker/blob/main/LICENSE"><img src="https://img.shields.io/github/license/dfsf5263/health-tracker" alt="License" /></a>
  <a href="https://github.com/dfsf5263/health-tracker/pkgs/container/health-tracker"><img src="https://img.shields.io/badge/GHCR-image-blue?logo=github" alt="GHCR" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn/ui-black?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Better_Auth-1.5-000000?style=for-the-badge" alt="Better Auth" />
  <img src="https://img.shields.io/badge/Zod-4-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Vitest-4-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Playwright-1.58-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
</p>

<p align="center">
  <picture>
    <img src="screenshots/dashboard.png" alt="Health Tracker Dashboard" width="800" />
  </picture>
</p>

<details>
<summary><strong>📸 Screenshots</strong></summary>

<br />

<table>
  <tr>
    <td align="center"><strong>Cycle Tracking</strong></td>
    <td align="center"><strong>Add Event</strong></td>
  </tr>
  <tr>
    <td><img src="screenshots/cycle_tracking.png" alt="Cycle Tracking" width="400" /></td>
    <td><img src="screenshots/add_event.png" alt="Add Event" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Add Period Event</strong></td>
    <td align="center"><strong>Add Birth Control Event</strong></td>
  </tr>
  <tr>
    <td><img src="screenshots/add_event_period.png" alt="Add Period Event" width="400" /></td>
    <td><img src="screenshots/add_event_birth_control.png" alt="Add Birth Control Event" width="400" /></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><strong>Add Migraine Event</strong></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="screenshots/add_event_migraine.gif" alt="Add Migraine Event" width="400" /></td>
  </tr>
</table>

</details>

## Why Self-Host?

Health data is deeply personal. Health Tracker is designed to run on your own hardware — a home server, a VPS, or anywhere you choose — so your cycle history, migraine logs, and health patterns never leave your control. No third-party accounts, no data harvesting, no subscriptions. Just a Docker image you can deploy in minutes.

> **See also:** [Finance Tracker](https://github.com/dfsf5263/finance-tracker) — a companion self-hosted app for tracking personal finances with the same privacy-first approach.

## Features

- 🩸 **Period Tracking** — Log menstrual cycle events and track cycle length over time
- 💊 **Birth Control Management** — Track birth control usage with configurable reminder notifications
- 🧠 **Migraine Logging** — Record migraine attacks with triggers, symptoms, precognitions, relief methods, medications, and pain levels
- 🔮 **Cycle Predictions** — Predict upcoming periods and fertile windows based on historical data
- 🏃 **Physical Event Tracking** — Log both normal and irregular physical events
- 📊 **Analytics Dashboard** — Visual insights into cycle patterns, migraine frequency, and health trends
- 🔐 **Authentication & Security** — Email/password auth with 2FA, email verification, rate limiting, and input validation
- 🎯 **Customizable Event Types** — Define and manage custom types for all tracked categories
- 📱 **Responsive UI** — Clean dashboard with dark/light theme support built on shadcn/ui
- 📧 **Email Notifications** — Birth control reminders and transactional emails via Resend

## Tech Stack

**Frontend** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui

**Backend** — Next.js API Routes, Prisma ORM 7, PostgreSQL 17, Zod validation

**Auth** — Better Auth (email/password, 2FA, email verification, sessions)

**Email** — Resend for transactional emails and birth control reminders

**Testing** — Vitest + React Testing Library (unit), Playwright (E2E)

**DevOps** — GitHub Actions CI/CD, Docker (GHCR), Biome (formatter/linter)

## Getting Started

### Prerequisites

- **Node.js** 24+ and npm
- **PostgreSQL** 12+ (or use Docker)

### Quick Start with Docker Compose

The fastest way to run Health Tracker. Includes PostgreSQL — no external database needed.

```bash
cp .env.docker .env
# Edit .env with your secrets and email config

docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) to use the app. Database migrations run automatically on first startup.

> **Full deployment guide:** [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT.md)

### Local Development

1. **Clone and install:**

   ```bash
   git clone https://github.com/dfsf5263/health-tracker.git
   cd health-tracker
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and secrets
   ```

3. **Set up the database:**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start the dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret (32+ characters) |
| `APP_URL` | Yes | Application URL for auth callbacks and emails |
| `RESEND_API_KEY` | | [Resend](https://resend.com) API key — required for email notifications |
| `RESEND_FROM_EMAIL` | | Sender email address — required when `RESEND_API_KEY` is set |
| `RESEND_REPLY_TO_EMAIL` | | Reply-to email for support |
| `SKIP_MIGRATIONS` | | Set to `true` to skip auto-migration on Docker startup |
| `ENABLE_SEEDING` | | Set to `true` to seed default event types on Docker startup |

See [.env.example](.env.example) for a complete template.

## Testing

Health Tracker has a comprehensive testing strategy:

### Unit Tests

```bash
npm run test              # Run unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Run with coverage report
```

Powered by [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/react) and [vitest-mock-extended](https://github.com/eratio08/vitest-mock-extended).

### End-to-End Tests

```bash
# Start the E2E database
npm run db:e2e:up

# Reset and seed the E2E database
npm run db:e2e:reset

# Run E2E tests
npm run test:e2e

# Run with browser UI
npm run test:e2e:ui

# Shut down the E2E database
npm run db:e2e:down
```

Powered by [Playwright](https://playwright.dev/) running Chromium against a real PostgreSQL database.

## CI/CD Pipeline

The project uses GitHub Actions with two workflows:

**CI** (`ci.yml`) — Runs on every push and pull request to `main`:

1. **Lint, Format & Typecheck** — `npm run check` (Biome + TypeScript)
2. **Unit Tests** — `npm run test` (runs in parallel with step 1)
3. **E2E Tests** — Playwright against a PostgreSQL service container (runs after steps 1 & 2 pass)

**Release** (`release.yml`) — Builds multi-arch Docker images (amd64 + arm64) and pushes to [GitHub Container Registry](https://github.com/dfsf5263/health-tracker/pkgs/container/health-tracker):

- **Push to `main`** → nightly build: `:nightly`, `:nightly-YYYYMMDD`, `:nightly-sha-<commit>`
- **Tag push (`v*`)** → stable release: `:latest`, `:<version>`, `:sha-<commit>` + GitHub Release with auto-generated notes
- Version tags are **immutable** — the build fails if the version already exists in GHCR

See [Releasing](docs/RELEASING.md) for the full release process.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (sign-in, sign-up, forgot-password, 2FA)
│   ├── api/                 # API routes (events, predictions, health, auth)
│   └── dashboard/
│       ├── add-event/       # Add new health events
│       ├── analytics/       # Cycle and migraine analytics
│       ├── edit-event/      # Edit existing events
│       ├── manage-event-types/ # Customize event type definitions
│       └── settings/        # Profile, security, household settings
├── components/              # Reusable React components + shadcn/ui
├── hooks/                   # Custom React hooks
└── lib/                     # Business logic, validation, auth, email, predictions
prisma/
├── schema.prisma            # Database schema
├── seed.ts                  # Database seeding script
└── migrations/              # Prisma migrations
tests/
└── e2e/                     # Playwright E2E test specs
```

## Deployment

### Docker (Self-Hosted)

Multi-arch images (amd64 + arm64) are published to GitHub Container Registry:

```bash
docker pull ghcr.io/dfsf5263/health-tracker:latest
```

The container automatically runs database migrations on startup (skip with `SKIP_MIGRATIONS=true`).

See the [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT.md) for Docker Compose quick deploy, reverse proxy setup, monitoring, backups, and troubleshooting.

## Development Commands

```bash
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run check            # Lint + format check + typecheck
npm run format           # Format with Biome
npm run test             # Unit tests
npm run test:e2e         # E2E tests
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create a new migration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run checks: `npm run format && npm run check`
5. Commit and push
6. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
