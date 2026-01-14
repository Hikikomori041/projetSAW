# Configuration pour tester le chat en temps réel entre plusieurs PC

## Configuration pour tester sur plusieurs PC

### 1. Sur le PC serveur (qui exécute l'API)

#### a) Trouver votre adresse IP locale
Ouvrez PowerShell et exécutez :
```powershell
ipconfig
```
Cherchez "Adresse IPv4" dans la section de votre connexion réseau active (Wifi ou Ethernet).
Exemple : `192.168.1.100`

#### b) Configurer le fichier .env du client
Modifiez le fichier `apps/client/.env` :
```
VITE_API_URL=http://<VOTRE_IP>:3000
```
Exemple :
```
VITE_API_URL=http://192.168.1.100:3000
```

#### c) Configurer le pare-feu Windows (si nécessaire)
Si la connexion ne fonctionne pas depuis un autre PC, vous devrez peut-être autoriser les ports 3000 (API) et 5173 (frontend) dans le pare-feu :

1. Ouvrez "Pare-feu Windows Defender avec sécurité avancée"
2. Cliquez sur "Règles de trafic entrant"
3. Cliquez sur "Nouvelle règle..."
4. Sélectionnez "Port" → Suivant
5. TCP, ports spécifiques : `3000,5173` → Suivant
6. Autoriser la connexion → Suivant
7. Cochez tous les profils → Suivant
8. Nommez la règle "Dev Chat App" → Terminer

#### d) Lancer l'application
Exécutez le script de développement :
```powershell
.\start-dev.ps1
```

### 2. Sur le PC client (qui se connecte à l'API)

#### Option A : Accéder depuis le navigateur
Ouvrez simplement votre navigateur et allez sur :
```
http://<IP_DU_PC_SERVEUR>:5173
```
Exemple : `http://192.168.1.100:5173`

L'application se connectera automatiquement à l'API sur le port 3000 du PC serveur.

#### Option B : Exécuter le frontend localement
Si vous souhaitez exécuter le frontend sur le PC client :

1. Clonez le projet
2. Modifiez `apps/client/.env` :
```
VITE_API_URL=http://<IP_DU_PC_SERVEUR>:3000
```
3. Installez les dépendances et lancez :
```powershell
cd apps/client
npm install
npm run dev
```

## Vérification du fonctionnement

### Tests à effectuer :

1. **Test 1 : Connexion**
   - PC 1 : Créez un compte et connectez-vous
   - PC 2 : Créez un autre compte et connectez-vous
   
2. **Test 2 : Créer un salon**
   - PC 1 : Créez un nouveau salon
   - PC 2 : Rejoignez le salon (via invitation ou liste)

3. **Test 3 : Chat en temps réel**
   - PC 1 : Envoyez un message
   - PC 2 : Le message devrait apparaître **instantanément** sans recharger la page
   - PC 2 : Répondez au message
   - PC 1 : La réponse devrait apparaître **instantanément**

### Si ça ne fonctionne toujours pas :

1. Vérifiez que les deux PC sont sur le même réseau
2. Ouvrez la console du navigateur (F12) et cherchez des erreurs WebSocket
3. Vérifiez que le pare-feu n'est pas activé sur le PC serveur
4. Testez la connexion depuis le PC client :
```powershell
curl http://<IP_DU_PC_SERVEUR>:3000/stats
```

## Modifications techniques apportées

### 1. Configuration centralisée de l'API
Création de `apps/client/src/config/api.ts` :
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

### 2. Amélioration du WebSocket Gateway
`apps/api/src/messages/messages.gateway.ts` :
```typescript
@WebSocketGateway({ 
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
```

### 3. Configuration Socket.io client
`apps/client/src/hooks/useSocket.ts` :
```typescript
const newSocket = io(API_URL, {
  auth: { token },
  transports: ['websocket', 'polling'],
});
```

## Développement local (un seul PC)

Pour le développement sur un seul PC, conservez simplement :
```
VITE_API_URL=http://localhost:3000
```

L'application continuera de fonctionner normalement.
