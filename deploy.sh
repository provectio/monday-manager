#!/bin/bash

# Script de déploiement pour Monday Manager
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="monday-manager"
DOCKER_DIR="/opt/docker/monday-manager"

echo "🚀 Déploiement de Monday Manager en mode $ENVIRONMENT"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Créer le répertoire de déploiement
echo "📁 Création du répertoire de déploiement..."
sudo mkdir -p $DOCKER_DIR
sudo chown $USER:$USER $DOCKER_DIR

# Copier les fichiers nécessaires
echo "📋 Copie des fichiers de configuration..."
cp docker-compose.yml $DOCKER_DIR/
cp Dockerfile $DOCKER_DIR/
cp nginx.conf $DOCKER_DIR/
cp -r monitoring $DOCKER_DIR/

# Copier le code source
echo "📦 Copie du code source..."
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' . $DOCKER_DIR/

# Aller dans le répertoire de déploiement
cd $DOCKER_DIR

# Créer le fichier .env si il n'existe pas
if [ ! -f .env ]; then
    echo "⚙️ Création du fichier .env..."
    cp env.example .env
    echo "⚠️  N'oubliez pas de configurer les variables d'environnement dans .env"
fi

# Construire et démarrer les services
echo "🔨 Construction des images Docker..."
docker-compose build --no-cache

echo "🚀 Démarrage des services..."
docker-compose up -d

# Vérifier le statut des services
echo "🔍 Vérification du statut des services..."
docker-compose ps

# Afficher les logs
echo "📊 Logs des services:"
docker-compose logs --tail=50

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: http://localhost:3010"
echo "📊 Grafana disponible sur: http://localhost:3000"
echo "📈 Prometheus disponible sur: http://localhost:9090"

# Commandes utiles
echo ""
echo "🔧 Commandes utiles:"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Redémarrer: docker-compose restart"
echo "  - Arrêter: docker-compose down"
echo "  - Mise à jour: docker-compose pull && docker-compose up -d"
