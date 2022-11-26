import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!');

export async function execute(interaction) {
  await interaction.deferReply();
  await interaction.editReply('Ping');
}
