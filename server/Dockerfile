FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "server.js"]
