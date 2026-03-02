# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Run stage : Nginx sert le build et proxy /api vers le backend
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Supprimer la config par défaut et copier la nôtre
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
