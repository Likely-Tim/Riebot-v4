import logger from './logger.js';

import * as dbTokens from './databases/tokens.js';

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;

class Spotify {
  async refreshUserToken(userId) {
    logger.info(`[Spotify] Refreshing token for user ${userId}`);
    const refreshToken = await dbTokens.get(`spotifyRefresh_${userId}`);
    const url = 'https://accounts.spotify.com/api/token';
    const data = {
      client_id: SPOTIFY_ID,
      client_secret: SPOTIFY_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data),
    });
    if (response.status !== 200) {
      logger.error(`[Spotify] Refreshing token failed with status: ${response.status}`);
      return false;
    } else {
      logger.info(`[Spotify] Refreshed Token`);
      response = await response.json();
      await dbTokens.set(`spotifyAccess_${userId}`, response.access_token);
      return true;
    }
  }

  async currentlyPlaying(userId, isUri) {
    logger.info(`[Spotify] Getting playing track | URI: ${isUri}`);
    const accessToken = await dbTokens.get(`spotifyAccess_${userId}`);
    if (!accessToken) {
      return null;
    }
    const url = 'https://api.spotify.com/v1/me/player/currently-playing';
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    switch (response.status) {
      case 200: {
        logger.info(`[Spotify] Got Currently Playing`);
        response = await response.json();
        if (response.currently_playing_type === 'ad') {
          return 'Ad';
        } else if (isUri) {
          return response.item.uri;
        } else {
          return response.item.external_urls.spotify;
        }
      }
      case 204: {
        logger.info(`[Spotify] Got Currently Playing`);
        return 'Nothing Playing';
      }
      case 401: {
        logger.info(`[Spotify] Expired Token`);
        if (await this.refreshUserToken(userId)) {
          return await this.currentlyPlaying(userId, uri);
        }
      }
      default: {
        throw new Error(`[Spotify] Failed to get currently playing with status: ${response.status}`);
      }
    }
  }
}

export default new Spotify();
