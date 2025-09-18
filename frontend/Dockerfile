# --- build stage ---
FROM node:20-bullseye-slim AS build
WORKDIR /app

# 👇 ключевая строка — отключаем нативный rollup
ENV ROLLUP_SKIP_NODE_NATIVE=1

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
