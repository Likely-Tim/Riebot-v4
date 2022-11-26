import { SlashCommandBuilder } from '@discordjs/builders';
import Spotify from '../utils/spotify.js';

const BASE_URL = process.env.BASE_URL;

export const data = new SlashCommandBuilder().setName('spotify-playing').setDescription('What is currently playing?');

export async function execute(interaction) {
  await interaction.deferReply();
  const userId = interaction.user.id;
  const track = await Spotify.currentlyPlaying(userId, false);
  if (!track) {
    await interaction.editReply({ content: `${BASE_URL}auth/discord?task=spotify`, ephemeral: true });
    return;
  } else {
    await interaction.editReply(track);
  }
}
