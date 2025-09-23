FROM node:19-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy the rest of the app
COPY . .

# Expose port 19000 (Expo), 19001 (Metro), and 19002 (DevTools)
EXPOSE 19000 19001 19002

# Start Expo in development mode
CMD ["npm", "run", "start"]