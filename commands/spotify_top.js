import Spotify from '../utils/spotify.js';
import logger from '../utils/logger.js';
import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { disablePreviousCollector } from '../utils/collector_manager.js';
import { getActionRowButtons, disableButton, enableButton } from '../utils/buttons.js';

import * as dbSpotifyTop from '../utils/databases/spotify_top.js';

export const data = new SlashCommandBuilder()
  .setName('spotify-top')
  .setDescription('Top Played')
  .addStringOption((option) => option.setName('type').setDescription('Type to search').setRequired(true).addChoices({ name: 'tracks', value: 'tracks' }, { name: 'artists', value: 'artists' }));

export async function execute(interaction) {
  await interaction.deferReply();
  const userId = interaction.user.id;
  const type = interaction.options.getString('type');
  const response = await Spotify.getTopPlayed(userId, type);
  if (!response) {
    await interaction.editReply({ content: `${BASE_URL}auth/discord?task=spotify`, ephemeral: true });
    return;
  }
  await setDatabase(response);
  const messageContent = await determineMessage(response);
  const messageSent = await interaction.editReply(messageContent);
  await disablePreviousCollector(interaction.commandName, messageSent.channelId, messageSent.id);
  spotifyTopButtonInteraction(messageSent);
}

export function spotifyTopButtonInteraction(message) {
  logger.info(`[Collector] Spotify Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    switch (press.customId) {
      case 'next': {
        const displayType = await dbSpotifyTop.get(`displayType`);
        let index = parseInt(await dbSpotifyTop.get(`${displayType}Index`));
        const length = parseInt(await dbSpotifyTop.get(`${displayType}Length`));
        index++;
        const content = await dbSpotifyTop.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow;
        if (index === 1) {
          actionRow = enableButton(oldActionRow, 'prev');
        } else {
          actionRow = oldActionRow;
        }
        if (index + 1 === length) {
          actionRow = disableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        await dbSpotifyTop.set(`${displayType}Index`, index);
        break;
      }
      case 'prev': {
        const displayType = await dbSpotifyTop.get(`displayType`);
        let index = parseInt(await dbSpotifyTop.get(`${displayType}Index`));
        const length = parseInt(await dbSpotifyTop.get(`${displayType}Length`));
        index--;
        const content = await dbSpotifyTop.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow;
        if (index === 0) {
          actionRow = disableButton(oldActionRow, 'prev');
        } else {
          actionRow = oldActionRow;
        }
        if (index + 2 === length) {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        await dbSpotifyTop.set(`${displayType}Index`, index);
        break;
      }
      case 'shortTerm': {
        const displayType = 'shortTerm';
        await dbSpotifyTop.set(`displayType`, displayType);
        let index = parseInt(await dbSpotifyTop.get(`${displayType}Index`));
        const shortTermLength = parseInt(await dbSpotifyTop.get(`shortTermLength`));
        const mediumTermLength = parseInt(await dbSpotifyTop.get(`mediumTermLength`));
        const longTermLength = parseInt(await dbSpotifyTop.get(`longTermLength`));
        const content = await dbSpotifyTop.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'shortTerm');
        if (mediumTermLength === 0) {
          actionRow = disableButton(actionRow, 'mediumTerm');
        } else {
          actionRow = enableButton(actionRow, 'mediumTerm');
        }
        if (longTermLength === 0) {
          actionRow = disableButton(actionRow, 'longTerm');
        } else {
          actionRow = enableButton(actionRow, 'longTerm');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === shortTermLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
      case 'mediumTerm': {
        const displayType = 'mediumTerm';
        await dbSpotifyTop.set(`displayType`, displayType);
        let index = parseInt(await dbSpotifyTop.get(`${displayType}Index`));
        const shortTermLength = parseInt(await dbSpotifyTop.get(`shortTermLength`));
        const mediumTermLength = parseInt(await dbSpotifyTop.get(`mediumTermLength`));
        const longTermLength = parseInt(await dbSpotifyTop.get(`longTermLength`));
        const content = await dbSpotifyTop.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'mediumTerm');
        if (shortTermLength === 0) {
          actionRow = disableButton(actionRow, 'shortTerm');
        } else {
          actionRow = enableButton(actionRow, 'shortTerm');
        }
        if (longTermLength === 0) {
          actionRow = disableButton(actionRow, 'longTerm');
        } else {
          actionRow = enableButton(actionRow, 'longTerm');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === mediumTermLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
      case 'longTerm': {
        const displayType = 'longTerm';
        await dbSpotifyTop.set(`displayType`, displayType);
        let index = parseInt(await dbSpotifyTop.get(`${displayType}Index`));
        const shortTermLength = parseInt(await dbSpotifyTop.get(`shortTermLength`));
        const mediumTermLength = parseInt(await dbSpotifyTop.get(`mediumTermLength`));
        const longTermLength = parseInt(await dbSpotifyTop.get(`longTermLength`));
        const content = await dbSpotifyTop.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'longTerm');
        if (shortTermLength === 0) {
          actionRow = disableButton(actionRow, 'shortTerm');
        } else {
          actionRow = enableButton(actionRow, 'shortTerm');
        }
        if (mediumTermLength === 0) {
          actionRow = disableButton(actionRow, 'mediumTerm');
        } else {
          actionRow = enableButton(actionRow, 'mediumTerm');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === longTermLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
    }
  });
}

async function determineMessage(items) {
  let message = 'Not enough data.';
  const shortTerm = items.shortTerm.length;
  const mediumTerm = items.mediumTerm.length;
  const longTerm = items.longTerm.length;
  const buttons = [];
  const prevButton = { name: 'prev', disabled: true };
  const nextButton = { name: 'next', disabled: false };
  if (!shortTerm) {
    return message;
  } else if (shortTerm === 1) {
    nextButton.disabled = true;
  }
  message = items.shortTerm[0].spotifyUrl;
  buttons.push({ name: 'shortTerm', disabled: true });
  if (!mediumTerm) {
    buttons.push({ name: 'mediumTerm', disabled: true });
  } else {
    buttons.push({ name: 'mediumTerm', disabled: false });
  }
  if (!longTerm) {
    buttons.push({ name: 'longTerm', disabled: true });
  } else {
    buttons.push({ name: 'longTerm', disabled: false });
  }
  await dbSpotifyTop.set(`displayType`, 'shortTerm');
  buttons.push(prevButton);
  buttons.push(nextButton);
  return { content: message, components: [getActionRowButtons(buttons)] };
}

async function setDatabase(items) {
  await dbSpotifyTop.set('shortTermLength', items.shortTerm.length);
  await dbSpotifyTop.set('mediumTermLength', items.mediumTerm.length);
  await dbSpotifyTop.set('longTermLength', items.longTerm.length);
  await dbSpotifyTop.set('shortTermIndex', 0);
  await dbSpotifyTop.set('mediumTermIndex', 0);
  await dbSpotifyTop.set('longTermIndex', 0);
  for (const timeRange in items) {
    const objects = items[timeRange];
    for (let i = 0; i < objects.length; i++) {
      await dbSpotifyTop.set(`${timeRange}${i}`, objects[i].spotifyUrl);
    }
  }
}
