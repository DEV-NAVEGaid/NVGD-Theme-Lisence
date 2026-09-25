# ---- deps: install production dependencies only ----
    FROM node:20-alpine AS deps
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci --omit=dev && npm cache clean --force
    
    # ---- runtime ----
    FROM node:20-alpine
    RUN apk add --no-cache tini
    ENV NODE_ENV=production \
        PORT=8080
    
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY package.json package-lock.json ./
    COPY src ./src
    COPY migrations ./migrations
    COPY scripts ./scripts
    
    USER node
    EXPOSE 8080
    
    HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
      CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
    
    ENTRYPOINT ["/sbin/tini", "--"]
    CMD ["sh", "-c", "node scripts/migrate.js && node src/index.js"]