# Chiffrement des Messages

## Vue d'ensemble

Les messages stockés en base de données sont automatiquement chiffrés pour protéger la confidentialité des utilisateurs. Le système utilise **AES-256-GCM** qui est un standard de chiffrement fort et moderne.

## Comment ça fonctionne ?

### Architecture

1. **Chiffrement automatique** : Quand un message est sauvegardé, il est automatiquement chiffré avant d'être stocké en MongoDB
2. **Déchiffrement automatique** : Quand un message est lu depuis la DB, il est automatiquement déchiffré avant d'être envoyé au front
3. **Transparent pour l'application** : Le code métier n'a pas besoin de gérer le chiffrement/déchiffrement

### Détails techniques

#### Algorithme : AES-256-GCM

- **AES-256** : Advanced Encryption Standard avec clé de 256 bits
- **GCM** : Galois/Counter Mode - offre :
  - Chiffrement rapide
  - Authentification des données (détecte les modifications)
  - Protection contre les attaques par rejeu

#### Sécurité renforcée

- **Salt unique** : Chaque message a un salt aléatoire de 64 octets
- **IV unique** : Chaque message a un vecteur d'initialisation (IV) aléatoire de 16 octets
- **Tag d'authentification** : Garantit l'intégrité du message (16 octets)
- **PBKDF2** : Dérivation de clé avec 100,000 itérations pour renforcer la clé

#### Format de stockage

Les messages chiffrés sont stockés au format : `salt:iv:tag:encryptedData` (en base64)

Exemple :
```
Y3J5cHRvLXJhbmRvbS1zYWx0LTY0Ym==:aXYtMTZieXRlcw==:dGFnLTE2Ynl0ZXM=:Y2hpZmZyZWRhdGE=
```

### Configuration

La clé de chiffrement est définie dans le fichier `.env` :

```env
ENCRYPTION_KEY=cle-de-chiffrement-super-secrete-changez-moi-en-production-12345
```

⚠️ **IMPORTANT** : En production, utilisez une clé forte et unique !

Pour générer une clé sécurisée :
```bash
# Sous Linux/Mac
openssl rand -base64 32

# Sous Windows (PowerShell)
$key = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Output $key
```

## Avantages

✅ **Confidentialité** : Les messages sont illisibles en base de données  
✅ **Conformité RGPD** : Protection des données personnelles  
✅ **Zero-knowledge** : Même l'administrateur DB ne peut pas lire les messages sans la clé  
✅ **Intégrité** : Le tag GCM détecte toute modification des messages  
✅ **Transparent** : Aucun changement nécessaire dans le code front

## Limites et considérations

⚠️ **Gestion de la clé** : Si vous perdez `ENCRYPTION_KEY`, tous les messages deviennent illisibles  
⚠️ **Performance** : Le chiffrement/déchiffrement ajoute un petit overhead (négligeable pour la plupart des cas)  
⚠️ **Recherche** : Impossible de faire des recherches full-text sur les messages chiffrés en DB

## Implémentation

### Fichiers modifiés

- `src/utils/encryption.util.ts` - Utilitaire de chiffrement/déchiffrement
- `src/messages/message.entity.ts` - Hooks Mongoose pour chiffrement automatique
- `.env` - Ajout de la variable `ENCRYPTION_KEY`

### Hooks Mongoose

```typescript
// Avant sauvegarde : chiffrer
MessageSchema.pre('save', function(next) { ... });

// Après lecture : déchiffrer  
MessageSchema.post('find', function(docs) { ... });
```

## Tests

Pour tester que le chiffrement fonctionne :

1. Créez un message via l'application
2. Connectez-vous à MongoDB avec Compass ou mongo shell
3. Regardez le champ `content` - il devrait être chiffré (format `salt:iv:tag:data`)
4. Dans l'application, le message s'affiche normalement déchiffré

## Pour aller plus loin

Pour renforcer encore la sécurité :

1. **Rotation de clés** : Changer régulièrement `ENCRYPTION_KEY`
2. **KMS** : Utiliser un Key Management Service (AWS KMS, Azure Key Vault)
3. **Chiffrement bout-en-bout** : Chiffrer côté client (E2E encryption)
