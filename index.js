import * as fs from 'node:fs';
import * as path from 'node:path';
import logger from './utils/logger.js';
import { fileURLToPath } from 'node:url';
import initializeServer from './server.js';
import refreshSlashCommands from './slash_refresh.js';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

startUp();

async function startUp() {
  initializeServer();
  refreshSlashCommands();

  discordClient.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    let command = await import(`file://${filePath}`);
    if ('data' in command && 'execute' in command) {
      discordClient.commands.set(command.data.name, command);
    } else {
      logger.info(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

discordClient.once(Events.ClientReady, () => {
  logger.info('Discord Client Ready');
});

discordClient.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = discordClient.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply(`No command matching ${interaction.commandName} was found.`);
  } else {
    try {
      logger.info(`[Command] Executing ${interaction.commandName}`);
      await command.execute(interaction);
      logger.info(`[Command] Executed ${interaction.commandName} Successfully`);
    } catch (error) {
      console.error(error);
      logger.error(`[Command] Error Executing ${interaction.commandName}`);
      await interaction.reply('There was an error while executing this command!');
    }
  }
});

discordClient.login(process.env.DISCORD_TOKEN);
