# Projet du cours de Sécurité des Applications Web (partie application)

## Groupe - équipe INDIA

Étudiants IL : BLACHÈRE Nicolas et ORTEGA Erwan

Étudiants SIRAV : ZOUARI Sami et SOUDANI Younes

## Description

Un “discord-like” simplifié.

Les visiteurs voient une page d’accueil décrivant l’application et permettant d’accéder à une page de connexion / création de compte.

Les utilisateurs inscrits voient une page listant les salons auxquels ils ont accès, avec la possibilité de créer un salon (qui leur donne un lien d’invitation à envoyer).
Ils peuvent lire et envoyer des messages de façon sécurisée dans leur salon.

## Architecture du projet

```text
appli-saw/
├── apps/
│   ├── api/              # Backend NestJS
│   │   ├── src/          # Code source
│   │   │   ├── auth/     # Authentification JWT
│   │   │   ├── channels/ # Gestion des salons
│   │   │   ├── messages/ # Gestion des messages + WebSocket
│   │   │   ├── users/    # Gestion des utilisateurs
│   │   │   └── email/    # Service d'envoi d'emails
│   │   └── test/         # Tests unitaires et e2e
│   │       ├── unit/     # Tests unitaires (services, controllers, gateway)
│   │       └── e2e/      # Tests end-to-end
│   └── client/           # Frontend React + TypeScript
│       └── src/
│           ├── components/
│           ├── hooks/
│           ├── pages/
│           └── utils/
└── docker-compose.yml    # MongoDB + configuration
```

## Prérequis

- Node.js (v18+)
- npm ou yarn
- Docker & Docker Compose (pour MongoDB)

## Installation

### 1. Cloner le repository

```bash
git clone <url-du-repo>
cd appli-saw
```

### 2. Installer les dépendances

```bash
# Backend
cd apps/api
npm install

# Frontend
cd ../client
npm install
```

### 3. Lancer MongoDB avec Docker

```bash
# À la racine du projet
docker-compose up -d
```

## Démarrage de l'application

### Backend (API)

```bash
cd apps/api
npm run start:dev  # Mode développement avec hot-reload
```

L'API sera accessible sur `http://localhost:3000`.

### Frontend (Client)

```bash
cd apps/client
npm run dev
```

Le client sera accessible sur `http://localhost:5173`.

## Tests

### Backend - Tests unitaires

```bash
cd apps/api

# Lancer tous les tests unitaires
npm run test:unit

# Lancer les tests avec couverture
npm run test:unit:cov

# Lancer les tests en mode watch
npm run test:unit:watch
```

### Backend - Tests e2e

```bash
cd apps/api
npm run test:e2e
```

### Configuration des tests

Les tests sont organisés dans `apps/api/test/` :

- `test/unit/` : tests unitaires par module (auth, users, channels, messages)
- `test/e2e/` : tests end-to-end pour l'API complète
- `jest-unit.json` : configuration Jest pour les tests unitaires
- `jest-e2e.json` : configuration Jest pour les tests e2e

## Fonctionnalités implémentées

### Authentification

- ✅ Inscription avec validation des données
- ✅ Connexion avec JWT
- ✅ Protection des routes avec `JwtAuthGuard`
- ✅ Gestion des rôles (user/admin)

### Salons (Channels)

- ✅ Création de salon (utilisateurs)
- ✅ Rejoindre via lien d'invitation
- ✅ Quitter un salon
- ✅ Suppression (propriétaire ou admin avec justification)
- ✅ Copie du lien d'invitation

### Messages

- ✅ Envoi de messages en temps réel (WebSocket)
- ✅ Édition de ses propres messages
- ✅ Suppression de messages (auteur ou admin)
- ✅ Notification par email en cas de suppression par admin
- ✅ Anonymisation des messages d'utilisateurs supprimés "[supprimé]"

### Administration

- ✅ Bannissement d'utilisateurs
- ✅ Suppression de messages/salons avec justification
- ✅ Notifications email automatiques
- ✅ Actions admin tracées

### UI/UX

- ✅ Design responsive avec Tailwind CSS + DaisyUI
- ✅ Toasts non-bloquants pour les notifications (succès/erreur/info/warning)
- ✅ Menus contextuels (clic droit)
- ✅ Modales de confirmation

## Pour les développeurs

### Variables d'environnement

Créer un fichier `.env` dans `apps/api/` :

```env
MONGODB_URI=mongodb://localhost:27017/appli-saw
JWT_SECRET=votre_secret_jwt_super_securise
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=votre-email@example.com
SMTP_PASS=votre-mot-de-passe
```

### Scripts utiles

```bash
# Backend
npm run start:dev      # Démarrage avec hot-reload
npm run build          # Build de production
npm run test:unit:cov  # Tests + couverture
npm run lint           # Linter

# Frontend
npm run dev            # Démarrage Vite dev server
npm run build          # Build de production
npm run preview        # Preview du build
```

### Endpoints API principaux

- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /channels` - Liste des salons accessibles
- `POST /channels` - Créer un salon
- `POST /channels/:id/join` - Rejoindre un salon
- `GET /messages/:channelId` - Messages d'un salon
- `POST /messages` - Envoyer un message
- `PATCH /messages/:id` - Modifier un message
- `DELETE /messages/:id` - Supprimer un message
- `POST /users/:id/ban` - Bannir un utilisateur (admin)

## Licence

Projet Master 2 Informatique - Sécurité des Applications Web
