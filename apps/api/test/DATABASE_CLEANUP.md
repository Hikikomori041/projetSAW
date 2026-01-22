# Nettoyage de la base de données E2E

## Problème résolu

Les tests E2E créaient des données dans la base de données MongoDB sans les nettoyer, ce qui saturait progressivement la base avec des données de test inutiles.

## Solution mise en place

### 1. Base de données séparée pour les tests

Un fichier `.env.test` a été créé avec une base de données dédiée :
```
MONGODB_URI=mongodb://localhost:27017/appli-saw-test
```

Cette base est automatiquement chargée lors de l'exécution des tests E2E grâce au fichier `test/setup-e2e.ts`.

### 2. Helper de nettoyage

Le fichier `test/helpers/database.helper.ts` contient deux fonctions :

- **`cleanDatabase(app)`** : Supprime toutes les collections de la base de données
- **`closeDatabase(app)`** : Ferme proprement la connexion à la base

### 3. Configuration des tests

Chaque fichier de test E2E utilise maintenant :

```typescript
afterEach(async () => {
  if (app) {
    await cleanDatabase(app);
    await app.close();
  }
}, 10000);
```

Cela garantit que :
- ✅ Les données sont nettoyées après chaque test
- ✅ La base de test reste propre
- ✅ Les tests sont isolés les uns des autres
- ✅ Aucune pollution de la base de production

## Utilisation

Les tests s'exécutent normalement :

```bash
npm run test:e2e
```

Vous verrez dans la console :
```
🧪 Tests E2E - Base de données: mongodb://localhost:27017/appli-saw-test
✅ Database cleaned successfully
```

## Base de données de production

La base de production (`appli-saw`) reste intacte et séparée de la base de test (`appli-saw-test`).
