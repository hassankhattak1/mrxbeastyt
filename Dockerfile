# Use Node 20 slim as base image
FROM node:20-slim

# Install ffmpeg, python3, curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download standalone Linux yt-dlp binary to /usr/local/bin/yt-dlp
RUN curl -L -o /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package metadata and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000
ENV YTDLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=ffmpeg

# Build Next.js application
RUN npm run build

# Expose server port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]
