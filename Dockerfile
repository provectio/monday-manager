# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev + prod) pour le build
RUN npm ci

# Copier le code source
COPY . .

# Build de l'application avec les variables d'environnement
ARG VITE_MONDAY_API_TOKEN
ARG VITE_MONDAY_API_ENDPOINT
ARG VITE_MONDAY_API_VERSION
ARG VITE_MONDAY_WORKSPACE_ID

ENV VITE_MONDAY_API_TOKEN=$VITE_MONDAY_API_TOKEN
ENV VITE_MONDAY_API_ENDPOINT=$VITE_MONDAY_API_ENDPOINT
ENV VITE_MONDAY_API_VERSION=$VITE_MONDAY_API_VERSION
ENV VITE_MONDAY_WORKSPACE_ID=$VITE_MONDAY_WORKSPACE_ID

RUN npm run build

# Stage de production avec Nginx
FROM nginx:alpine AS production

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Créer le répertoire pour les logs
RUN mkdir -p /var/log/nginx

# Exposer le port
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
