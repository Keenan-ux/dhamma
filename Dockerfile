FROM node:22-slim AS web
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-slim AS server
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY server/package.json ./
RUN npm install --omit=dev

# Pre-cache BGE-M3 quantized weights into the image (~265 MB). Running
# container can then boot without a Hugging Face round-trip.
ENV MODEL_CACHE_DIR=/app/.model-cache
COPY server/scripts ./scripts
RUN node scripts/cache-model.mjs

COPY server/src ./src
COPY server/sql ./sql
COPY --from=web /web/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
