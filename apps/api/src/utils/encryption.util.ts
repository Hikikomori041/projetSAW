import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Nombre d'itérations pour PBKDF2 (dérivation de clé)
const PBKDF2_ITERATIONS = 100000;

export class EncryptionUtil {
  /**
   * Dérive une clé de chiffrement à partir d'un secret et d'un salt
   */
  private static deriveKey(secret: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(secret, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
  }

  /**
   * Chiffre un texte avec AES-256-GCM
   * Retourne: salt:iv:tag:encryptedData (en base64)
   */
  static encrypt(text: string, secret: string): string {
    if (!text || !secret) {
      throw new Error('Text and secret are required for encryption');
    }

    // Générer un salt aléatoire pour la dérivation de clé
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(secret, salt);

    // Générer un IV (vecteur d'initialisation) aléatoire
    const iv = crypto.randomBytes(IV_LENGTH);

    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Chiffrer le texte
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Récupérer le tag d'authentification
    const tag = cipher.getAuthTag();

    // Retourner: salt:iv:tag:encryptedData
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted
    ].join(':');
  }

  /**
   * Déchiffre un texte chiffré avec AES-256-GCM
   */
  static decrypt(encryptedData: string, secret: string): string {
    if (!encryptedData || !secret) {
      throw new Error('Encrypted data and secret are required for decryption');
    }

    try {
      // Parser les composants: salt:iv:tag:encryptedData
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }

      const salt = Buffer.from(parts[0], 'base64');
      const iv = Buffer.from(parts[1], 'base64');
      const tag = Buffer.from(parts[2], 'base64');
      const encrypted = parts[3];

      // Dériver la clé à partir du secret et du salt
      const key = this.deriveKey(secret, salt);

      // Créer le decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      // Déchiffrer
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
    //   console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}
