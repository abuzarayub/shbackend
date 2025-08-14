# ---------- Builder stage ----------
FROM node:18-bullseye-slim AS builder

ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /usr/src/app

# Prevent calling npm binary during heavy apt install phases by using ENV
ENV NPM_CONFIG_UNSAFE_PERM=true
ENV NODE_ENV=production

# Install only required build deps in one layer and clean apt cache
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

# Copy package metadata for caching
COPY package.json package-lock.json* ./

# Install dependencies:
# - prefer `npm ci` if lockfile exists; otherwise fall back to npm install
# - pass --unsafe-perm explicitly as extra safety
# - print npm debug logs if it fails (so build output includes real cause)
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --no-audit --no-fund --unsafe-perm || (echo "=== NPM DEBUG LOG ===" && cat /root/.npm/_logs/*.log 2>/dev/null || true && false); \
    else \
      npm install --omit=dev --no-audit --no-fund --unsafe-perm || (echo "=== NPM DEBUG LOG ===" && cat /root/.npm/_logs/*.log 2>/dev/null || true && false); \
    fi

# Copy rest of source & run build if build script exists
COPY . .
RUN if npm run | grep -q " build"; then npm run build; fi

# Clean npm cache to reduce layer size
RUN npm cache clean --force

# ---------- Production stage ----------
FROM node:18-bullseye-slim AS production

ENV NODE_ENV=production
ENV NPM_CONFIG_UNSAFE_PERM=true
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 appgroup \
 && useradd -r -u 1001 -g appgroup -d /nonexistent -s /usr/sbin/nologin appuser

# Copy app from builder and set ownership to non-root user
COPY --from=builder --chown=appuser:appgroup /usr/src/app /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', res => process.exit(res.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

USER appuser

CMD ["npm", "start"]
