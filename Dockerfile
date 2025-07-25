FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./


# Install dependencies
RUN npm install --include=dev
# npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3003

# Start the application
CMD ["npm", "start"]
