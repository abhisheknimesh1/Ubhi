# Ubhi backend — production container image.
#
# Pure-JS dependencies only (no native builds), so a slim Alpine base is enough.
# Build:  docker build -t ubhi-backend .
# Run:    docker run --rm -p 8090:8090 --env-file .env ubhi-backend
#
# In docker-compose this image is the "api" service and talks to the "db"
# Postgres service via DATABASE_URL. See docker-compose.yml.

FROM node:18-alpine

# Small init so SIGTERM is forwarded and zombie processes are reaped.
RUN apk add --no-cache tini

# App lives here.
WORKDIR /app

# Run as the unprivileged "node" user that ships with the image (not root).
ENV NODE_ENV=production

# Install dependencies first so this layer is cached unless the manifests change.
# Copy lockfile too when present (the glob keeps the build working without one).
COPY package.json package-lock.json* ./

# Production install only — devDependencies are skipped. "pg" is an
# optionalDependency, so it installs cleanly here and is available when
# DATABASE_URL is set. --no-audit/--no-fund keep the build output quiet.
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the application source.
COPY . .

# The JSON file store writes to /app/db/data when no DATABASE_URL is set.
# Pre-create it and hand ownership to the runtime user so writes succeed.
RUN mkdir -p /app/db/data && chown -R node:node /app

USER node

# Documented default port — config.js reads PORT from the environment (8090).
EXPOSE 8090

# tini as PID 1, then the server. "npm start" runs "node server.js".
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
