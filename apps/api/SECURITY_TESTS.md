# Tests de Sécurité (Chiffrement) - Documentation

Ce document récapitule tous les tests de sécurité concernant le chiffrement des données.

## 📋 Vue d'ensemble

Des tests de sécurité complets ont été ajoutés pour garantir :

1. **Chiffrement des messages** - Vérification que les messages sont chiffrés en base de données
2. **Hachage des mots de passe** - Vérification que les mots de passe sont hashés avec bcrypt
3. **Restrictions des utilisateurs bannis** - Vérification qu'un utilisateur banni ne peut effectuer aucune action

## 🔐 Tests de Chiffrement des Messages

**Fichier :** `apps/api/test/unit/messages/message.entity.spec.ts`

### Encryption Security Tests

- ✅ **Chiffrement avant sauvegarde** : Vérifie que le contenu du message est chiffré avant d'être stocké en BDD
- ✅ **Format de chiffrement** : Vérifie le format `salt:iv:tag:data` (AES-256-GCM)
- ✅ **Déchiffrement correct** : Vérifie que les messages peuvent être déchiffrés correctement
- ✅ **Protection contre clé incorrecte** : Vérifie qu'un déchiffrement avec une mauvaise clé échoue
- ✅ **Chiffrement authentifié (GCM)** : Vérifie que toute modification du message chiffré est détectée
- ✅ **IV unique** : Vérifie qu'un IV différent est utilisé à chaque chiffrement (prévient les attaques par rejeu)
- ✅ **Salt unique** : Vérifie qu'un salt différent est utilisé pour la dérivation de clé (PBKDF2)
- ✅ **Validation des entrées** : Vérifie que les paramètres obligatoires sont requis
- ✅ **Format invalide** : Vérifie le rejet des données mal formatées
- ✅ **Caractères spéciaux** : Vérifie le support des accents, emojis, etc.
- ✅ **Messages longs** : Vérifie le chiffrement de messages de grande taille

### Security Best Practices

- ✅ **PBKDF2 avec 100k itérations** : Vérifie l'utilisation d'une dérivation de clé forte
- ✅ **Pas de fuite d'information** : Vérifie que les erreurs ne contiennent pas de texte en clair

### Algorithme utilisé

- **AES-256-GCM** : Chiffrement authentifié empêchant les modifications
- **PBKDF2** : Dérivation de clé avec 100 000 itérations (résistance aux attaques par force brute)

## 🔒 Tests de Hachage des Mots de Passe

**Fichier :** `apps/api/test/unit/users/users.service.spec.ts`

### Password Security Tests

- ✅ **Hachage avant sauvegarde** : Vérifie que `bcrypt.hash()` est appelé avant la sauvegarde
- ✅ **Stockage du hash uniquement** : Vérifie que le mot de passe en clair n'est jamais stocké
- ✅ **Format bcrypt** : Vérifie que le hash commence par `$2b$` (bcrypt v2b)
- ✅ **Salt rounds ≥ 10** : Vérifie l'utilisation d'au moins 10 rounds de hachage
- ✅ **Salt unique** : Vérifie que deux hachages du même mot de passe sont différents
- ✅ **Validation correcte** : Vérifie que `bcrypt.compare()` valide correctement les mots de passe
- ✅ **Hachage lors de la mise à jour** : Vérifie que les mots de passe sont hashés lors des updates
- ✅ **Pas d'exposition en clair** : Vérifie qu'aucune réponse ne contient le mot de passe en clair
- ✅ **Résistance aux timing attacks** : Vérifie que bcrypt prend un temps constant

### Algorithme utilisé

- **bcrypt** : Fonction de hachage adaptative spécialement conçue pour les mots de passe
- **10 rounds minimum** : Temps de calcul suffisant pour ralentir les attaques par force brute

## 🚫 Tests des Utilisateurs Bannis

### Tests Unitaires

**Fichier :** `apps/api/test/unit/auth/auth.service.spec.ts`

#### Tests améliorés

