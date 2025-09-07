FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json turbo.json ./
COPY api/package*.json api/
RUN npm ci --include=dev

FROM deps AS build
WORKDIR /app
COPY . .
RUN npx turbo run build --filter=api...

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/main.js"]
