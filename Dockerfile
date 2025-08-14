# ---------- Builder stage ----------
FROM node:18-bullseye-slim AS builder

ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /usr/src/app

# Install build dependencies needed for native modules + git for git dependencies
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      build-essential \
      python3 \
      git \
      curl \
      make \
      g++ \
      pkg-config \
      libc6-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy package metadata first for Docker layer caching
COPY package.json package-lock.json* ./

# Make npm allow lifecycle scripts to run as root (helps many install scripts)
RUN npm config set unsafe-perm true

# Install dependencies with a fail-safe that prints npm debug logs on error.
# - prefer `npm ci` if lockfile exists; fallback to npm install otherwise.
# - use --no-audit/--no-fund to reduce noise.
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --no-audit --no-fund --unsafe-perm || (echo "=== NPM DEBUG LOG ===" && cat /root/.npm/_logs/*.log 2>/dev/null || true && false); \
    else \
      npm install --omit=dev --no-audit --no-fund --unsafe-perm || (echo "=== NPM DEBUG LOG ===" && cat /root/.npm/_logs/*.log 2>/dev/null || true && false); \
    fi

# Copy the rest of the source and run build if present
COPY . .
RUN if npm run | grep -q " build"; then npm run build; fi

# Optional: clean npm cache to reduce layer size
RUN npm cache clean --force

# ---------- Production stage ----------
FROM node:18-bullseye-slim AS production

ENV NODE_ENV=production
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 appgroup \
 && useradd -r -u 1001 -g appgroup -d /nonexistent -s /usr/sbin/nologin appuser

# Copy built app and node_modules from builder; preserve ownership to avoid chown -R
COPY --from=builder --chown=appuser:appgroup /usr/src/app /app

# Port and healthcheck
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', res => process.exit(res.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

# Run as non-root
USER appuser

# Start the application
CMD ["npm", "start"]
