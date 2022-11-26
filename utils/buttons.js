import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const nextButton = new ButtonBuilder().setCustomId('next').setEmoji('➡️').setStyle(ButtonStyle.Secondary);
const prevButton = new ButtonBuilder().setCustomId('prev').setEmoji('⬅️').setStyle(ButtonStyle.Secondary);
const trackButton = new ButtonBuilder().setCustomId('track').setLabel('Track').setStyle(ButtonStyle.Primary);
const artistButton = new ButtonBuilder().setCustomId('artist').setLabel('Artist').setStyle(ButtonStyle.Primary);
const albumButton = new ButtonBuilder().setCustomId('album').setLabel('Album').setStyle(ButtonStyle.Primary);

const buttonsMap = {
  next: nextButton,
  prev: prevButton,
  track: trackButton,
  artist: artistButton,
  album: albumButton,
};

export function getActionRowButtons(buttons) {
  const components = [];
  for (const button of buttons) {
    components.push(buttonsMap[button.name].setDisabled(button.disabled));
  }
  return new ActionRowBuilder().addComponents(components);
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
