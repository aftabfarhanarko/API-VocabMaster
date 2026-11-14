FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Generate Prisma Client & Build Backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY backend/package*.json ./backend/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

WORKDIR /app/backend

EXPOSE 4000
CMD ["node", "dist/main"]
