# Guide d'exécution des tests

## 📋 Vue d'ensemble

Les tests sont organisés en deux catégories :
- **Tests unitaires** (`test/unit/`) : Testent les services et contrôleurs avec des mocks
- **Tests e2e** (`test/e2e/`) : Testent l'application complète avec un serveur réel

## 🚀 Commandes de test

### Depuis la racine du projet
```bash
# Tous les tests (unitaires + e2e)
npm test:all

# Seulement les tests unitaires
npm run test:unit

# Seulement les tests e2e
npm run test:e2e

# Tests avec couverture
npm run test:coverage

# Tests en mode watch (relance automatique)
npm run test:unit:watch
npm run test:e2e:watch
```

### Depuis le dossier `apps/api/`
```bash
# Tous les tests
npm run test

# Tests unitaires uniquement
npm run test:unit

# Tests unitaires en mode watch
npm run test:unit:watch

# Tests unitaires avec couverture
npm run test:unit:cov

# Tests e2e
npm run test:e2e

# Tests e2e en mode watch
npm run test:e2e:watch

# Tous les tests (unitaires + e2e)
npm run test:all
```

## 📂 Structure des tests

```
test/
├── unit/                          # Tests unitaires avec mocks
│   ├── auth/
│   │   ├── auth.service.spec.ts
│   │   └── auth.controller.spec.ts
│   ├── channels/
│   │   └── channels.service.spec.ts
│   ├── messages/
│   │   └── messages.service.spec.ts
│   └── users/
│       └── users.service.spec.ts
│
├── e2e/                          # Tests d'intégration complète
│   ├── auth/
│   │   └── auth.e2e-spec.ts
│   ├── channels/
│   │   └── channels.e2e-spec.ts
│   └── messages/
│       └── messages.e2e-spec.ts
│
├── jest.json                     # Config Jest (ancienne, conservée)
├── jest-unit.json               # Config Jest pour tests unitaires
├── jest-e2e.json               # Config Jest pour tests e2e (ancienne)
└── jest-e2e-new.json           # Config Jest pour nouveaux tests e2e
```

## ✅ Cas de test couverts

### Authentication
- ✅ Enregistrement d'un nouvel utilisateur
- ✅ Connexion avec identifiants valides
- ✅ Rejet avec email invalide
- ✅ Rejet avec mot de passe faible
- ✅ Validation des utilisateurs bannis
- ✅ Rafraîchissement des tokens

### Channels
- ✅ Création de salon
- ✅ Lister les salons
- ✅ Récupérer les détails du salon
- ✅ Rejoindre un salon
- ✅ Quitter un salon
- ✅ Supprimer un salon (propriétaire/admin uniquement)
- ✅ Contrôle d'accès et autorisation

### Messages
- ✅ Créer un message
- ✅ Lister les messages d'un salon
- ✅ Modifier son propre message
- ✅ Supprimer son propre message
- ✅ Rejet de modification par un utilisateur non-auteur
- ✅ Rejet de suppression par un utilisateur non-auteur

### Users
- ✅ Créer un utilisateur
- ✅ Récupérer un utilisateur par ID
- ✅ Récupérer un utilisateur par email
- ✅ Mettre à jour un utilisateur
- ✅ Supprimer un utilisateur
- ✅ Bannir un utilisateur (avec username unique)
- ✅ Lister tous les utilisateurs

## 🔍 Exemple d'exécution

```bash
# Lancer tous les tests avec rapport de couverture
cd apps/api
npm run test:unit:cov
npm run test:e2e

# Ou depuis la racine
npm run test:all
npm run test:coverage
```

## 🐛 Débogage

### Mode debug pour tests unitaires
```bash
npm run test:debug
```

### Mode watch pour itération rapide
```bash
# Relancer les tests unitaires automatiquement
npm run test:unit:watch

# Relancer les tests e2e automatiquement
npm run test:e2e:watch
```

## 📊 Couverture

La couverture des tests est générée dans `coverage/` avec deux rapports :
- `coverage/unit/` : Couverture des tests unitaires
- `coverage/e2e/` : Couverture des tests e2e

Ouvrir `coverage/lcov-report/index.html` pour voir le rapport HTML.

## ⚠️ Conditions préalables

1. **Base de données MongoDB** : Les tests e2e ont besoin d'une MongoDB fonctionnelle
2. **Variables d'environnement** : Assurer que `apps/api/.env` est configuré correctement
3. **Dépendances installées** : `npm install` doit avoir été exécuté

## 🔗 Fichiers de configuration

- `apps/api/package.json` : Scripts et dépendances
- `apps/api/test/jest-unit.json` : Configuration Jest pour tests unitaires
- `apps/api/test/jest-e2e-new.json` : Configuration Jest pour tests e2e
- `apps/api/test/jest.json` : Configuration Jest par défaut (anciennes structures)
- `apps/api/jest.config.js` : Configuration Jest globale (si elle existe)
