# Guide d'organisation des tests

## Structure des tests

Les tests sont organisés en deux catégories principales :

### 1. Tests Unitaires (`test/unit/`)

Les tests unitaires testent les services et contrôleurs isolément avec des mocks.

```
test/unit/
├── auth/
│   ├── auth.service.spec.ts
│   └── auth.controller.spec.ts
├── channels/
│   └── channels.service.spec.ts
├── messages/
│   └── messages.service.spec.ts
└── users/
    └── users.service.spec.ts
```

**Couverture :**

- **Auth** : Enregistrement, connexion, validation d'utilisateur, rafraîchissement de token
- **Users** : CRUD, bannissement, gestion des rôles
- **Channels** : Création, suppression, rejoindre/quitter, autorisations
- **Messages** : Création, mise à jour, suppression, permissions

### 2. Tests E2E (`test/e2e/`)

Les tests E2E testent les endpoints avec une base de données réelle et un vrai serveur.

```
test/e2e/
├── auth/
│   └── auth.e2e-spec.ts
├── channels/
│   └── channels.e2e-spec.ts
└── messages/
    └── messages.e2e-spec.ts
```

**Couverture :**

- **Auth E2E** : Enregistrement, connexion, rafraîchissement, gestion des tokens
- **Channels E2E** : Création, récupération, rejoindre, quitter, suppression
- **Messages E2E** : Création, mise à jour, suppression, permissions

## Exécution des tests

### Tous les tests
```bash
npm test
```

### Tests unitaires uniquement
```bash
npm test -- --testPathPattern="unit"
```

### Tests E2E uniquement
```bash
npm test:e2e
```

### Tests d'une fonctionnalité
```bash
npm test -- --testPathPattern="auth"
```

### Avec couverture de code
```bash
npm test -- --coverage
```

## Cas d'utilisation couverts

### Authentification
- ✅ Enregistrement avec validation d'email et mot de passe
- ✅ Connexion avec vérification du compte banni
- ✅ Rafraîchissement de token
- ✅ Validation d'utilisateur
- ✅ Gestion des erreurs (email invalide, password faible, compte banni)

### Utilisateurs
- ✅ Création d'utilisateur
- ✅ Récupération par ID et email
- ✅ Mise à jour des infos
- ✅ Suppression de compte
- ✅ Bannissement avec username unique "[supprimé]-{id}"
- ✅ Récupération de tous les utilisateurs

### Salons
- ✅ Création de salon
- ✅ Récupération de tous les salons
- ✅ Récupération des détails d'un salon
- ✅ Rejoindre un salon
- ✅ Quitter un salon
- ✅ Suppression de salon (propriétaire uniquement)
- ✅ Autorisation basée sur la propriété et le rôle admin

### Messages
- ✅ Création de message
- ✅ Récupération des messages d'un salon
- ✅ Mise à jour de message (auteur uniquement)
- ✅ Suppression de message (auteur ou admin)
- ✅ Permissions et autorisations
- ✅ Validation du contenu

## Prochaines étapes recommandées

1. **Tests du socket.io** : Ajouter des tests pour les événements WebSocket
2. **Tests d'authentification admin** : Ajouter des tests pour les actions admin (suppression d'autres salons, etc.)
3. **Tests de performance** : Ajouter des tests de charge pour les opérations critiques
4. **Mocking amélioré** : Remplacer les mocks simples par des packages comme `mockito`
5. **Couverture de code** : Viser minimum 80% de couverture
