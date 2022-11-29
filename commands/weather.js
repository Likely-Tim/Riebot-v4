import { SlashCommandBuilder } from 'discord.js';
import { sendGetRequestWeather } from '../utils/weather.js';
import { buildBasicEmbed, buildWeather } from '../utils/embed.js';

export const data = new SlashCommandBuilder()
  .setName('weather')
  .setDescription('What is the weather?')
  .addStringOption((option) => option.setName('location').setDescription('Where').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply();
  const location = interaction.options.getString('location');
  const response = await sendGetRequestWeather(location);
  if (response) {
    const embed = buildWeather(response);
    interaction.editReply({ embeds: [embed] });
  } else {
    const embed = buildBasicEmbed(`Could not find ${location}`);
    interaction.editReply({ embeds: [embed] });
  }
}
