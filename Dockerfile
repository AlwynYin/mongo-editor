# Use Node.js 20 as the base image
FROM node:20

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy the rest of the application files
COPY . .

# Install dependencies
RUN pnpm install

# Build the application
RUN pnpm run build

# Set the working directory to the server
WORKDIR /app/packages/server

# Expose the port
EXPOSE $PORT

# Start the application
CMD ["node", "dist/index.js"]