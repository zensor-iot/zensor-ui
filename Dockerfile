# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build only the client for production (skip SSR build to avoid module resolution issues)
RUN npm run build:client

# Production stage  
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Copy any additional required files
COPY --from=builder /app/index.html ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S zensor -u 1001
USER zensor

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:5173/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start the Express server
CMD ["npm", "start"] 
