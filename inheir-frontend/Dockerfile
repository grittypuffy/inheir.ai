FROM oven/bun:1.2 AS builder

WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.2 AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

EXPOSE 3000
CMD ["bun", "start"]