# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_BACKEND_API_URL
ARG VITE_GOOGLE_OAUTH_CLIENT_ID

# Set environment variables for Vite build
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_GOOGLE_OAUTH_CLIENT_ID=$VITE_GOOGLE_OAUTH_CLIENT_ID

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application with environment variables
RUN VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built application from builder stage
COPY --from=builder /app/dist /app/dist

# Set default port
ENV PORT=8080

# Expose the port
EXPOSE ${PORT}

# Start serve with SPA support
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]