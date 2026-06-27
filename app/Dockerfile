FROM node:22-slim AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --no-fund --no-audit
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --no-fund --no-audit
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
