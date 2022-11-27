import Spotify from '../utils/spotify.js';
import logger from '../utils/logger.js';
import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { disablePreviousCollector } from '../utils/collector_manager.js';
import { getActionRowButtons, disableButton, enableButton } from '../utils/buttons.js';

import * as dbSpotify from '../utils/databases/spotify.js';

const BASE_URL = process.env.BASE_URL;

export const data = new SlashCommandBuilder()
  .setName('spotify')
  .setDescription('Search Spotify')
  .addStringOption((option) => option.setName('query').setDescription('What to search').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply();
  const query = interaction.options.getString('query');
  const response = await Spotify.search(query);
  if (!response) {
    await interaction.editReply({ content: `Error with general spotify token\n${BASE_URL}auth/spotify`, ephemeral: true });
    return;
  }
  const messageContent = await determineMessage(response);
  await setDatabase(response);
  const messageSent = await interaction.editReply(messageContent);
  await disablePreviousCollector(interaction.commandName, messageSent.channelId, messageSent.id);
  spotifyButtonInteraction(messageSent);
}

export function spotifyButtonInteraction(message) {
  logger.info(`[Collector] Spotify Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    switch (press.customId) {
      case 'next': {
        const displayType = await dbSpotify.get(`displayType`);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const length = parseInt(await dbSpotify.get(`${displayType}Length`));
        index++;
        const content = await dbSpotify.get(`${displayType}${index}`);
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
        await dbSpotify.set(`${displayType}Index`, index);
        break;
      }
      case 'prev': {
        const displayType = await dbSpotify.get(`displayType`);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const length = parseInt(await dbSpotify.get(`${displayType}Length`));
        index--;
        const content = await dbSpotify.get(`${displayType}${index}`);
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
        await dbSpotify.set(`${displayType}Index`, index);
        break;
      }
      case 'track': {
        const displayType = 'tracks';
        await dbSpotify.set(`displayType`, displayType);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const trackLength = parseInt(await dbSpotify.get(`tracksLength`));
        const artistLength = parseInt(await dbSpotify.get(`artistsLength`));
        const albumLength = parseInt(await dbSpotify.get(`albumsLength`));
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'track');
        if (artistLength === 0) {
          actionRow = disableButton(actionRow, 'artist');
        } else {
          actionRow = enableButton(actionRow, 'artist');
        }
        if (albumLength === 0) {
          actionRow = disableButton(actionRow, 'album');
        } else {
          actionRow = enableButton(actionRow, 'album');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === trackLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
      case 'artist': {
        const displayType = 'artists';
        await dbSpotify.set(`displayType`, displayType);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const trackLength = parseInt(await dbSpotify.get(`tracksLength`));
        const artistLength = parseInt(await dbSpotify.get(`artistsLength`));
        const albumLength = parseInt(await dbSpotify.get(`albumsLength`));
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'artist');
        if (trackLength === 0) {
          actionRow = disableButton(actionRow, 'track');
        } else {
          actionRow = enableButton(actionRow, 'track');
        }
        if (albumLength === 0) {
          actionRow = disableButton(actionRow, 'album');
        } else {
          actionRow = enableButton(actionRow, 'album');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === artistLength) {
          actionRow = disableButton(actionRow, 'next');
        } else {
          actionRow = enableButton(actionRow, 'next');
        }
        await press.update({ content: content, components: [actionRow] });
        break;
      }
      case 'album': {
        const displayType = 'albums';
        await dbSpotify.set(`displayType`, displayType);
        let index = parseInt(await dbSpotify.get(`${displayType}Index`));
        const trackLength = parseInt(await dbSpotify.get(`tracksLength`));
        const artistLength = parseInt(await dbSpotify.get(`artistsLength`));
        const albumLength = parseInt(await dbSpotify.get(`albumsLength`));
        const content = await dbSpotify.get(`${displayType}${index}`);
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'album');
        if (trackLength === 0) {
          actionRow = disableButton(actionRow, 'track');
        } else {
          actionRow = enableButton(actionRow, 'track');
        }
        if (artistLength === 0) {
          actionRow = disableButton(actionRow, 'artist');
        } else {
          actionRow = enableButton(actionRow, 'artist');
        }
        if (index === 0) {
          actionRow = disableButton(actionRow, 'prev');
        } else {
          actionRow = enableButton(actionRow, 'prev');
        }
        if (index + 1 === albumLength) {
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

async function setDatabase(items) {
  await dbSpotify.set('tracksLength', items.tracks.length);
  await dbSpotify.set('artistsLength', items.artists.length);
  await dbSpotify.set('albumsLength', items.albums.length);
  await dbSpotify.set('tracksIndex', 0);
  await dbSpotify.set('artistsIndex', 0);
  await dbSpotify.set('albumsIndex', 0);
  for (const type in items) {
    const objects = items[type];
    for (let i = 0; i < objects.length; i++) {
      await dbSpotify.set(`${type}${i}`, objects[i].spotifyUrl);
    }
  }
}

async function determineMessage(items) {
  let displayType = '';
  let message = 'Search came up with nothing.';
  const trackLength = items.tracks.length;
  const artistLength = items.artists.length;
  const albumLength = items.albums.length;
  const buttons = [];
  const prevButton = { name: 'prev', disabled: true };
  const nextButton = { name: 'next' };
  if (trackLength === 0) {
    buttons.push({ name: 'track', disabled: true });
  } else if (trackLength === 1) {
    buttons.push({ name: 'track', disabled: true });
    nextButton.disabled = true;
    message = items.tracks[0].spotifyUrl;
    displayType = 'tracks';
  } else {
    buttons.push({ name: 'track', disabled: true });
    nextButton.disabled = false;
    message = items.tracks[0].spotifyUrl;
    displayType = 'tracks';
  }
  if (artistLength === 0) {
    buttons.push({ name: 'artist', disabled: true });
  } else if (!displayType) {
    if (artistLength === 1) {
      buttons.push({ name: 'artist', disabled: true });
      nextButton.disabled = true;
      message = items.artists[0].spotifyUrl;
      displayType = 'artists';
    } else {
      buttons.push({ name: 'artist', disabled: true });
      nextButton.disabled = false;
      message = items.artists[0].spotifyUrl;
      displayType = 'artists';
    }
  } else {
    buttons.push({ name: 'artist', disabled: false });
  }
  if (albumLength === 0) {
    buttons.push({ name: 'album', disabled: true });
  } else if (!displayType) {
    if (albumLength === 1) {
      buttons.push({ name: 'album', disabled: true });
      nextButton.disabled = true;
      message = items.albums[0].spotifyUrl;
      displayType = 'albums';
    } else {
      buttons.push({ name: 'album', disabled: true });
      nextButton.disabled = false;
      message = items.albums[0].spotifyUrl;
      displayType = 'albums';
    }
  } else {
    buttons.push({ name: 'album', disabled: false });
  }
  await dbSpotify.set(`displayType`, displayType);
  buttons.push(prevButton);
  buttons.push(nextButton);
  return { content: message, components: [getActionRowButtons(buttons)] };
}
