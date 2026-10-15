# ---- Build stage ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Botkeep (and most hosts) inject PORT; default 3000 locally.
ENV PORT=3000
EXPOSE 3000

# One non-interactive process, logs to stdout/stderr.
CMD ["node", "dist/http.js"]
