# Backend Dockerfile - v3
FROM node:20-slim

WORKDIR /app

# Skip puppeteer chromium download (not needed in production)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files
COPY package.json ./

# Install dependencies (with legacy peer deps to avoid conflicts)
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create audio directory
RUN mkdir -p public/audio

EXPOSE 3001

CMD ["npm", "start"]
