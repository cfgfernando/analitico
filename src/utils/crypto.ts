import crypto from 'crypto';
import env from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV padrão para GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Normaliza uma chave mestra para 32 bytes (256 bits).
 * Aceita strings hex (64 chars), base64 ou texto plano (usando sha256 para derivação se necessário).
 */
function resolveKey(customKey?: string): Buffer {
  const rawKey = customKey || env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('[Crypto] Nenhuma ENCRYPTION_KEY configurada para cifragem.');
  }

  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  // Derivação segura para 32 bytes se for string normal
  return crypto.createHash('sha256').update(rawKey).digest();
}

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

/**
 * Criptografa texto plano usando AES-256-GCM com autenticação integrada.
 * Retorna string compactada no formato "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export function encrypt(plainText: string, customKey?: string): string {
  if (!plainText) return '';

  const key = resolveKey(customKey);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return `enc:v1:${ivHex}:${authTag}:${encrypted}`;
}

/**
 * Descriptografa payload compactado no formato "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * ou objeto estruturado EncryptedPayload.
 */
export function decrypt(encryptedData: string | EncryptedPayload, customKey?: string): string {
  if (!encryptedData) return '';

  const key = resolveKey(customKey);
  let ivHex: string;
  let authTagHex: string;
  let ciphertextHex: string;

  if (typeof encryptedData === 'string') {
    if (!encryptedData.startsWith('enc:v1:')) {
      // Se não estiver criptografado ou for legado, retorna o texto original com aviso
      return encryptedData;
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 5) {
      throw new Error('[Crypto] Formato de payload cifrado inválido.');
    }

    [, , ivHex, authTagHex, ciphertextHex] = parts;
  } else {
    ivHex = encryptedData.iv;
    authTagHex = encryptedData.authTag;
    ciphertextHex = encryptedData.ciphertext;
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Verifica se uma string está cifrada com o padrão da aplicação.
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.startsWith('enc:v1:') && value.split(':').length === 5;
}

/**
 * Utilitário para gerar uma nova chave de 32 bytes (64 hex chars) para ENCRYPTION_KEY.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
