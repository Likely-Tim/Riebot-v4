import { Level } from 'level';
import logger from '../logger.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Level(path.join(__dirname, '../../databases/spotify'));

export async function set(key, value) {
  logger.info(`[DB] Setting key '${key}' with value '${value}'`);
  await db.put(key, value);
  logger.info(`[DB] Set key, value`);
}

export async function get(key) {
  try {
    logger.info(`[DB] Getting value with key ${key}`);
    const value = await db.get(key);
    logger.info(`[DB] Got value`);
    return value;
  } catch (error) {
    logger.error(`[DB] Error getting value with key ${key}`);
    return null;
  }
}
