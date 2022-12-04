import path from 'node:path';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'node:url';
import Anilist from '../utils/anilist.js';
import Anithemes from '../utils/anithemes.js';
import { generateAnimeShowScore } from '../utils/chart.js';
import { buildAnimeShow, buildCharacter, buildOpAndEd, buildVa } from '../utils/embed.js';
import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { disablePreviousCollector } from '../utils/collector_manager.js';
import { changeButtonLabel, disableButton, enableButton, getActionRowButtons, getSelectActionRow } from '../utils/buttons.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as dbAnime from '../utils/databases/anime.js';

export const data = new SlashCommandBuilder()
  .setName('anime')
  .setDescription('Weeb')
  .addStringOption((option) => option.setName('type').setDescription('Type to search').setRequired(true).addChoices({ name: 'show', value: 'show' }, { name: 'character', value: 'character' }, { name: 'staff', value: 'staff' }))
  .addStringOption((option) => option.setName('query').setDescription('What to search').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply();
  const type = interaction.options.getString('type');
  const query = interaction.options.getString('query');
  switch (type) {
    case 'show': {
      const searchResults = await Anilist.searchAnime(query);
      if (!searchResults) {
        await interaction.editReply(`Nothing found`);
        return;
      }
      const selectActionRow = getSelectActionRow(searchResults);
      const messageSent = await interaction.editReply({ components: [selectActionRow] });
      await disablePreviousCollector(`animeShowSelect`, messageSent.channelId, messageSent.id);
      animeShowSelectInteraction(messageSent);
      break;
    }
    case 'character': {
      const searchResults = await Anilist.searchCharacter(query);
      if (!searchResults) {
        await interaction.editReply(`Nothing found`);
        return;
      }
      const selectActionRow = getSelectActionRow(searchResults);
      const messageSent = await interaction.editReply({ components: [selectActionRow] });
      await disablePreviousCollector(`animeCharacterSelect`, messageSent.channelId, messageSent.id);
      animeCharacterSelectInteraction(messageSent);
      break;
    }
    case 'staff': {
      const searchResults = await Anilist.searchStaff(query);
      if (!searchResults) {
        await interaction.editReply(`Nothing found`);
        return;
      }
      const selectActionRow = getSelectActionRow(searchResults);
      const messageSent = await interaction.editReply({ components: [selectActionRow] });
      await disablePreviousCollector(`animeStaffSelect`, messageSent.channelId, messageSent.id);
      animeStaffSelectInteraction(messageSent);
      break;
    }
  }
}

