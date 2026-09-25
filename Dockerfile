FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV PORT=8080
EXPOSE 8080
USER node

# Apply pending migrations, then start (same pattern as the team's Shopify app)
CMD ["sh", "-c", "node scripts/migrate.js && node src/index.js"]
