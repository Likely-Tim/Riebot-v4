import { Level } from 'level';
import logger from '../logger.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Level(path.join(__dirname, '../../databases/tokens'));

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD;
const ALGORITHM = 'aes-256-cbc';

export async function set(key, value) {
  logger.info(`[DB] Setting key ${key}`);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, new Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
  const encrypted = cipher.update(value);
  const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  const encryptedHex = iv.toString('hex') + ':' + finalBuffer.toString('hex');
  await db.put(key, encryptedHex);
  logger.info(`[DB] Set key`);
}

export async function get(key) {
  try {
    logger.info(`[DB] Getting value for key ${key}`);
    const encryptedHex = await db.get(key);
    const encryptedArray = encryptedHex.split(':');
    const iv = new Buffer.from(encryptedArray[0], 'hex');
    const encrypted = new Buffer.from(encryptedArray[1], 'hex');
    const decipher = createDecipheriv(ALGORITHM, new Buffer.from(CRYPTO_PASSWORD, 'hex'), iv);
    const decrypted = decipher.update(encrypted);
    const value = Buffer.concat([decrypted, decipher.final()]).toString();
    logger.info(`[DB] Got value for key ${key}`);
    return value;
  } catch (error) {
    logger.error(`[DB] Failed getting value for key ${key}`);
    return null;
  }
}
