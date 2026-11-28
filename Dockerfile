# syntax=docker/dockerfile:1
# Imagen de producción del backend de Exámenes ITAPU (build en 3 etapas).

# ---- 1. Compilar ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 2. Solo dependencias de producción ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- 3. Imagen final ----
FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Carpeta de PDFs: el volumen se monta acá y hereda este dueño (el usuario sin privilegios "node").
RUN mkdir -p /app/storage && chown node:node /app/storage
# Por defecto production. El .env puede pisarlo (solo para el primer arranque del seeder del SSO).
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
