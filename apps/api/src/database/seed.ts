import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

/**
 * Script de seed pour initialiser la base de données
 * Crée un compte admin par défaut si aucun admin n'existe
 */
async function seed() {
  console.log('🌱 Démarrage du seed de la base de données...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  // Récupérer les credentials admin depuis les variables d'environnement
  const adminUsername = process.env.ADMIN_USERNAME || 'Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  try {
    // Vérifier si un admin existe déjà
    const users = await usersService.findAll();
    const adminExists = users.some(user => user.role === 'admin');

    if (adminExists) {
      console.log('✅ Un compte admin existe déjà dans la base de données');
    } else {
      console.log('📝 Aucun admin trouvé, création du compte admin par défaut...');

      // Créer le compte admin par défaut
      const adminUser = await usersService.create({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
      });

      // Promouvoir en admin
      const userModel = app.get('UserModel');
      await userModel.findByIdAndUpdate(adminUser._id, { role: 'admin' }).exec();

      console.log('✅ Compte admin créé avec succès !');
      console.log('');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Mot de passe: ${adminPassword}`);
    }

    console.log('');
    console.log('✅ Seed terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Exécuter le seed
seed();
