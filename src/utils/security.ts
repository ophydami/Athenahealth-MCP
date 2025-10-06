import crypto from 'crypto';
import { logger } from './logger.js';

// Security configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const TAG_LENGTH = 16; // 128 bits

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}
 
export interface SecurityConfig {
  encryptionKey?: string;
  maxSessionDuration?: number;
  requireMFA?: boolean;
  ipWhitelist?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export class SecurityManager {
  private readonly encryptionKey: Buffer;
  private readonly config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      maxSessionDuration: 8 * 60 * 60 * 1000, // 8 hours
      requireMFA: false,
      ipWhitelist: [],
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 requests per minute
      },
      ...config,
    };

    // Initialize encryption key
    this.encryptionKey = this.initializeEncryptionKey(config.encryptionKey);
  }

  private initializeEncryptionKey(providedKey?: string): Buffer {
    if (providedKey) {
      if (providedKey.length !== KEY_LENGTH * 2) { // Hex string should be 64 chars
        throw new Error('Invalid encryption key length');
      }
      return Buffer.from(providedKey, 'hex');
    }

    // Generate a random key if none provided (for development only)
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Using randomly generated encryption key for development');
      return crypto.randomBytes(KEY_LENGTH);
    }

    throw new Error('Encryption key must be provided in production');
  }

  /**
   * Encrypt sensitive data for storage or transmission
   */
  encrypt(data: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

      const encryptedBuffer = Buffer.concat([
        cipher.update(data, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encryptedBuffer.toString('hex'),
        iv: iv.toString('hex'),
        tag: authTag.toString('hex'),
      };
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptionResult: EncryptionResult): string {
    try {
      const { encryptedData, iv, tag } = encryptionResult;

      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      const encryptedBuffer = Buffer.from(encryptedData, 'hex');

      if (ivBuffer.length !== IV_LENGTH) {
        throw new Error('Invalid IV length');
      }

      if (tagBuffer.length !== TAG_LENGTH) {
        throw new Error('Invalid authentication tag length');
      }

      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, ivBuffer);
      decipher.setAuthTag(tagBuffer);

      const decryptedBuffer = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
      ]);

      return decryptedBuffer.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data for storage (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':');
      if (!salt || !hash) {
        return false;
      }
      const dataHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
      return hash === dataHash.toString('hex');
    } catch (error) {
      logger.error('Hash verification failed', { error });
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate IP address against whitelist
   */
  validateIPAddress(ip: string): boolean {
    if (!this.config.ipWhitelist || this.config.ipWhitelist.length === 0) {
      return true; // No whitelist configured
    }

    return this.config.ipWhitelist.includes(ip);
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      // Remove common sensitive patterns
      return data
        .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
        .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
        .replace(/\b\d{10,}\b/g, '[PHONE]')
        .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE]')
        .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[DATE]');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForLogging(item));
    }

    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Always sanitize keys that commonly contain sensitive data
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLogging(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'ssn', 'social_security_number', 'tax_id',
      'password', 'passwd', 'pwd',
      'token', 'access_token', 'refresh_token', 'api_key',
      'secret', 'client_secret',
      'authorization', 'auth',
      'dob', 'date_of_birth', 'birthdate',
      'phone', 'mobile', 'telephone',
      'email', 'email_address',
      'address', 'street', 'home_address',
      'credit_card', 'card_number', 'account_number',
      'bank_account', 'routing_number',
      'patient_id', 'medical_record_number', 'mrn',
    ];

    return sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey)
    );
  }

  /**
   * Validate session token
   */
  validateSessionToken(token: string, sessionData: any): boolean {
    try {
      // Check if session has expired
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        return false;
      }

      // Verify token integrity
      const expectedToken = this.generateSessionToken(sessionData.userId, sessionData.createdAt);
      return token === expectedToken;
    } catch (error) {
      logger.error('Session validation failed', { error });
      return false;
    }
  }

  /**
   * Generate session token
   */
  generateSessionToken(userId: string, timestamp: number): string {
    const data = `${userId}:${timestamp}`;
    return crypto.createHmac('sha256', this.encryptionKey).update(data).digest('hex');
  }

  /**
   * Create secure session
   */
  createSession(userId: string, additionalData: any = {}): {
    token: string;
    expiresAt: number;
    sessionData: any;
  } {
    const createdAt = Date.now();
    const expiresAt = createdAt + (this.config.maxSessionDuration || 8 * 60 * 60 * 1000);
    const token = this.generateSessionToken(userId, createdAt);

    const sessionData = {
      userId,
      createdAt,
      expiresAt,
      ...additionalData,
    };

    return {
      token,
      expiresAt,
      sessionData,
    };
  }

  /**
   * Validate API request for security
   */
  validateRequest(request: {
    ip?: string;
    userAgent?: string;
    timestamp?: number;
    signature?: string;
  }): { valid: boolean; reason?: string } {
    // Check IP whitelist
    if (request.ip && !this.validateIPAddress(request.ip)) {
      return { valid: false, reason: 'IP address not whitelisted' };
    }

    // Check timestamp for replay attacks (5 minute window)
    if (request.timestamp) {
      const now = Date.now();
      const timeDiff = Math.abs(now - request.timestamp);
      if (timeDiff > 5 * 60 * 1000) {
        return { valid: false, reason: 'Request timestamp too old' };
      }
    }

    // Additional security checks can be added here
    
    return { valid: true };
  }

  /**
   * Generate secure API key
   */
  generateAPIKey(prefix: string = 'ak'): string {
    const randomPart = crypto.randomBytes(24).toString('base64url');
    return `${prefix}_${randomPart}`;
  }

  /**
   * Validate API key format
   */
  validateAPIKeyFormat(apiKey: string): boolean {
    const apiKeyRegex = /^[a-zA-Z0-9_-]+$/;
    return apiKeyRegex.test(apiKey) && apiKey.length >= 20;
  }
}

// Export singleton instance
export const securityManager = new SecurityManager({
  encryptionKey: process.env.ENCRYPTION_KEY,
  maxSessionDuration: parseInt(process.env.MAX_SESSION_DURATION || '28800000'), // 8 hours
  requireMFA: process.env.REQUIRE_MFA === 'true',
  ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },
});

// Utility functions
export const encryptSensitiveData = (data: string): EncryptionResult => {
  return securityManager.encrypt(data);
};

export const decryptSensitiveData = (encryptionResult: EncryptionResult): string => {
  return securityManager.decrypt(encryptionResult);
};

export const sanitizeForLogging = (data: any): any => {
  return securityManager.sanitizeForLogging(data);
};

export const generateSecureToken = (length?: number): string => {
  return securityManager.generateSecureToken(length);
};

export const validateIPAddress = (ip: string): boolean => {
  return securityManager.validateIPAddress(ip);
};

export const createSecureSession = (userId: string, additionalData?: any) => {
  return securityManager.createSession(userId, additionalData);
};

export const validateSessionToken = (token: string, sessionData: any): boolean => {
  return securityManager.validateSessionToken(token, sessionData);
}; 
