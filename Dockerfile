# Stage 1: base for deps (keep dev deps for build)
FROM node:24-alpine AS base
WORKDIR /app
# Install all deps including dev (needed for tsc)
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

# Stage 2: build TypeScript
FROM base AS builder
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 3: prune to production deps only
FROM base AS deps
ENV NODE_ENV=production
RUN npm prune --omit=dev

# Stage 4: distroless runtime
FROM gcr.io/distroless/nodejs24
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV REPO_PATH="/images"
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["dist/index.js"]