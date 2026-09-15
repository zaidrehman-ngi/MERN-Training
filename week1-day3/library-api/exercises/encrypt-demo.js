const crypto = require('crypto');

const phoneNumber = '+92-300-1234567';

// Read the encryption key from the environment.
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be a 32-byte key.');
}

// TODO 1 — Encrypt the phone number using AES-256-GCM.
const iv = crypto.randomBytes(12);

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

const encrypted = Buffer.concat([
  cipher.update(phoneNumber, 'utf8'),
  cipher.final(),
]);

const authTag = cipher.getAuthTag();

console.log('Ciphertext:', encrypted.toString('hex'));
console.log('IV:', iv.toString('hex'));
console.log('Auth Tag:', authTag.toString('hex'));

// TODO 2 — Encrypt the same phone number again.
const iv2 = crypto.randomBytes(12);

const cipher2 = crypto.createCipheriv('aes-256-gcm', key, iv2);

const encrypted2 = Buffer.concat([
  cipher2.update(phoneNumber, 'utf8'),
  cipher2.final(),
]);

const authTag2 = cipher2.getAuthTag();

console.log('\nSecond Encryption');
console.log('Ciphertext 2:', encrypted2.toString('hex'));
console.log('IV 2:', iv2.toString('hex'));
console.log('Auth Tag 2:', authTag2.toString('hex'));

console.log(
  'Ciphertexts match:',
  encrypted.toString('hex') === encrypted2.toString('hex'),
);

// TODO 3 — Decrypt the ciphertext.
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

decipher.setAuthTag(authTag);

const decrypted = Buffer.concat([
  decipher.update(encrypted),
  decipher.final(),
]).toString('utf8');

console.log('\nDecrypted:', decrypted);

console.assert(
  decrypted === phoneNumber,
  'Decrypted phone number does not match the original.',
);

// TODO 4 — Flip one byte of the ciphertext and try to decrypt it.
const tamperedCiphertext = Buffer.from(encrypted);
tamperedCiphertext[0] ^= 1;

try {
  const tamperedDecipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

  tamperedDecipher.setAuthTag(authTag);

  const tamperedDecrypted = Buffer.concat([
    tamperedDecipher.update(tamperedCiphertext),
    tamperedDecipher.final(),
  ]).toString('utf8');

  console.log('Tampered decrypted:', tamperedDecrypted);
} catch (error) {
  console.log('Tampering detected:', error.message);
}