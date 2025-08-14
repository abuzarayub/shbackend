# ---------- Builder stage ----------
FROM node:18-bullseye-slim AS builder

# set working dir
WORKDIR /usr/src/app

# Install build deps only in builder (needed for native modules)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential ca-certificates gnupg \
 && rm -rf /var/lib/apt/lists/*

# copy package files first to leverage layer cache
COPY package.json package-lock.json* ./

# Install dependencies:
# - prefer `npm ci` if package-lock.json exists (reproducible)
# - otherwise fall back to `npm install --omit=dev`
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production --loglevel=warn; \
    else \
      npm install --omit=dev --no-audit --no-fund --loglevel=warn; \
    fi

# copy source and build
COPY . .

# run build if you have a build script (safe no-op if not)
RUN if npm run | grep -q "build"; then npm run build; fi

# ---------- Production stage ----------
FROM node:18-bullseye-slim AS production

ENV NODE_ENV=production
WORKDIR /app

# Create a non-root user (use node's existing user if you prefer; here we create 'appuser')
RUN groupadd -g 1001 appgroup \
 && useradd -r -u 1001 -g appgroup -d /nonexistent -s /usr/sbin/nologin appuser

# Copy built app and node_modules from builder; set ownership to non-root user
COPY --from=builder --chown=appuser:appgroup /usr/src/app /app

# Expose the port your app listens on
EXPOSE 3000

# Lightweight healthcheck using node (no curl/wget dependency)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health', res => process.exit(res.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

# Run as non-root
USER appuser

# Start the application
CMD ["npm", "start"]
