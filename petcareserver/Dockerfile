FROM node:20-alpine3.22 AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:20-alpine3.22 AS production

WORKDIR /app

COPY package*.json ./
# Install all deps (including ts-node for seed script), then prune dev later
RUN npm ci

# Copy built application
COPY --from=development /app/dist ./dist
COPY --from=development /app/scripts ./scripts
COPY --from=development /app/tsconfig.build.json ./tsconfig.build.json
COPY --from=development /app/tsconfig.json ./tsconfig.json

EXPOSE 8080

# Run seed then start app
CMD ["sh", "-c", "npm run seed && node dist/src/main.js"]
