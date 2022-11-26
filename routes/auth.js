import { Router } from 'express';
import { randomStringGenerator } from '../utils/random.js';
import * as discord from '../utils/discord.js';

import * as dbTokens from '../utils/databases/tokens.js';
import logger from '../utils/logger.js';

const router = Router();

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

const BASE_URL = process.env.BASE_URL;
const BASE_URL_ENCODED = process.env.BASE_URL_ENCODED;

router.get('/discord', async (request, response) => {
  if (!request.query.task) {
    response.redirect('/?discordSuccess=false');
    return;
  }
  const id = randomStringGenerator(64);
  const state = randomStringGenerator(64);
  response.cookie('task', request.query.task, { sameSite: 'lax', maxAge: 600000 });
  response.cookie('discordStateId', id, { sameSite: 'lax', maxAge: 600000 });
  await dbTokens.set(`${id}DiscordState`, state);
  response.redirect(`https://discord.com/oauth2/authorize?response_type=code&client_id=${DISCORD_CLIENT_ID}&scope=identify&state=${state}&redirect_uri=${BASE_URL_ENCODED}auth%2Fdiscord%2Fcallback&prompt=consent`);
});

router.get('/spotify', async (request, response) => {
  if (request.query.discordId) {
    response.cookie('discordId', request.query.discordId, { sameSite: 'lax', maxAge: 600000 });
  }
  response.redirect(`https://accounts.spotify.com/en/authorize?client_id=${SPOTIFY_ID}&response_type=code&redirect_uri=${BASE_URL_ENCODED}auth%2Fspotify%2Fcallback&scope=user-top-read%20user-read-currently-playing%20user-read-playback-state&show_dialog=true`);
});

router.get('/discord/callback', async (request, response) => {
  const discordStateId = request.cookies.discordStateId;
  const redirectUrl = request.cookies.redirectUrl;
  const task = request.cookies.task;
  response.clearCookie('discordStateId');
  response.clearCookie('redirectUrl');
  response.clearCookie('task');

  if (!discordStateId) {
    response.redirect('/?discordSuccess=false');
    return;
  }
  const state = await dbTokens.get(`${request.cookies.discordStateId}DiscordState`);
  response.clearCookie('discordStateId');
  if (state != request.query.state) {
    response.redirect('/?discordSuccess=false');
    return;
  }
  const [accessToken, refreshToken] = await discordAccepted(request.query.code);
  if (!accessToken || !refreshToken) {
    response.redirect('/?discordSuccess=false');
    return;
  }

  if (task === 'spotify') {
    const user = await discord.getUser(accessToken);
    const userId = user.id;
    response.cookie('discordId', userId, { sameSite: 'lax', maxAge: 600000 });
    response.redirect(`/auth/spotify`);
    return;
  }
  if (redirectUrl) {
    response.redirect(redirectUrl);
  } else {
    response.redirect('/?discordSuccess=true');
  }
});

router.get('/spotify/callback', async (request, response) => {
  const [accessToken, refreshToken] = await spotifyAccepted(request.query.code);
  if (!accessToken || !refreshToken) {
    response.redirect('/?spotifySuccess=false');
    return;
  }
  const discordId = request.cookies.discordId;
  const redirectUrl = request.cookies.redirectUrl;
  response.clearCookie('discordId');
  response.clearCookie('redirectUrl');

  if (discordId) {
    await dbTokens.set(`spotifyAccess_${discordId}`, accessToken);
    await dbTokens.set(`spotifyRefresh_${discordId}`, refreshToken);
  } else {
    await dbTokens.set('spotifyAccess', accessToken);
    await dbTokens.set('spotifyRefresh', refreshToken);
  }
  if (redirectUrl) {
    response.redirect(redirectUrl);
  } else {
    response.redirect('/?spotifySuccess=true');
  }
});

async function discordAccepted(code) {
  const url = 'https://discord.com/api/oauth2/token';
  const data = {
    grant_type: 'authorization_code',
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    redirect_uri: `${BASE_URL}auth/discord/callback`,
    code: code,
  };
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(data),
  });
  if (response.status !== 200) {
    logger.error(`Discord callback failed with status: ${response.status}`);
    return [null, null];
  } else {
    response = await response.json();
    return [response.access_token, response.refresh_token];
  }
}

async function spotifyAccepted(code) {
  const url = 'https://accounts.spotify.com/api/token';
  const authorization = Buffer.from(SPOTIFY_ID + ':' + SPOTIFY_SECRET).toString('base64');
  const data = {
    code: code,
    redirect_uri: `${BASE_URL}auth/spotify/callback`,
    grant_type: 'authorization_code',
  };
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + authorization,
    },
    body: new URLSearchParams(data),
  });
  if (response.status != 200) {
    logger.error(`Spotify callback failed with status: ${response.status}`);
    return [null, null];
  }
  response = await response.json();
  return [response.access_token, response.refresh_token];
}

export default router;
