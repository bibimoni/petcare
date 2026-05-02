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

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY --from=development /app/dist ./dist
COPY --from=development /app/src ./src
COPY --from=development /app/scripts ./scripts
COPY --from=development /app/tsconfig.build.json ./tsconfig.build.json
COPY --from=development /app/tsconfig.json ./tsconfig.json

EXPOSE 8080

CMD ["sh", "-c", "npm run seed && npm run seed:deploy && node dist/src/main.js"]
