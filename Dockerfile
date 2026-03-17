# syntax=docker.io/docker/dockerfile:1

FROM node:25-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY prisma ./prisma/
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --verbose; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.source=https://github.com/dfsf5263/health-tracker

ENV NODE_ENV=production
ENV LOG_LEVEL=info

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install curl for health checks, node-cron for reminders, prisma CLI (pinned to @prisma/client version), and tsx for optional seeding
COPY --from=build /app/node_modules/@prisma/client/package.json /tmp/prisma-client-pkg.json
RUN apk add --no-cache curl && \
    PRISMA_VERSION=$(node -p "require('/tmp/prisma-client-pkg.json').version") && \
    npm install --no-save node-cron "prisma@${PRISMA_VERSION}" tsx && \
    rm /tmp/prisma-client-pkg.json

COPY --from=build /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema, migrations, config, and generated client for runtime
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy cron script and entrypoint
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=build --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Make scripts executable
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Health check using the existing API endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENV HOSTNAME="0.0.0.0"
CMD ["./docker-entrypoint.sh"]
