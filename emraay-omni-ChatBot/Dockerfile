# Simple Node.js based Dockerfile - no Nginx complications
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy .npmrc if it exists (for Azure Artifacts)
COPY .npmrc* ./

# Install dependencies
RUN npm ci || npm install

# Remove .npmrc for security
RUN rm -f .npmrc

# Copy source code
COPY . .

# Set build-time environment variables for Vite
ARG VITE_API_BASE_URL=http://localhost:3000/api
ARG VITE_API_MODE=live
ARG VITE_APP_TITLE=Staples Smart Shopper
ARG VITE_APP_LOCALE=en-CA

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_MODE=$VITE_API_MODE
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_APP_LOCALE=$VITE_APP_LOCALE

# Build the application
RUN npm run build

# Copy staples-hk web component assets into dist so /assets/*.entry.js are served (loader expects them at same origin)
RUN set -e; \
  if [ -d node_modules/staples-hk/dist/staples-hk/assets ]; then \
    mkdir -p dist/assets && cp -r node_modules/staples-hk/dist/staples-hk/assets/* dist/assets/; \
  elif [ -d node_modules/staples-hk/dist/staples-hk ]; then \
    cp -r node_modules/staples-hk/dist/staples-hk/* dist/; \
  elif [ -d node_modules/staples-hk/dist ]; then \
    cp -r node_modules/staples-hk/dist/* dist/; \
  fi

# Install a simple static file server
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve the built application on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
