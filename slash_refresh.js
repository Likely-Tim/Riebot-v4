import { readdirSync } from 'fs';
import logger from './utils/logger.js';
import { REST, Routes } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

export default async function refreshSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commands = [];
  const commandFiles = readdirSync('./commands').filter((file) => file.endsWith('js'));

  for (const file of commandFiles) {
    const { data } = await import(`./commands/${file}`);
    commands.push(data.toJSON());
  }

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}
