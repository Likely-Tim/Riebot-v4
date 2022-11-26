import { Level } from 'level';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const db = new Level('../../databases/tokens');

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD;
const ALGORITHM = 'aes-256-cbc';

export async function set(key, value) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, new Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
  const encrypted = cipher.update(value);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  const encryptedHex = iv.toString('hex') + ':' + finalBuffer.toString('hex');
  await db.put(key, encryptedHex);
}

export async function get(key) {
  try {
    const encryptedHex = await db.get(key);
    const encryptedArray = encryptedHex.split(':');
    const iv = new Buffer.from(encryptedArray[0], 'hex');
    const encrypted = new Buffer.from(encryptedArray[1], 'hex');
    const decipher = createDecipheriv(ALGORITHM, new Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
    const decrypted = decipher.update(encrypted);
    return Buffer.concat([decrypted, decipher.final()]).toString();
  } catch (error) {
    return null;
  }
}
