FROM node:22-slim AS build
WORKDIR /usr/src/web
COPY package*.json ./
RUN npm ci --no-fund --no-audit
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /usr/src/web
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --no-fund --no-audit
COPY --from=build /usr/src/web/.next ./.next
EXPOSE 3001
CMD ["npm", "run", "start", "--", "-p", "3001"]
