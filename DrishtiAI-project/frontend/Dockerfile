# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* npm-shrinkwrap.json* yarn.lock* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# We don't embed NEXT_PUBLIC environment variables here in docker-compose 
# because they are provided at runtime or we want them to remain dynamic if possible.
# Actually, NEXT_PUBLIC variables are baked in at build time. For local Docker Compose,
# we will pass build-args if necessary, or just rely on Next.js reading them at runtime 
# if we use client-side fetching properly. Since this is local dev, we will pass them 
# via compose environment variables which Next.js CAN pick up during build IF we build in compose.
# For now, just build.
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size (requires output: 'standalone' in next.config)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
