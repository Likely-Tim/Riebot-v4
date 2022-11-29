import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } from 'discord.js';

const nextButton = new ButtonBuilder().setCustomId('next').setEmoji('➡️').setStyle(ButtonStyle.Secondary);
const prevButton = new ButtonBuilder().setCustomId('prev').setEmoji('⬅️').setStyle(ButtonStyle.Secondary);
const trackButton = new ButtonBuilder().setCustomId('track').setLabel('Track').setStyle(ButtonStyle.Primary);
const artistButton = new ButtonBuilder().setCustomId('artist').setLabel('Artist').setStyle(ButtonStyle.Primary);
const albumButton = new ButtonBuilder().setCustomId('album').setLabel('Album').setStyle(ButtonStyle.Primary);
const shortTermButton = new ButtonBuilder().setCustomId('shortTerm').setLabel('Short Term').setStyle(ButtonStyle.Primary);
const mediumTermButton = new ButtonBuilder().setCustomId('mediumTerm').setLabel('Medium Term').setStyle(ButtonStyle.Primary);
const longTermButton = new ButtonBuilder().setCustomId('longTerm').setLabel('Long Term').setStyle(ButtonStyle.Primary);
const animeShowButton = new ButtonBuilder().setCustomId('show').setLabel('Show').setStyle(ButtonStyle.Primary);
const opAndEdButton = new ButtonBuilder().setCustomId('opAndEd').setLabel('OP & ED').setStyle(ButtonStyle.Primary);
const scoreButton = new ButtonBuilder().setCustomId('score').setLabel('Score').setStyle(ButtonStyle.Primary);
const characterButton = new ButtonBuilder().setCustomId('character').setLabel('Characters').setStyle(ButtonStyle.Secondary);
const vaButton = new ButtonBuilder().setCustomId('va').setLabel('va').setStyle(ButtonStyle.Secondary);

const buttonsMap = {
  next: nextButton,
  prev: prevButton,
  track: trackButton,
  artist: artistButton,
  album: albumButton,
  shortTerm: shortTermButton,
  mediumTerm: mediumTermButton,
  longTerm: longTermButton,
  animeShow: animeShowButton,
  opAndEd: opAndEdButton,
  score: scoreButton,
  character: characterButton,
  va: vaButton,
};

export function getActionRowButtons(buttons) {
  const components = [];
  for (const button of buttons) {
    if (button.label) {
      components.push(buttonsMap[button.name].setDisabled(button.disabled || false).setLabel(button.label.length > 80 ? button.label.slice(0, 77) + '...' : button.label));
    } else {
      components.push(buttonsMap[button.name].setDisabled(button.disabled || false));
    }
  }
  return new ActionRowBuilder().addComponents(components);
}

export function changeButtonLabel(actionRow, buttonCustomId, label) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    if (components[i].data.custom_id === buttonCustomId) {
      components[i].data.label = label;
      break;
    }
  }
  actionRow.components = components;
  return actionRow;
}

export function disableButton(actionRow, buttonCustomId) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    if (components[i].data.custom_id === buttonCustomId) {
      components[i].data.disabled = true;
      break;
    }
  }
  actionRow.components = components;
  return actionRow;
}

export function disableAllButtons(actionRow) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    components[i].data.disabled = true;
  }
  actionRow.components = components;
  return actionRow;
}

export function disableAllRows(actionRows) {
  for (let i = 0; i < actionRows.length; i++) {
    const disabledActionRow = disableAllButtons(actionRows[i]);
    actionRows[i] = disabledActionRow;
  }
  return actionRows;
}

export function enableButton(actionRow, buttonCustomId) {
  const components = actionRow.components;
  for (let i = 0; i < components.length; i++) {
    if (components[i].data.custom_id === buttonCustomId) {
      components[i].data.disabled = false;
      break;
    }
  }
  actionRow.components = components;
  return actionRow;
}

export function getSelectActionRow(options) {
  const select = new SelectMenuBuilder().setCustomId('selectMenu').setPlaceholder('Nothing Selected');
  const choices = [];
  for (const option of options) {
    choices.push({
      label: String(option.label),
      value: String(option.value),
    });
  }
  select.addOptions(choices);
  return new ActionRowBuilder().addComponents(select);
}
