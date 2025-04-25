# ---------- Build Stage ----------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build
    
    # ---------- Production Stage ----------
    FROM node:20-alpine
    
    # Install static server
    RUN npm install -g serve
    
    WORKDIR /app
    
    # Copy build output from builder
    COPY --from=builder /app/dist ./dist
    
    EXPOSE 5137
    
    # Serve the build
    CMD ["serve", "-s", "dist"]
    