# ----------------------------
# Base image
# ----------------------------
FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ----------------------------
# Dependencies
# ----------------------------
FROM base AS deps

COPY package.json package-lock.json* ./

# Copy prisma folder BEFORE npm install to satisfy the postinstall script
COPY prisma ./prisma/ 

# Install dependencies including dev dependencies for build
RUN npm install --legacy-peer-deps

# ----------------------------
# Build
# ----------------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client (Ensures client is up to date with the latest schema)
# Dummy database URL to satisfy validation during build
ARG DATABASE_URL
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
RUN echo "DEBUG: DATABASE_URL is set to $DATABASE_URL"
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# ----------------------------
# Runtime
# ----------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home nextjs   

# Create npm cache for Prisma/npx usage at runtime
RUN mkdir -p /home/nextjs/.npm \
  && chown -R nextjs:nodejs /home/nextjs /app

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Manually copy the generated Prisma Client to standalone node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy prisma directory (needed for migrate deploy at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./prisma.config.js
COPY --from=builder --chown=nextjs:nodejs /app/workers ./workers
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Set npm cache location
ENV NPM_CONFIG_CACHE=/home/nextjs/.npm

# Install prisma and tsx CLI globally to ensure availability for migrations and workers
RUN npm install -g prisma@7.2.0 tsx

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