export function animeStaffSelectInteraction(message) {
  logger.info(`[Collector] Anime Select Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
  collector.on('collect', async (selection) => {
    await selection.deferReply();
    const vaId = parseInt(selection.values[0]);
    await dbAnime.set(`animeVaId`, vaId);
    const va = await Anilist.getVa(vaId);
    const vaEmbed = buildVa(va);
    const buttons = [];
    if (va.characters) {
      buttons.push({ name: 'character', disabled: false });
    } else {
      buttons.push({ name: 'character', disabled: true });
    }
    const messageSent = await selection.editReply({ embeds: [vaEmbed], components: [getActionRowButtons(buttons)] });
    await disablePreviousCollector(`anime`, messageSent.channelId, messageSent.id);
    await dbAnime.set(`type`, `va`);
    animeVaButtonInteraction(messageSent);
  });
}

export function animeCharacterSelectInteraction(message) {
  logger.info(`[Collector] Anime Select Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
  collector.on('collect', async (selection) => {
    await selection.deferReply();
    const characterId = parseInt(selection.values[0]);
    const characterMap = await Anilist.getCharacterDetails([characterId]);
    const character = characterMap[characterId];
    await dbAnime.set(`animeVaId`, character.vaId);
    await dbAnime.set(`animeShowId`, character.mediaId);
    const characterEmbed = buildCharacter(character);
    const buttons = [];
    buttons.push({ name: 'animeShow', disabled: false, label: character.media });
    if (character.vaName === 'N/A' || character.vaId === 'N/A') {
      buttons.push({ name: 'va', label: character.vaName, disabled: true });
    } else {
      buttons.push({ name: 'va', label: character.vaName, disabled: false });
    }
    const messageSent = await selection.editReply({ embeds: [characterEmbed], components: [getActionRowButtons(buttons)] });
    await disablePreviousCollector(`anime`, messageSent.channelId, messageSent.id);
    await dbAnime.set(`type`, `character`);
    animeCharacterButtonInteraction(messageSent);
  });
}

export function animeShowSelectInteraction(message) {
  logger.info(`[Collector] Anime Select Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
  collector.on('collect', async (selection) => {
    await selection.deferReply();
    const showId = parseInt(selection.values[0]);
    await dbAnime.set('animeShowId', showId);
    const show = await Anilist.getAnime(showId);
    const showEmbed = buildAnimeShow(show);
    await dbAnime.setEmbed('animeShow', showEmbed);
    const themes = await Anithemes.searchByAnilistId(showId);
    const trend = await Anilist.getShowTrend(showId);
    const buttons = [];
    buttons.push({ name: 'animeShow', disabled: true, label: show.title });
    if (themes && themes.length !== 0) {
      const opAndEdEmbed = buildOpAndEd(themes, show.title, show.url, show.coverImage);
      await dbAnime.setEmbed('opAndEd', opAndEdEmbed);
      buttons.push({ name: 'opAndEd', disabled: false });
    } else {
      buttons.push({ name: 'opAndEd', disabled: true });
    }
    if (trend && trend.length !== 0) {
      generateTrendChart(trend);
      buttons.push({ name: 'score', disabled: false });
    } else {
      buttons.push({ name: 'score', disabled: true });
    }
    if (show.haveMain) {
      buttons.push({ name: 'character', disabled: false });
    } else {
      buttons.push({ name: 'character', disabled: true });
    }
    await dbAnime.set('display', 'show');
    const messageSent = await selection.editReply({ embeds: [showEmbed], components: [getActionRowButtons(buttons)] });
    await disablePreviousCollector(`anime`, messageSent.channelId, messageSent.id);
    await dbAnime.set(`type`, `show`);
    animeShowButtonInteraction(messageSent);
  });
}

export function animeShowButtonInteraction(message) {
  logger.info(`[Collector] Anime Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    switch (press.customId) {
      case 'show': {
        const display = await dbAnime.get('display');
        await dbAnime.set('display', 'show');
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'show');
        actionRow = enableButton(actionRow, display);
        const showEmbed = await dbAnime.getEmbed('animeShow');
        press.update({ components: [actionRow], embeds: [showEmbed], files: [] });
        break;
      }
      case 'opAndEd': {
        const display = await dbAnime.get('display');
        await dbAnime.set('display', 'opAndEd');
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'opAndEd');
        actionRow = enableButton(actionRow, display);
        const opAndEdEmbed = await dbAnime.getEmbed('opAndEd');
        press.update({ components: [actionRow], embeds: [opAndEdEmbed], files: [] });
        break;
      }
      case 'score': {
        const display = await dbAnime.get('display');
        await dbAnime.set('display', 'score');
        const oldActionRow = press.message.components[0];
        let actionRow = disableButton(oldActionRow, 'score');
        actionRow = enableButton(actionRow, display);
        press.update({ components: [actionRow], embeds: [], files: [path.join(__dirname, '../media/animeShowScore.png')] });
        break;
      }
      case 'character': {
        const showId = await dbAnime.get('animeShowId');
        const characters = await Anilist.getShowCharacters(showId);
        await dbAnime.set('characterIndex', 0);
        await dbAnime.set('characterLength', characters.length);
        for (let i = 1; i < characters.length; i++) {
          await dbAnime.setJson(`character${i}`, characters[i]);
        }
        const va = await Anilist.getCharacterVa(characters[0].id);
        if (va) {
          characters[0].vaId = va.id;
          characters[0].vaName = va.name;
        } else {
          characters[0].vaId = 'N/A';
          characters[0].vaName = 'N/A';
        }
        await dbAnime.setJson(`character0`, characters[0]);
        await dbAnime.set(`animeVaId`, characters[0].vaId);
        const characterEmbed = buildCharacter(characters[0]);
        const buttons = [];
        buttons.push({ name: 'animeShow', label: characters[0].media, disabled: false });
        if (characters[0].vaName === 'N/A' || characters[0].vaId === 'N/A') {
          buttons.push({ name: 'va', label: characters[0].vaName, disabled: true });
        } else {
          buttons.push({ name: 'va', label: characters[0].vaName, disabled: false });
        }
        buttons.push({ name: 'prev', disabled: true });
        if (characters.length > 1) {
          buttons.push({ name: 'next', disabled: false });
        } else {
          buttons.push({ name: 'next', disabled: true });
        }
        collector.stop();
        await press.update({ embeds: [characterEmbed], components: [getActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `character`);
        animeCharacterButtonInteraction(message);
        break;
      }
    }
  });
}

