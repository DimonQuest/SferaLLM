import { safeStorage } from 'electron';

export class SecureStorage {
  private static isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  static encryptString(plainText: string): string {
    if (!this.isAvailable()) {
      console.warn('Encryption not available, storing in plain text');
      return plainText;
    }

    try {
      const buffer = safeStorage.encryptString(plainText);
      return buffer.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      return plainText;
    }
  }

  static decryptString(encryptedText: string): string {
    if (!this.isAvailable()) {
      return encryptedText;
    }

    try {
      const buffer = Buffer.from(encryptedText, 'base64');
      return safeStorage.decryptString(buffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  static encryptApiKey(apiKey: string): string {
    return this.encryptString(apiKey);
  }

  static decryptApiKey(encryptedKey: string): string {
    return this.decryptString(encryptedKey);
  }
}
