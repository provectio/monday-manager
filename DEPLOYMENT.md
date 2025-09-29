# 🚀 Guide de Déploiement - Monday Manager

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 2GB RAM minimum
- 10GB espace disque

## 🐳 Déploiement avec Docker

### 1. Cloner le repository
```bash
git clone https://github.com/provectio/monday-manager.git
cd monday-manager
```

### 2. Configuration
```bash
# Copier le fichier d'environnement
cp env.example .env

# Éditer les variables d'environnement
nano .env
```

### 3. Déploiement automatique
```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Déployer
./deploy.sh production
```

### 4. Déploiement manuel
```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

## 🔧 Configuration

### Variables d'environnement importantes

```bash
# Monday.com API
MONDAY_API_TOKEN=your_token_here
MONDAY_WORKSPACE_ID=your_workspace_id

# Base de données
POSTGRES_PASSWORD=secure_password_123

# Sécurité
JWT_SECRET=very_long_secret_key_here
```

### Ports utilisés

- **3010** : Application principale
- **3000** : Grafana (monitoring)
- **9090** : Prometheus (métriques)
- **5432** : PostgreSQL
- **6379** : Redis

## 📊 Monitoring

### Grafana
- URL: http://localhost:3000
- Login: admin
- Password: configuré dans GRAFANA_PASSWORD

### Prometheus
- URL: http://localhost:9090
- Métriques des services

## 🔄 Maintenance

### Mise à jour
```bash
cd /opt/docker/monday-manager
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Sauvegarde
```bash
# Sauvegarder les données
docker-compose exec postgres pg_dump -U monday_user monday_manager > backup.sql

# Sauvegarder Redis
docker-compose exec redis redis-cli BGSAVE
```

### Logs
```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f monday-manager
```

## 🛠️ Dépannage

### Redémarrer un service
```bash
docker-compose restart monday-manager
```

### Voir les ressources utilisées
```bash
docker stats
```

### Nettoyer les images inutilisées
```bash
docker system prune -a
```

## 🔒 Sécurité

- Changez tous les mots de passe par défaut
- Configurez un firewall
- Utilisez HTTPS en production
- Sauvegardez régulièrement les données

## 📞 Support

Pour toute question ou problème :
- GitHub Issues: https://github.com/provectio/monday-manager/issues
- Email: support@provectio.com
