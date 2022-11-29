import { Level } from 'level';
import logger from '../logger.js';

const db = new Level('../../databases/anime');
const embeds = db.sublevel('', { valueEncoding: 'json' });
const jsons = db.sublevel('', { valueEncoding: 'json' });

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

export async function setEmbed(key, value) {
  logger.info(`[DB] Setting key '${key}' with embed`);
  await embeds.put(key, value);
  logger.info(`[DB] Set key, embed`);
}

export async function getEmbed(key) {
  try {
    logger.info(`[DB] Getting value with key ${key}`);
    const value = await embeds.get(key);
    logger.info(`[DB] Got value`);
    return value;
  } catch (error) {
    logger.error(`[DB] Error getting value with key ${key}`);
    return null;
  }
}

export async function setJson(key, value) {
  logger.info(`[DB] Setting key '${key}' with json`);
  await jsons.put(key, value);
  logger.info(`[DB] Set key, json`);
}

export async function getJson(key) {
  try {
    logger.info(`[DB] Getting value with key ${key}`);
    const value = await jsons.get(key);
    logger.info(`[DB] Got value`);
    return value;
  } catch (error) {
    logger.error(`[DB] Error getting value with key ${key}`);
    return null;
  }
}
