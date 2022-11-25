import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import refreshSlashCommands from './slash_refresh.js';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

discordClient.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  let command = await import(`file://${filePath}`);
  if ('data' in command && 'execute' in command) {
    discordClient.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

discordClient.once(Events.ClientReady, async () => {
  await refreshSlashCommands();
  console.log('Discord Client Ready');
});

discordClient.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = discordClient.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
  } else {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply('There was an error while executing this command!');
    }
  }
});

discordClient.login(process.env.DISCORD_TOKEN);
