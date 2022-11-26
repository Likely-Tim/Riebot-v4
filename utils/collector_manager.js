import client from '../index.js';
import logger from './logger.js';
import { disableAllRows } from './buttons.js';

// Interactions
import { spotifyButtonInteraction } from '../commands/spotify.js';

import * as dbMessages from './databases/messages.js';

const COMMAND_WITH_COLLECTORS = ['spotify'];
const COMMAND_MAP = {
  spotify: spotifyButtonInteraction,
};

export async function disablePreviousCollector(commandName, newChannelId, newMessageId) {
  try {
    const oldChannelId = await dbMessages.get(`${commandName}ChannelId`);
    const oldMessageId = await dbMessages.get(`${commandName}MessageId`);
    const oldChannel = await client.channels.fetch(oldChannelId);
    const oldMessage = await oldChannel.messages.fetch(oldMessageId);
    const actionRow = disableAllRows(oldMessage.components);
    oldMessage.edit({ components: actionRow });
  } catch (error) {
    logger.warn(`[Collector Manager] Could not find/disable previous collector for ${commandName} with error: ${error}`);
  } finally {
    await dbMessages.set(`${commandName}ChannelId`, newChannelId);
    await dbMessages.set(`${commandName}MessageId`, newMessageId);
  }
}

export async function reinitializeCollectors() {
  for (const commandName of COMMAND_WITH_COLLECTORS) {
    try {
      logger.info(`[Collector Manager] Trying to reinitialize for command ${commandName}`);
      const oldChannelId = await dbMessages.get(`${commandName}ChannelId`);
      const oldMessageId = await dbMessages.get(`${commandName}MessageId`);
      const oldChannel = await client.channels.fetch(oldChannelId);
      const oldMessage = await oldChannel.messages.fetch(oldMessageId);
      COMMAND_MAP[commandName](oldMessage);
      logger.info(`[Collector Manager] Reinitialized for command ${commandName}`);
    } catch (error) {
      logger.warn(`[Collector Manager] Failed to reinitialize for command ${commandName} with error: ${error}`);
    }
  }
}