export function animeVaButtonInteraction(message) {
  logger.info(`[Collector] Anime Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    switch (press.customId) {
      case 'character': {
        const vaId = await dbAnime.get(`animeVaId`);
        let characters = await Anilist.getVaCharacters(vaId);
        await dbAnime.set('characterIndex', 0);
        await dbAnime.set('characterLength', characters.length);
        const characterIds = [];
        for (const character of characters) {
          characterIds.push(character.id);
        }
        const characterMap = await Anilist.getCharacterDetails(characterIds);
        characters = [];
        for (const characterId of characterIds) {
          characters.push(characterMap[characterId]);
        }
        for (let i = 0; i < characters.length; i++) {
          await dbAnime.setJson(`character${i}`, characters[i]);
        }
        await dbAnime.set(`animeVaId`, characters[0].vaId);
        await dbAnime.set(`animeShowId`, characters[0].mediaId);
        const characterEmbed = buildCharacter(characters[0]);
        const buttons = [];
        buttons.push({ name: 'animeShow', label: characters[0].media, disabled: false });
        if (characters[0].vaName === 'N/A' || characters[0].vaId === 'N/A') {
          buttons.push({ name: 'va', label: characters[0].vaName, disabled: true });
        } else {
          buttons.push({ name: 'va', label: characters[0].vaName, disabled: false });
        }
        buttons.push({ name: 'prev', disabled: true });
        if (characters.length > 1) {
          buttons.push({ name: 'next', disabled: false });
        } else {
          buttons.push({ name: 'next', disabled: true });
        }
        collector.stop();
        await press.update({ embeds: [characterEmbed], components: [getActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `character`);
        animeCharacterButtonInteraction(message);
      }
    }
  });
}

export function animeCharacterButtonInteraction(message) {
  logger.info(`[Collector] Anime Message ID: ${message.id}`);
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button });
  collector.on('collect', async (press) => {
    switch (press.customId) {
      case 'show': {
        const showId = await dbAnime.get('animeShowId');
        const show = await Anilist.getAnime(showId);
        const showEmbed = buildAnimeShow(show);
        await dbAnime.setEmbed('animeShow', showEmbed);
        const themes = await Anithemes.searchByAnilistId(showId);
        const trend = await Anilist.getShowTrend(showId);
        const buttons = [];
        buttons.push({ name: 'animeShow', disabled: true, label: show.title });
        if (themes && themes.length !== 0) {
          const opAndEdEmbed = buildOpAndEd(themes, show.title, show.url, show.coverImage);
          await dbAnime.setEmbed('opAndEd', opAndEdEmbed);
          buttons.push({ name: 'opAndEd', disabled: false });
        } else {
          buttons.push({ name: 'opAndEd', disabled: true });
        }
        if (trend && trend.length !== 0) {
          generateTrendChart(trend);
          buttons.push({ name: 'score', disabled: false });
        } else {
          buttons.push({ name: 'score', disabled: true });
        }
        if (show.haveMain) {
          buttons.push({ name: 'character', disabled: false });
        } else {
          buttons.push({ name: 'character', disabled: true });
        }
        await dbAnime.set('display', 'show');
        collector.stop();
        await press.update({ embeds: [showEmbed], components: [getActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `show`);
        animeShowButtonInteraction(message);
        break;
      }
      case 'va': {
        const vaId = await dbAnime.get(`animeVaId`);
        const va = await Anilist.getVa(vaId);
        const vaEmbed = buildVa(va);
        const buttons = [];
        if (va.characters) {
          buttons.push({ name: 'character', disabled: false });
        } else {
          buttons.push({ name: 'character', disabled: true });
        }
        collector.stop();
        await press.update({ embeds: [vaEmbed], components: [getActionRowButtons(buttons)], files: [] });
        await dbAnime.set(`type`, `va`);
        animeVaButtonInteraction(message);
        break;
      }
      case 'prev': {
        let index = parseInt(await dbAnime.get('characterIndex'));
        const length = parseInt(await dbAnime.get('characterLength'));
        index--;
        const character = await dbAnime.getJson(`character${index}`);
        if (!character.vaId) {
          const va = await Anilist.getCharacterVa(character.id);
          if (va) {
            character.vaId = va.id;
            character.vaName = va.name;
          } else {
            character.vaId = 'N/A';
            character.vaName = 'N/A';
          }
        }
        await dbAnime.setJson(`character${index}`, character);
        await dbAnime.set(`animeShowId`, character.mediaId);
        await dbAnime.set(`animeVaId`, character.vaId);
        const characterEmbed = buildCharacter(character);
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
        if (character.vaId === 'N/A' || character.vaName === 'N/A') {
          actionRow = disableButton(actionRow, 'va');
        } else {
          actionRow = enableButton(actionRow, 'va');
        }
        actionRow = changeButtonLabel(actionRow, 'show', character.media);
        actionRow = changeButtonLabel(actionRow, 'va', character.vaName);
        await press.update({ embeds: [characterEmbed], components: [actionRow], files: [] });
        await dbAnime.set(`characterIndex`, index);
        break;
      }
      case 'next': {
        let index = parseInt(await dbAnime.get('characterIndex'));
        const length = parseInt(await dbAnime.get('characterLength'));
        index++;
        const character = await dbAnime.getJson(`character${index}`);
        if (!character.vaId) {
          const va = await Anilist.getCharacterVa(character.id);
          if (va) {
            character.vaId = va.id;
            character.vaName = va.name;
          } else {
            character.vaId = 'N/A';
            character.vaName = 'N/A';
          }
        }
        await dbAnime.setJson(`character${index}`, character);
        await dbAnime.set(`animeShowId`, character.mediaId);
        await dbAnime.set(`animeVaId`, character.vaId);
        const characterEmbed = buildCharacter(character);
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
        if (character.vaId === 'N/A' || character.vaName === 'N/A') {
          actionRow = disableButton(actionRow, 'va');
        } else {
          actionRow = enableButton(actionRow, 'va');
        }
        actionRow = changeButtonLabel(actionRow, 'show', character.media);
        actionRow = changeButtonLabel(actionRow, 'va', character.vaName);
        await press.update({ embeds: [characterEmbed], components: [actionRow], files: [] });
        await dbAnime.set(`characterIndex`, index);
        break;
      }
    }
  });
}

async function generateTrendChart(trend) {
  const labels = [];
  const data = [];
  const cleanedDataPoints = {};
  for (const point of trend) {
    cleanedDataPoints[point.episode] = point.score;
  }
  for (const point in cleanedDataPoints) {
    labels.push(point);
    data.push(cleanedDataPoints[point]);
  }
  await generateAnimeShowScore(labels, data);
}