- ✅ **Raison du ban dans l'exception** : Vérifie que la raison du ban est incluse dans l'erreur
- ✅ **Message générique sans raison** : Vérifie un message par défaut si pas de raison
- ✅ **Vérification du ban avant mot de passe** : Empêche les timing attacks
- ✅ **Rejet avec token valide** : Vérifie qu'un token valide ne suffit pas pour un utilisateur banni
- ✅ **Pas de révélation d'existence** : Même erreur pour utilisateur inexistant ou mot de passe incorrect

### Tests E2E

**Fichier :** `apps/api/test/e2e/users/banned-users-security.e2e-spec.ts`

#### Banned User - Authentication

- ✅ **Empêcher la connexion** : Un utilisateur banni ne peut pas se connecter
- ✅ **Invalidation du token** : Le token existant est invalidé après un ban

#### Banned User - Channels Access

- ✅ **Empêcher le listage** : Un utilisateur banni ne peut pas lister les channels
- ✅ **Empêcher l'accès spécifique** : Ne peut pas accéder à un channel particulier
- ✅ **Empêcher la création** : Ne peut pas créer de nouveaux channels

#### Banned User - Messages

- ✅ **Empêcher l'envoi** : Ne peut pas envoyer de messages
- ✅ **Empêcher la lecture** : Ne peut pas lire les messages
- ✅ **Empêcher l'édition** : Ne peut pas éditer ses anciens messages
- ✅ **Empêcher la suppression** : Ne peut pas supprimer ses anciens messages

#### Banned User - Profile Updates

- ✅ **Empêcher la mise à jour** : Ne peut pas modifier son profil
- ✅ **Empêcher le listage** : Ne peut pas voir la liste des utilisateurs

#### Ban Reason Display

- ✅ **Affichage de la raison** : La raison du ban est affichée lors de la tentative de connexion
- ✅ **Message générique** : Message par défaut si pas de raison fournie

#### Recommendation

- 📝 **Débannissement** : Le test suggère d'ajouter un endpoint pour débannir un utilisateur

## 🎯 Couverture de Sécurité

### Principes de sécurité couverts

1. **Confidentialité** 🔐
   - Messages chiffrés en BDD (AES-256-GCM)
   - Mots de passe hashés (bcrypt)
   - Pas de données sensibles en clair

2. **Intégrité** ✓
   - Chiffrement authentifié (GCM) détecte les modifications
   - Validation des données
   - Contrôles d'accès stricts

3. **Authentification** 🔑
   - Validation des mots de passe sécurisée
   - Vérification du statut utilisateur (ban)
   - Tokens JWT validés

4. **Autorisation** 🚪
   - Utilisateurs bannis bloqués à tous les niveaux
   - Contrôle d'accès aux ressources
   - Séparation des rôles

5. **Protection contre les attaques** 🛡️
   - Anti timing attacks (bcrypt, vérification ban)
   - Anti replay attacks (IV unique)
   - Anti modification (GCM tag)
   - Anti énumération (messages d'erreur génériques)

## 🚀 Exécution des Tests

### Tests unitaires

```bash
npm run test:unit
```

### Tests E2E

```bash
npm run test:e2e
```

### Couverture des tests

```bash
npm run test:cov
```

## 🔍 Résumé des Vulnérabilités Adressées

| Vulnérabilité | Solution | Tests |
|---------------|----------|-------|
| Messages en clair en BDD | Chiffrement AES-256-GCM | ✅ 11 tests |
| Mots de passe en clair | Hachage bcrypt | ✅ 8 tests |
| Utilisateurs bannis actifs | Vérifications multi-niveaux | ✅ 20 tests |
| Timing attacks | bcrypt + vérifications constantes | ✅ 3 tests |
| Replay attacks | IV unique par message | ✅ 2 tests |
| Modification de données | GCM authentication tag | ✅ 1 test |
| Énumération d'utilisateurs | Messages d'erreur génériques | ✅ 1 test |

## ✅ Total des Tests de Sécurité

- **Tests unitaires de chiffrement** : 13 tests
- **Tests unitaires de mots de passe** : 8 tests
- **Tests unitaires utilisateurs bannis** : 5 tests
- **Tests E2E utilisateurs bannis** : 20 tests
