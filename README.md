# Monday Project Manager

Une application web moderne et professionnelle pour créer et gérer des projets avec des modules dans Monday.com.

## 🚀 Fonctionnalités

### ✨ Création de projets
- Interface intuitive en 2 étapes pour créer des projets
- Validation automatique des noms de projets (numéros de commande Salesforce)
- Vérification de l'unicité des noms de projets
- Animation de confirmation lors de la création

### 📦 Gestion des modules
- **5 modules disponibles** : Infrastructure, Telecom, Cloud, Cybersécurité, Infogérance
- Création automatique de groupes dans Monday.com
- Tâches prédéfinies pour chaque module
- Ajout/suppression de modules dynamique

### 🎨 Interface moderne
- **Thèmes clair et sombre** avec basculement en un clic
- **Vue en mode carte** avec informations détaillées
- **Vue en mode liste** pour une navigation rapide
- Animations fluides avec Framer Motion
- Design responsive et accessible

### 🔧 Gestion avancée
- **Synchronisation en temps réel** avec Monday.com
- **Actualisation des données** avec détection des changements
- **Gestion des erreurs** avec messages informatifs
- **Indicateur de statut API** en temps réel

## 🛠️ Technologies utilisées

- **Frontend** : React 18 + TypeScript
- **Build Tool** : Vite
- **Styling** : Tailwind CSS
- **State Management** : Zustand
- **API Client** : Apollo Client (GraphQL)
- **Icons** : Heroicons
- **Animations** : Framer Motion
- **Routing** : React Router

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Monday.com avec token API

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd monday-project-manager
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer l'application**
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 🔑 Configuration de l'API Monday

1. **Créer le fichier de configuration** :
   ```bash
   # Copiez le fichier d'exemple
   cp env.example .env.local
   ```

2. **Configurer vos variables** :
   - Ouvrez le fichier `.env.local`
   - Remplacez `your_api_token_here` par votre token API Monday
   - Ajustez les autres paramètres si nécessaire

3. **Obtenir votre token API** :
   - Connectez-vous à Monday.com
   - Cliquez sur votre avatar → Administration
   - Connexions → Jeton API personnel
   - Copiez votre token

4. **Redémarrer l'application** :
   ```bash
   npm run dev
   ```

## 📖 Guide d'utilisation

### Créer un projet

1. **Cliquez sur "Nouveau Projet"**
2. **Étape 1** : Entrez le numéro de commande Salesforce
   - L'application vérifie automatiquement l'unicité
3. **Étape 2** : Sélectionnez les modules souhaités
   - Chaque module crée un groupe dans Monday
   - Des tâches prédéfinies sont ajoutées automatiquement
4. **Cliquez sur "Créer le projet"**
   - Animation de confirmation
   - Redirection vers le tableau de bord

### Gérer les modules

1. **Accédez aux paramètres du projet** (icône ⚙️ sur chaque carte)
2. **Ajouter un module** :
   - Cliquez sur "Ajouter un module"
   - Sélectionnez parmi les modules disponibles
3. **Supprimer un module** :
   - Cliquez sur l'icône 🗑️ du module
   - Confirmation automatique
4. **Actualiser les données** :
   - Cliquez sur "Actualiser" pour synchroniser avec Monday

### Navigation

- **Tableau de bord** : Vue d'ensemble de tous les projets
- **Mode carte** : Affichage détaillé avec statistiques
- **Mode liste** : Vue compacte pour navigation rapide
- **Paramètres** : Configuration API et thèmes

## 🎨 Personnalisation

### Thèmes
- **Thème clair** : Interface claire et moderne
- **Thème sombre** : Mode sombre pour réduire la fatigue oculaire
- Basculement instantané via l'icône 🌙/☀️

### Modules personnalisés
Les modules sont définis dans `src/pages/CreateProject.tsx` :
```typescript
const MODULE_TYPES = [
  { type: 'Infrastructure', name: 'Infrastructure', color: '#3B82F6' },
  // Ajoutez vos modules ici
];
```

## 🔧 Développement

### Structure du projet
```
src/
├── components/          # Composants réutilisables
├── pages/              # Pages de l'application
├── services/           # Services API
├── store/              # Gestion d'état (Zustand)
├── types/              # Types TypeScript
└── App.tsx             # Point d'entrée
```

### Scripts disponibles
```bash
npm run dev          # Développement
npm run build        # Build de production
npm run preview      # Aperçu du build
npm run lint         # Linting
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion API**
   - Vérifiez votre token API
   - Testez la connexion dans Paramètres
   - Vérifiez votre connexion internet

2. **Projet non créé**
   - Vérifiez que le nom n'existe pas déjà
   - Assurez-vous d'avoir les permissions Monday
   - Consultez la console pour les erreurs

3. **Modules non synchronisés**
   - Cliquez sur "Actualiser" dans les paramètres du projet
   - Vérifiez que les groupes existent dans Monday

## 📝 Notes importantes

- **Synchronisation** : L'application se synchronise avec Monday.com en temps réel
- **Sécurité** : Le token API est stocké localement dans le navigateur
- **Performance** : Optimisé pour de gros volumes de projets
- **Responsive** : Compatible mobile et desktop

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation Monday.com
- Vérifiez les logs de la console navigateur

---

**Développé avec ❤️ pour optimiser la gestion de projets Monday.com**
