# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM node:18-alpine AS runner

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy the built application from the builder stage
COPY --from=builder /app/dist /app/dist

# Set environment variables
ENV NODE_ENV=production


# Command to run the application
CMD ["serve", "-s", "dist"]