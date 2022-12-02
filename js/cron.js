import * as cron from 'cron';
import logger from '../utils/logger.js';
import { sendGetRequestWeather } from '../utils/weather.js';
import { buildBasicEmbed, buildWeather } from '../utils/embed.js';

const DISCORD_DEFAULT_CHANNEL = process.env.DISCORD_DEFAULT_CHANNEL;

const CronJob = cron.CronJob;
export function cronJobs(client) {
  let job = new CronJob(
    '0 0 8 * * *',
    function () {
      dailyWeather(client);
    },
    null,
    true,
    'America/Los_Angeles'
  );
}

async function dailyWeather(client) {
  logger.info('[Cron] Daily Weather');
  const channel = await client.channels.fetch(DISCORD_DEFAULT_CHANNEL);
  const response = await sendGetRequestWeather('Fremont');
  if (response) {
    const embed = buildWeather(response);
    channel.send({ embeds: [embed] });
  } else {
    const embed = buildBasicEmbed(`Could not find "Fremont"`);
    channel.send({ embeds: [embed] });
  }
}
