# Backend Dockerfile - v2 (force rebuild)
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (with legacy peer deps to avoid conflicts)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create audio directory
RUN mkdir -p public/audio

EXPOSE 3001

CMD ["npm", "start"]
