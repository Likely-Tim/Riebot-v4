import logger from './logger.js';
import fetch from 'node-fetch';

const OPEN_WEATHER_KEY = process.env.OPEN_WEATHER_KEY;
const ZIP_CODE_BASE_KEY = process.env.ZIP_CODE_BASE_KEY;

export async function sendGetRequestGeocoding(location) {
  logger.info(`[Geocoding] Getting Geocoding for ${location}`);
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&appid=${OPEN_WEATHER_KEY}`;
  let response = await fetch(url, { method: 'GET' });
  logger.info(`[Geocoding] Weather Retrieval Status: ${response.status}`);
  response = await response.json();
  return response;
}

export async function sendGetRequestZipCode(zip) {
  logger.info(`[Zip Code] Getting Zip Code Location for ${zip}`);
  const url = `https://app.zipcodebase.com/api/v1/search?apikey=${ZIP_CODE_BASE_KEY}&codes=${zip}&country=US`;
  let response = await fetch(url, { method: 'GET' });
  logger.info(`[Zip Code] Zip Code Location Status: ${response.status}`);
  response = await response.json();
  return response;
}

export function fahrenheitToBoth(fahrenheit) {
  const celsius = ((fahrenheit - 32) * 5) / 9;
  return fahrenheit.toFixed(1) + '°F / ' + celsius.toFixed(1) + '°C';
}

export function unixTo24Hour(unix, timezone) {
  let date = new Date(unix * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
}

export function unixTo12Hour(unix, timezone) {
  let date = new Date(unix * 1000);
  return date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: true, hour: '2-digit', minute: '2-digit' });
}

export function unixToDateAnd12Hour(unix, timezone) {
  let date = new Date(unix * 1000);
  return date.toLocaleDateString('en-US', { timeZone: timezone, month: '2-digit', day: '2-digit' }) + ' ' + unixTo12Hour(unix, timezone);
}

export function unixToDay(unix, timezone) {
  let date = new Date(unix * 1000);
  return date.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'long' });
}

export function capitalize(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}
