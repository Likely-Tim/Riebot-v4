import logger from './logger.js';

import * as dbTokens from './databases/tokens.js';

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;

class Spotify {
  async refreshToken(userId) {
    let refreshToken;
    if (userId) {
      logger.info(`[Spotify] Refreshing token for user ${userId}`);
      refreshToken = await dbTokens.get(`spotifyRefresh_${userId}`);
    } else {
      logger.info(`[Spotify] Refreshing general token`);
      refreshToken = await dbTokens.get(`spotifyRefresh`);
    }
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
      if (userId) {
        await dbTokens.set(`spotifyAccess_${userId}`, response.access_token);
      } else {
        await dbTokens.set(`spotifyAccess`, response.access_token);
      }
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
    let response = await sendGetRequest(url, accessToken);
    switch (response.status) {
      case 200: {
        logger.info(`[Spotify] Got Currently Playing`);
        response = await response.json();
        if (response.currently_playing_type === 'track') {
          if (isUri) {
            return response.item.uri;
          } else {
            return response.item.external_urls.spotify;
          }
        } else {
          return response.currently_playing_type;
        }
      }
      case 204: {
        logger.info(`[Spotify] Got Currently Playing`);
        return 'Nothing Playing';
      }
      case 401: {
        logger.info(`[Spotify] Expired Token`);
        if (await this.refreshToken(userId)) {
          return await this.currentlyPlaying(userId, isUri);
        }
      }
      default: {
        throw new Error(`[Spotify] Failed to get currently playing with status: ${response.status}`);
      }
    }
  }

  async search(query) {
    logger.info(`[Spotify] Searching for "${query}"`);
    const accessToken = await dbTokens.get('spotifyAccess');
    if (!accessToken) {
      return null;
    }
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=5`;
    let response = await sendGetRequest(url, accessToken);
    switch (response.status) {
      case 200: {
        logger.info(`[Spotify] Got search results`);
        response = await response.json();
        const types = ['tracks', 'albums', 'artists'];
        const items = {};
        for (const type of types) {
          const spotifyInfo = [];
          if (response[type]) {
            for (const item of response[type].items) {
              spotifyInfo.push({ spotifyUrl: item.external_urls.spotify, spotifyUri: item.uri });
            }
          }
          items[type] = spotifyInfo;
        }
        return items;
      }
      case 401: {
        logger.info(`[Spotify] Expired Token`);
        if (await this.refreshToken()) {
          return await this.search(query);
        }
      }
      default: {
        throw new Error(`[Spotify] Failed to get search results with status: ${response.status}`);
      }
    }
  }

  async getTopPlayed(userId, type) {
    logger.info(`[Spotify] Getting top played for user ${userId}`);
    const timeRanges = {
      shortTerm: 'short_term',
      mediumTerm: 'medium_term',
      longTerm: 'long_term',
    };
    const items = {};
    for (const timeRange in timeRanges) {
      const url = `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRanges[timeRange]}&limit=10`;
      const topItems = await spotifyTopRequestor(url, userId);
      if (!topItems) {
        return null;
      }
      items[timeRange] = await spotifyTopRequestor(url, userId);
    }
    return items;
  }
}

async function spotifyTopRequestor(url, userId) {
  const accessToken = await dbTokens.get(`spotifyAccess_${userId}`);
  if (!accessToken) {
    return null;
  }
  let response = await sendGetRequest(url, accessToken);
  switch (response.status) {
    case 200: {
      response = await response.json();
      const items = [];
      for (const item of response.items) {
        items.push({ spotifyUrl: item.external_urls.spotify, spotifyUri: item.uri });
      }
      return items;
    }
    case 401: {
      logger.info(`[Spotify] Expired Token`);
      if (await this.refreshToken(userId)) {
        return await spotifyTopRequestor(url, userId);
      }
    }
    default: {
      throw new Error(`[Spotify] Failed to get top played with status: ${response.status}`);
    }
  }
}

async function sendGetRequest(url, accessToken) {
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
}

export default new Spotify();
