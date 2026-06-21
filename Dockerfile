# Multi-stage build for SvelteKit with adapter-node (see personal-site)
FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Vosk speech model (~40 MB, gitignored — fetched at build time)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl unzip && \
	mkdir -p static/models && cd static/models && \
	curl -LO https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip && \
	unzip -q vosk-model-small-en-us-0.15.zip && \
	tar czf vosk-model-small-en-us-0.15.tar.gz vosk-model-small-en-us-0.15 && \
	rm -rf vosk-model-small-en-us-0.15 vosk-model-small-en-us-0.15.zip && \
	cd /app && \
	apt-get purge -y curl unzip && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN pnpm run build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
	adduser --system --uid 1001 sveltekit
USER sveltekit

COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./
COPY --from=builder --chown=sveltekit:nodejs /app/recipes ./recipes
COPY --from=deps --chown=sveltekit:nodejs /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "build"]
