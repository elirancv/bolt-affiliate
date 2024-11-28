# Build stage
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies with cache mount for faster installs
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy only necessary files
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY env-config.js ./

# Build the project
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy the built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY env-config.js /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
