# Build context is the repo root (npm workspaces share one lockfile): docker compose handles this.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend
COPY backend backend
RUN npm run build -w backend

FROM node:24-alpine AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production
COPY --from=production-dependencies /app /app
WORKDIR /app/backend
COPY --from=build /app/backend/dist ./dist
# The official image's unprivileged user: the API needs no root rights.
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
