# Stage 1: Build the application
FROM node:lts-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./ 
# Prefer pnpm if lock file exists, then yarn, then npm
RUN --mount=type=cache,target=/root/.npm \
    if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; \
    fi

COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:lts-alpine

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built application and production dependencies
# Ensure files are owned by the non-root user
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/src/views ./dist/views
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup package.json ./

# Set environment variables
ENV NODE_ENV=production

# Install wget for the healthcheck command before switching user
RUN apk add --no-cache wget

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Add a healthcheck
# Note: wget might not be available by default in alpine if not installed.
# If healthcheck fails due to wget, consider adding 'RUN apk add --no-cache wget'
# or using a Node.js based healthcheck script.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
