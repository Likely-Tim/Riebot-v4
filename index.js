import * as dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";

dotenv.config({ path: "./secrets/.env" });

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

discordClient.once(Events.ClientReady, () => {
  console.log("Discord Client Ready");
});

discordClient.login();
