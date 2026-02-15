FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN bun install --frozen-lockfile

COPY . .
RUN bun run --filter backend build

WORKDIR /app/apps/backend
EXPOSE 8000

CMD ["bun", "dist/index.js"]
