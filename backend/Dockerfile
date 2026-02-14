FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json ./
# bun.lockb dosyası yoksa da çalışır
RUN bun install

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

RUN bun run db:generate

EXPOSE 3001
CMD ["bun", "run", "dev"]
