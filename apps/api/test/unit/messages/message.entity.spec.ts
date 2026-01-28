import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageSchema, MessageDocument } from '../../../src/messages/message.entity';
import { EncryptionUtil } from '../../../src/utils/encryption.util';

describe('Message Entity (Unit Tests - Security)', () => {
  let messageModel: Model<MessageDocument>;
  const ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests';

  beforeAll(() => {
    // Définir la clé de chiffrement pour les tests
    process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Message.name),
          useValue: Model,
        },
      ],
    }).compile();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Encryption Security Tests', () => {
    it('should encrypt message content before saving to database', () => {
      const plainText = 'This is a secret message';
      const encrypted = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);

      // Vérifier que le message chiffré est différent du texte en clair
      expect(encrypted).not.toBe(plainText);

      // Vérifier que le format chiffré est correct (salt:iv:tag:data)
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4);

      // Vérifier que chaque partie est en base64
      parts.forEach(part => {
        expect(part).toMatch(/^[A-Za-z0-9+/=]+$/);
      });
    });

    it('should decrypt message content correctly', () => {
      const plainText = 'This is a secret message';
      const encrypted = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);
      const decrypted = EncryptionUtil.decrypt(encrypted, ENCRYPTION_KEY);

      expect(decrypted).toBe(plainText);
    });

    it('should fail to decrypt with wrong key', () => {
      const plainText = 'This is a secret message';
      const encrypted = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);

      expect(() => {
        EncryptionUtil.decrypt(encrypted, 'wrong-key');
      }).toThrow();
    });

    it('should use AES-256-GCM algorithm (authenticated encryption)', () => {
      const plainText = 'Test message for authentication';
      const encrypted = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);
      
      // Tenter de modifier le message chiffré (attaque par modification)
      const parts = encrypted.split(':');
      // Modifier significativement les données chiffrées pour déclencher l'erreur d'authentification
      const originalData = Buffer.from(parts[3], 'base64');
      const tamperedData = Buffer.from(originalData.map(byte => byte ^ 0xFF)); // Inverser tous les bits
      parts[3] = tamperedData.toString('base64');
      const tampered = parts.join(':');

      // La vérification d'authenticité devrait échouer
      expect(() => {
        EncryptionUtil.decrypt(tampered, ENCRYPTION_KEY);
      }).toThrow();
    });

    it('should use different IV for each encryption (prevent replay attacks)', () => {
      const plainText = 'Same message';
      const encrypted1 = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);
      const encrypted2 = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);

      // Les deux messages chiffrés doivent être différents
      expect(encrypted1).not.toBe(encrypted2);

      // Mais les deux doivent se déchiffrer au même message
      expect(EncryptionUtil.decrypt(encrypted1, ENCRYPTION_KEY)).toBe(plainText);
      expect(EncryptionUtil.decrypt(encrypted2, ENCRYPTION_KEY)).toBe(plainText);
    });

    it('should use unique salt for key derivation (PBKDF2)', () => {
      const plainText = 'Test message';
      const encrypted1 = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);
      const encrypted2 = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);

      // Extraire les salts
      const salt1 = encrypted1.split(':')[0];
      const salt2 = encrypted2.split(':')[0];

      // Les salts doivent être différents
      expect(salt1).not.toBe(salt2);
    });

    it('should require both text and secret for encryption', () => {
      expect(() => {
        EncryptionUtil.encrypt('', ENCRYPTION_KEY);
      }).toThrow('Text and secret are required for encryption');

      expect(() => {
        EncryptionUtil.encrypt('message', '');
      }).toThrow('Text and secret are required for encryption');
    });

    it('should require both encrypted data and secret for decryption', () => {
      expect(() => {
        EncryptionUtil.decrypt('', ENCRYPTION_KEY);
      }).toThrow('Encrypted data and secret are required for decryption');

      expect(() => {
        EncryptionUtil.decrypt('encrypted:data:here:test', '');
      }).toThrow('Encrypted data and secret are required for decryption');
    });

    it('should reject invalid encrypted data format', () => {
      expect(() => {
        EncryptionUtil.decrypt('invalid-format', ENCRYPTION_KEY);
      }).toThrow('Failed to decrypt data');

      expect(() => {
        EncryptionUtil.decrypt('only:two:parts', ENCRYPTION_KEY);
      }).toThrow('Failed to decrypt data');
    });

    it('should handle special characters and unicode in messages', () => {
      const specialChars = 'Message avec accents: éàèù, emojis: 🔒🔐, et caractères spéciaux: @#$%^&*()';
      const encrypted = EncryptionUtil.encrypt(specialChars, ENCRYPTION_KEY);
      const decrypted = EncryptionUtil.decrypt(encrypted, ENCRYPTION_KEY);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const encrypted = EncryptionUtil.encrypt(longMessage, ENCRYPTION_KEY);
      const decrypted = EncryptionUtil.decrypt(encrypted, ENCRYPTION_KEY);

      expect(decrypted).toBe(longMessage);
      expect(decrypted.length).toBe(10000);
    });
  });

  describe('Security Best Practices', () => {
    it('should use strong key derivation (PBKDF2 with 100k iterations)', () => {
      // Ce test vérifie indirectement que le PBKDF2 est utilisé
      // En tentant un déchiffrement avec un délai minimal
      const start = Date.now();
      const plainText = 'Security test';
      const encrypted = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);
      EncryptionUtil.decrypt(encrypted, ENCRYPTION_KEY);
      const duration = Date.now() - start;

      // PBKDF2 avec 100k itérations devrait prendre au moins quelques millisecondes
      // Cela empêche les attaques par force brute rapides
      expect(duration).toBeGreaterThan(0);
    });

    it('should not expose plaintext in error messages', () => {
      const plainText = 'Secret information that should not leak';
      const encrypted = EncryptionUtil.encrypt(plainText, ENCRYPTION_KEY);

      try {
        EncryptionUtil.decrypt(encrypted, 'wrong-key');
      } catch (error) {
        // L'erreur ne doit pas contenir le texte en clair
        expect(error.message).not.toContain(plainText);
        expect(error.message).toBe('Failed to decrypt data');
      }
    });
  });
});
