import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';

export async function cleanDatabase(app: INestApplication): Promise<void> {
  if (!app) {
    console.warn('⚠️ App is not initialized, skipping database cleanup');
    return;
  }
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    if (!connection) {
      console.warn('⚠️ Database connection not found, skipping cleanup');
      return;
    }

    const collections = connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  }
}

export async function closeDatabase(app: INestApplication): Promise<void> {
  if (!app) {
    return;
  }
  
  try {
    const connection = app.get<Connection>(getConnectionToken());
    if (connection) {
      await connection.close();
    }
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
}
