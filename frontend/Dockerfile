# Multi-stage Dockerfile for Electron IoT Manager

# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Create runtime image with Electron
FROM node:18-alpine

# Install required dependencies for Electron
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb \
    dbus \
    gtk+3.0 \
    libnotify \
    libxss \
    libxtst \
    alsa-lib

# Set environment variables for Electron
ENV ELECTRON_DISABLE_SANDBOX=1
ENV DISPLAY=:99

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY main.cjs ./
COPY preload.cjs ./

# Expose port for development (if needed)
EXPOSE 5173

# Start Xvfb and run Electron
CMD ["sh", "-c", "Xvfb :99 -screen 0 1200x800x24 & npm run electron"]
