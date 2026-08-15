import { encrypt, decrypt, isEncrypted, generateEncryptionKey } from './crypto';

function runCryptoTests() {
  console.log('--- [TESTE DE SEGURANÇA FASE 0: CRIPTOGRAFIA AES-256-GCM] ---');
  let passCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      throw new Error(`Falha no teste: ${testName}`);
    }
  }

  // 1. Teste de cifragem e decifragem básica
  const originalSecret = 'stn_token_super_secreto_prefeitura_123456';
  const encrypted = encrypt(originalSecret);
  assert(isEncrypted(encrypted), 'Formato de string cifrada reconhecido (enc:v1:iv:tag:data)');
  assert(encrypted !== originalSecret, 'Texto cifrado não expõe texto plano');

  const decrypted = decrypt(encrypted);
  assert(decrypted === originalSecret, 'Texto descriptografado idêntico ao original');

  // 2. Teste com chave customizada
  const customKey = generateEncryptionKey();
  assert(customKey.length === 64, 'Chave mestra gerada tem 64 caracteres hex (32 bytes / 256 bits)');

  const encryptedCustom = encrypt(originalSecret, customKey);
  const decryptedCustom = decrypt(encryptedCustom, customKey);
  assert(decryptedCustom === originalSecret, 'Cifragem e decifragem com chave customizada funcionam');

  // 3. Teste de integridade e autenticação GCM (adulteração deve falhar)
  let tamperingDetected = false;
  try {
    const parts = encrypted.split(':');
    // Adulterando o ciphertext
    parts[4] = (parts[4].startsWith('a') ? 'b' : 'a') + parts[4].substring(1);
    const tampered = parts.join(':');
    decrypt(tampered);
  } catch (err) {
    tamperingDetected = true;
  }
  assert(tamperingDetected, 'AES-256-GCM detecta adulteração de dados e rejeita payload');

  // 4. Teste de payload vazio
  assert(encrypt('') === '', 'Payload vazio retorna string vazia');
  assert(decrypt('') === '', 'Decifragem de string vazia retorna string vazia');

  // 5. Teste de tolerância para strings não criptografadas legadas
  const legacyString = 'texto_nao_cifrado_legado';
  assert(decrypt(legacyString) === legacyString, 'Strings legadas sem prefixo enc:v1 retornam o valor original');

  console.log(`\nResultado: ${passCount}/${totalCount} testes passaram com sucesso.`);
}

runCryptoTests();
