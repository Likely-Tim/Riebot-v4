import { REST, Routes } from 'discord.js';
import fs from 'node:fs';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

export default async function refreshSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commands = [];
  const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('js'));

  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}
