# Backend Dockerfile
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (including dev deps for build)
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create audio directory
RUN mkdir -p public/audio

EXPOSE 3001

CMD ["npm", "start"]
