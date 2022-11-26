import logger from './logger.js';

export async function getUser(accessToken) {
  logger.info(`[Discord] Getting User`);
  const url = 'https://discord.com/api/v10/users/@me';
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status !== 200) {
    logger.error(`[Discord] Getting user failed with status ${response.status}`);
    return null;
  } else {
    logger.info(`[Discord] Got User`);
    response = await response.json();
    return response;
  }
}
