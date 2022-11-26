import { Level } from 'level';
import logger from '../logger.js';

const db = new Level('../../databases/messages');

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
