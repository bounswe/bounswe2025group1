# Build stage
FROM node:19-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports 80 and 443
EXPOSE 80 443

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]