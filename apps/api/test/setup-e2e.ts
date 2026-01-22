import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement de test
config({ path: resolve(__dirname, '../.env.test') });

console.log('🧪 Tests E2E - Base de données:', process.env.MONGODB_URI);
