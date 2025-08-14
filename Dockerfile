# ---------- Builder stage ----------
FROM node:18-bullseye-slim AS builder

ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /usr/src/app

# Install build deps (non-interactive) and clean apt lists in the same layer
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      build-essential \
      python3 \
      git \
      curl \
      make \
      g++ \
 && rm -rf /var/lib/apt/lists/*

# Copy package metadata first for caching
COPY package.json package-lock.json* ./

# Prefer reproducible install when lockfile exists, otherwise fallback
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --loglevel=warn; \
    else \
      npm install --omit=dev --no-audit --no-fund --loglevel=warn; \
    fi

# Copy source code and run build only if a 'build' script exists
COPY . .
RUN if npm run | grep -q " build"; then npm run build; fi

# ---------- Production stage ----------
FROM node:18-bullseye-slim AS production

ENV NODE_ENV=production
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# Create a non-root user and group
RUN groupadd -g 1001 appgroup \
 && useradd -r -u 1001 -g appgroup -d /nonexistent -s /usr/sbin/nologin appuser

# Copy app from builder, preserve ownership (no expensive chown later)
COPY --from=builder --chown=appuser:appgroup /usr/src/app /app

# Expose app port
EXPOSE 3000

# Healthcheck using node (no curl/wget required)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', res => process.exit(res.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

# Run as non-root user
USER appuser

# Start app
CMD ["npm", "start"]
