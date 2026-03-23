FROM node:20-alpine3.22 AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:dev"]

FROM node:20-alpine3.22 AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=development /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/main.js"]
