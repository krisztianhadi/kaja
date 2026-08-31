# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
# Pin pnpm deterministically — corepack can resolve "latest" (11.x), and
# pnpm 11's verify-deps-before-run re-runs install at startup and fails on
# unapproved build scripts in non-TTY. Node 22 ships npm, so install the
# pinned version directly (this shadows corepack - proven in Ghosted).
RUN npm install -g pnpm@10.12.1 && pnpm --version
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
# lockfile must be present before `pnpm prune` reads the manifest
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
# keep only production deps; confirmModulesPurge=false skips the
# interactive prompt (build must be non-TTY)
RUN pnpm prune --prod --config.confirmModulesPurge=false
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate-on-start.mjs && pnpm start"]
