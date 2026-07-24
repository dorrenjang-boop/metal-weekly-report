# 1. Build the React/Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Build the Node.js Backend
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy the source directory so db.js can parse the xlsx files
COPY source/ /app/source/

# 3. Copy built frontend files to the expected directory
# server_cloud.js expects them at ../frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# 4. Expose Port 80 as defined in server_cloud.js
EXPOSE 80

# 5. Start the server
CMD ["node", "server_cloud.js"]
