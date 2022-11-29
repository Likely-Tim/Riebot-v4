import { EmbedBuilder } from 'discord.js';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { fahrenheitToBoth, unixTo12Hour, unixToDateAnd12Hour, unixToDay, capitalize } from './misc.js';

const ANILIST_LOGO = 'https://anilist.co/img/icons/android-chrome-512x512.png';

const SHOW_STATUS_COLOR_MAP = {
  FINISHED: '#2b00ff',
  RELEASING: '#22fc00',
  NOT_YET_RELEASED: '#ff1100',
  CANCELLED: '#000000',
  HIATUS: '#000000',
};

export function buildBasicEmbed(string) {
  const embed = new EmbedBuilder();
  embed.setDescription(string);
  return embed;
}

export function buildAnimeShow(show) {
  const embed = new EmbedBuilder();
  embed.setColor(SHOW_STATUS_COLOR_MAP[show.status]);
  embed.setTitle(show.title.length > 256 ? show.title.slice(0, 253) + '...' : show.title);
  embed.setURL(show.url);
  embed.setThumbnail(show.coverImage);
  embed.setAuthor({ name: show.studios, iconURL: ANILIST_LOGO });
  const description = NodeHtmlMarkdown.translate(show.descriptionHtml) || 'No description.';
  embed.setDescription(description.length > 4096 ? description.slice(0, 4093) + '...' : description);
  embed.setTimestamp();
  embed.addFields(
    { name: '\u200B', value: '\u200B' },
    {
      name: ':trophy: Rank',
      value: `${show.rank || '➤ N/A'}`,
      inline: true,
    },
    {
      name: ':alarm_clock: Episodes',
      value: `➤ ${show.episodes || 'N/A'}`,
      inline: true,
    },
    {
      name: ':100: Rating',
      value: `➤ ${show.score || 'N/A'}`,
      inline: true,
    }
  );
  return embed;
}

export function buildOpAndEd(opAndEd, title, url, imageUrl) {
  const embed = new EmbedBuilder();
  embed.setTitle(title.length > 256 ? title.slice(0, 253) + '...' : title);
  embed.setURL(url);
  embed.setThumbnail(imageUrl);
  embed.setColor('#38385e');
  embed.setTimestamp();
  const opSongs = [];
  const edSongs = [];
  for (const song of opAndEd) {
    if (song.type === 'ED') {
      edSongs.push(`[${song.title} by ${song.artists}](${song.videoUrl}) [EP: ${song.episodes}]`);
    } else {
      opSongs.push(`[${song.title} by ${song.artists}](${song.videoUrl}) [EP: ${song.episodes}]`);
    }
  }
  let description = '';
  if (opSongs.length !== 0) {
    description += `**Openings**\n${opSongs.join('\n')}`;
    if (edSongs.length !== 0) {
      description += `\n\n**Endings**\n${edSongs.join('\n')}`;
    }
  } else if (edSongs.length !== 0) {
    description += `**Endings**\n${edSongs.join('\n')}`;
  }
  embed.setDescription(description.length > 4096 ? description.slice(0, 4093) + '...' : description);
  return embed;
}

export function buildCharacter(character) {
  const embed = new EmbedBuilder();
  embed.setTitle(character.name.length > 256 ? character.name.slice(0, 253) + '...' : character.name);
  embed.setURL(character.url);
  embed.setThumbnail(character.imageUrl);
  embed.setColor('#38385e');
  embed.setTimestamp();
  const description = NodeHtmlMarkdown.translate(character.descriptionHtml) || 'No description.';
  embed.setDescription(description.length > 4096 ? description.slice(0, 4093) + '...' : description);
  embed.addFields(
    { name: '\u200B', value: '\u200B' },
    {
      name: ':1234: Age',
      value: `➤ ${character.age || 'N/A'}`,
      inline: true,
    },
    {
      name: ':birthday: Birthday',
      value: `➤ ${character.dob || 'N/A'}`,
      inline: true,
    }
  );
  return embed;
}

export function buildVa(va) {
  const embed = new EmbedBuilder();
  embed.setTitle(va.name.length > 256 ? va.name.slice(0, 253) + '...' : va.name);
  embed.setURL(va.url);
  embed.setThumbnail(va.imageUrl);
  embed.setColor('#571d19');
  embed.setTimestamp();
  const description = NodeHtmlMarkdown.translate(va.descriptionHtml) || 'No description.';
  embed.setDescription(description > 4096 ? description.slice(0, 4093) + '...' : description);
  embed.addFields(
    { name: '\u200B', value: '\u200B' },
    {
      name: ':house: Hometown',
      value: `➤ ${va.homeTown || 'N/A'}`,
      inline: true,
    },
    {
      name: ':1234: Age',
      value: `➤ ${va.age || 'N/A'}`,
      inline: true,
    },
    {
      name: ':birthday: Birthday',
      value: `➤ ${va.dob || 'N/A'}`,
      inline: true,
    }
  );
  return embed;
}

export function buildWeather(weather) {
  const location = weather.name;
  const timezone = weather.timezone;
  const current = weather.current;
  const forecast = weather.daily;
  const alerts = weather.alerts;
  const embed = new EmbedBuilder();
  embed.setColor('#0099ff');
  embed.setThumbnail(`http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`);
  embed.setTitle(`${location}, ${unixToDateAnd12Hour(current.dt, timezone)}\n${capitalize(current.weather[0].description)}`);
  embed.setDescription(`**Current Temperature:** ${fahrenheitToBoth(current.temp)}\n**Feels Like:** ${fahrenheitToBoth(current.feels_like)}\n**Min:** ${fahrenheitToBoth(forecast[0].temp.min)}\n**Max:** ${fahrenheitToBoth(forecast[0].temp.max)}\n**Humidity:** ${current.humidity}%\n**Wind:** ${current.wind_speed} mph\n**Sunrise:** ${unixTo12Hour(current.sunrise, timezone)}\n **Sunset:** ${unixTo12Hour(current.sunset, timezone)}\n**UV Index:** ${current.uvi}`);
  for (let i = 1; i < 7; i++) {
    embed.addFields({ name: unixToDay(forecast[i].dt, timezone), value: `**Min:** ${fahrenheitToBoth(forecast[i].temp.min)}\n**Max** ${fahrenheitToBoth(forecast[i].temp.max)}\n**Percipitation:** ${forecast[i].pop * 100}%\n**Wind Gust: ** ${forecast[i].wind_gust.toFixed(1)} mph`, inline: true });
  }
  if (alerts) {
    const alertArray = [];
    for (let i = 0; i < alerts.length; i++) {
      alertArray.push(`**- [${unixToDateAnd12Hour(alerts[i].start, timezone)} - ${unixToDateAnd12Hour(alerts[i].end, timezone)}] ${alerts[i].event}**`);
    }
    embed.addFields({ name: 'Alerts', value: alertArray.join('\n'), inline: false });
  }
  return embed;
}
