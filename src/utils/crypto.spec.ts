import { encrypt, decrypt, isEncrypted, generateEncryptionKey } from './crypto';

describe('AES-256-GCM Encryption Utility (Fase 0 - Segurança)', () => {
  it('deve gerar uma chave de 32 bytes (64 caracteres hexadecimais)', () => {
    const key = generateEncryptionKey();
    expect(key).toBeDefined();
    expect(key.length).toBe(64);
    expect(/^[0-9a-fA-F]{64}$/.test(key)).toBe(true);
  });

  it('deve criptografar e descriptografar corretamente uma string de credencial', () => {
    const originalSecret = 'api-secret-key-prod-tce-pr-2026-xyz987';
    const encrypted = encrypt(originalSecret);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(originalSecret);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalSecret);
  });

  it('deve suportar chaves customizadas de 64 caracteres hex', () => {
    const customKey = generateEncryptionKey();
    const payload = 'senha_banco_dados_ultra_secreta';

    const encrypted = encrypt(payload, customKey);
    expect(isEncrypted(encrypted)).toBe(true);

    const decrypted = decrypt(encrypted, customKey);
    expect(decrypted).toBe(payload);
  });

  it('deve falhar na descriptografia se os dados ou chave forem violados (Autenticação GCM)', () => {
    const customKey1 = generateEncryptionKey();
    const customKey2 = generateEncryptionKey();
    const payload = 'dado_sensivel_cauc';

    const encrypted = encrypt(payload, customKey1);

    // Tentar descriptografar com chave errada deve falhar
    expect(() => decrypt(encrypted, customKey2)).toThrow();
  });

  it('deve retornar string vazia para entradas vazias', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });
});
