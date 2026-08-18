# Multi-stage Dockerfile para SaaS Fiscal Multi-Tenant (NestJS 11 + React 19 / Vite)

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package.json package-lock.json* bun.lock* ./
RUN npm ci

# Copia código fonte e prisma
COPY . .

# Gera cliente Prisma e compila aplicação
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas o necessário para produção
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
