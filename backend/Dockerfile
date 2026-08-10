FROM node:20-slim

# Install python3, python3-pip, ffmpeg, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip3
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

ENV YTDLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg

RUN npm run build

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
