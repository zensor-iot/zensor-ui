FROM node:20-alpine AS builder

ARG CACHE_BUST=1
RUN echo "Cache bust: $CACHE_BUST"

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./
COPY server/ ./server/

RUN npm run build:client

FROM node:20-alpine AS production

ARG CACHE_BUST=1
RUN echo "Cache bust: $CACHE_BUST"

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

COPY --from=builder /app/index.html ./

RUN addgroup -g 1001 -S nodejs
RUN adduser -S zensor -u 1001
USER zensor

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:5173/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

CMD ["npm", "start"] 
