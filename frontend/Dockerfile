# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install

# Copy source code and build
COPY . .

# Accept build argument and set as environment variable
ARG VITE_API_BASE_URL=https://flujo-backend-536388050352.us-south1.run.app
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Production stage
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Remove default nginx config and copy our Cloud Run specific config template
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx-cloudrun.template.conf /etc/nginx/templates/default.conf.template

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose the port the container will listen on
EXPOSE 80

# Run the entrypoint script
ENTRYPOINT ["entrypoint.sh"]
CMD [] 