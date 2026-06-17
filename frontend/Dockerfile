# ─── Build (TanStack Start + Nitro, preset node-server) ───
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# URL pública do backend, injetada no bundle em tempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build:docker

# ─── Runtime (servidor Node self-contained gerado pelo Nitro) ───
FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=build /app/.output ./.output

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
