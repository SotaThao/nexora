# Use the official Node.js 20 image as the base image (Vite requires 20.19+)
FROM node:20-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Set the working directory in the container
WORKDIR /app

# Copy lockfile and manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies using frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build argument to specify build environment (production, staging, test, development)
ARG BUILD_ENV=production
ARG VITE_APP_ENV=production
ARG VITE_API_BASE_URL=
ARG VITE_DATA_SOURCE=storage
ARG VITE_ENABLE_DEMO_TOOLS=false
ARG VITE_SENTRY_ENV=
ARG VITE_SENTRY_DSN=
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_MAPBOX_TOKEN=
ARG VITE_MAP_MARKER_ENGINE=advanced
ARG VITE_GOOGLE_MAPS_MAP_ID=
ARG VITE_VLINKPAY_WEB_URL_BASE=

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE
ENV VITE_ENABLE_DEMO_TOOLS=$VITE_ENABLE_DEMO_TOOLS
ENV VITE_SENTRY_ENV=$VITE_SENTRY_ENV
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_MAP_MARKER_ENGINE=$VITE_MAP_MARKER_ENGINE
ENV VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID
ENV VITE_VLINKPAY_WEB_URL_BASE=$VITE_VLINKPAY_WEB_URL_BASE

# Build the application based on the environment
RUN if [ "$BUILD_ENV" = "production" ]; then \
    pnpm run build:prod; \
  elif [ "$BUILD_ENV" = "staging" ]; then \
    pnpm run build:staging; \
  elif [ "$BUILD_ENV" = "test" ]; then \
    pnpm run build:test; \
  else \
    pnpm run build:dev; \
  fi

# Use nginx to serve the built application
FROM nginx:alpine

# Install curl for health checks
RUN apk --no-cache add curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built application from the builder stage to the nginx container
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]