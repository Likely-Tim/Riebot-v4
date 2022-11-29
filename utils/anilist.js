import logger from './logger.js';
import fetch from 'node-fetch';

const SEASON_MAP = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
};

const MONTH_MAP = {
  1: 'Jan',
  2: 'Feb',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'Aug',
  9: 'Sept',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

class Anilist {
  async searchStaff(query) {
    logger.info(`[Anilist] Searching staff ${query}`);
    const search = `
      {
        Page(perPage: 20) {
          staff(search: "${query}") {
            id
            name {
              full
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got staff`);
      response = await response.json();
      const items = [];
      for (const staff of response.data.Page.staff) {
        if (staff.id && staff.name) {
          items.push({ value: staff.id, label: staff.name.full });
        }
      }
      return items;
    } else {
      logger.info(`[Anilist] Failed to search for staff`);
      return null;
    }
  }

  async searchCharacter(query) {
    logger.info(`[Anilist] Searching character ${query}`);
    const search = `
      {
        Page(perPage: 20) {
          characters(search: "${query}") {
            id
            name {
              full
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got characters`);
      response = await response.json();
      const items = [];
      for (const character of response.data.Page.characters) {
        if (character.id && character.name) {
          items.push({ value: character.id, label: character.name.full });
        }
      }
      return items;
    } else {
      logger.info(`[Anilist] Failed to search for characters`);
      return null;
    }
  }
  async getCharacterInfoFromIds(characterIds) {
    logger.info(`[Anilist] Getting characters from ids ${characterIds}`);
    const search = `
      query {
        Page(perPage: 10) {
          characters(id_in: [${characterIds.join(', ')}]) {
            id
            name {
              full
            }
            image {
              large
            }
            description(asHtml: true)
            dateOfBirth {
              year
              month
              day
            }
            age
            siteUrl
            media(type: ANIME, sort: [ID]) {
              edges {
                node {
                  id
                }
                voiceActors(language: JAPANESE, sort: RELEVANCE) {
                  id
                  name {
                    full
                  }
                }
              }
              nodes {
                id
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      }  
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Character Ids`);
      response = await response.json();
      const idToCharacter = {};
      for (const character of response.data.Page.characters) {
        let dob = [];
        if (character.dateOfBirth.month) {
          dob.push(MONTH_MAP[character.dateOfBirth.month]);
        }
        if (character.dateOfBirth.day) {
          dob.push(String(character.dateOfBirth.day));
        }
        if (character.dateOfBirth.year) {
          dob.push(String(character.dateOfBirth.year));
        }
        if (dob.length === 0) {
          dob = 'N/A';
        } else if (dob.length === 3) {
          dob = `${dob[0]} ${dob[1]}, ${dob[2]}`;
        } else {
          dob = dob.join(' ');
        }
        let vaName = 'N/A';
        let vaId = 'N/A';
        let mediaName = 'N/A';
        let mediaId = 'N/A';
        for (let i = 0; i < character.media.edges.length; i++) {
          if (character.media.edges[i].voiceActors.length !== 0) {
            vaName = character.media.edges[i].voiceActors[0].name.full;
            vaId = character.media.edges[i].voiceActors[0].id;
            mediaId = character.media.nodes[i].id;
            if (character.media.nodes[i].title.romaji) {
              mediaName = character.media.nodes[i].title.romaji;
            } else if (character.media.nodes[i].title.english) {
              mediaName = character.media.nodes[i].title.english;
            }
            break;
          }
        }
        const info = {
          name: character.name.full,
          url: character.siteUrl,
          imageUrl: character.image.large,
          descriptionHtml: character.description,
          age: character.age,
          dob: dob,
          vaName: vaName,
          vaId: vaId,
          media: mediaName,
          mediaId: mediaId,
        };
        idToCharacter[character.id] = info;
      }
      return idToCharacter;
    } else {
      logger.info(`[Anilist] Failed to get characters`);
      return null;
    }
  }

  async getCharacterIdsFromVa(vaId) {
    logger.info(`[Anilist] Getting characters for va ${vaId}`);
    const search = `
      query {
        Staff(id: ${vaId}) {
          characters(sort: [ROLE, FAVOURITES_DESC], perPage: 10) {
            nodes {
              id
              name {
                full
              }
              
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Character Ids`);
      response = await response.json();
      const characters = [];
      for (const character of response.data.Staff.characters.nodes) {
        characters.push({ name: character.name.full, id: character.id });
      }
      return characters;
    } else {
      logger.info(`[Anilist] Failed to get characters`);
      return null;
    }
  }

  async getVa(vaId) {
    logger.info(`[Anilist] Getting voice actor with id ${vaId}`);
    const search = `
      query {
        Staff(id: ${vaId}) {
          name {
            full
          }
          image {
            large
          }
          description(asHtml: true)
          homeTown
          age
          dateOfBirth {
            year
            month
            day
          }
          yearsActive
          siteUrl
          characters(sort: [ROLE, FAVOURITES_DESC], perPage: 10) {
            nodes {
              name {
                full
              }
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Voice Actor`);
      response = await response.json();
      const staff = response.data.Staff;
      let dob = [];
      if (staff.dateOfBirth.month) {
        dob.push(MONTH_MAP[staff.dateOfBirth.month]);
      }
      if (staff.dateOfBirth.day) {
        dob.push(String(staff.dateOfBirth.day));
      }
      if (staff.dateOfBirth.year) {
        dob.push(String(staff.dateOfBirth.year));
      }
      if (dob.length === 0) {
        dob = 'N/A';
      } else if (dob.length === 3) {
        dob = `${dob[0]} ${dob[1]}, ${dob[2]}`;
      } else {
        dob = dob.join(' ');
      }
      return { name: staff.name.full, imageUrl: staff.image.large, descriptionHtml: staff.description, homeTown: staff.homeTown || 'N/A', age: staff.age || 'N/A', dob: dob, url: staff.siteUrl, characters: staff.characters.nodes.length };
    } else {
      logger.info(`[Anilist] Failed to get voice actor id ${characterId}`);
      return null;
    }
  }

  async getVaNameFromCharacter(characterId) {
    logger.info(`[Anilist] Getting voice actor name with character id ${characterId}`);
    const search = `
      {
        Character(id: ${characterId}) {
          media(type: ANIME) {
            edges {
              node {
                id
              }
              voiceActors(language: JAPANESE, sort: RELEVANCE) {
                id
                name {
                  full
                }
              }
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Voice Actor name`);
      response = await response.json();
      let name = null;
      let id = null;
      for (const edge of response.data.Character.media.edges) {
        if (edge.voiceActors.length !== 0) {
          name = edge.voiceActors[0].name.full;
          id = edge.voiceActors[0].id;
          break;
        }
      }
      if (name && id) {
        return { name: name, id: id };
      } else {
        return null;
      }
    } else {
      logger.info(`[Anilist] Failed to get voice actor with characted id ${characterId}`);
      return null;
    }
  }

  async getAnimeCharactersFromShow(showId) {
    logger.info(`[Anilist] Getting anime character with id ${showId}`);
    const search = `
      query {
        Media(id: ${showId}) {
          title {
            romaji
            english
          }
          characters(sort: RELEVANCE, role: MAIN, perPage: 10) {
            nodes {
              id
              name {
                full
              }
              image {
                large
              }
              description (asHtml:true)
              siteUrl
              dateOfBirth {
                year
                month
                day
              }
              age
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Characters`);
      const characters = [];
      response = await response.json();
      let title;
      if (response.data.Media.title.romaji) {
        title = response.data.Media.title.romaji;
      } else {
        title = response.data.Media.title.english;
      }
      for (const character of response.data.Media.characters.nodes) {
        let dob = [];
        if (character.dateOfBirth.month) {
          dob.push(MONTH_MAP[character.dateOfBirth.month]);
        }
        if (character.dateOfBirth.day) {
          dob.push(String(character.dateOfBirth.day));
        }
        if (character.dateOfBirth.year) {
          dob.push(String(character.dateOfBirth.year));
        }
        if (dob.length === 0) {
          dob = 'N/A';
        } else if (dob.length === 3) {
          dob = `${dob[0]} ${dob[1]}, ${dob[2]}`;
        } else {
          dob = dob.join(' ');
        }
        characters.push({ id: character.id, name: character.name.full, imageUrl: character.image.large, url: character.siteUrl, descriptionHtml: character.description, dob: dob, age: character.age, media: title, mediaId: showId });
      }
      return characters;
    } else {
      logger.info(`[Anilist] Failed to get anime trend with id ${showId}`);
      return null;
    }
  }

  async getAnimeTrend(id, pageNum) {
    logger.info(`[Anilist] Getting anime trend with id ${id}`);
    if (!pageNum) {
      pageNum = 1;
    }
    logger.info(`[Anilist] Getting anime trend page ${pageNum}`);
    const search = `
      query {
        Media(id: ${id}) {
          trends (page: ${pageNum}, perPage: 25, releasing:true, sort: [EPISODE_DESC]) {
            pageInfo {
              currentPage
              hasNextPage
            }
            nodes {
              averageScore
              date
              episode
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Anime Trend`);
      const trendData = [];
      response = await response.json();
      const trends = response.data.Media.trends.nodes;
      for (const trend of trends) {
        if (trend.episode) {
          trendData.unshift({ episode: trend.episode, score: trend.averageScore });
        }
      }
      if (response.data.Media.trends.pageInfo.hasNextPage && response.data.Media.trends.nodes[response.data.Media.trends.nodes.length - 1].episode) {
        return [...(await this.getAnimeTrend(id, ++pageNum)), ...trendData];
      }
      return trendData;
    } else {
      logger.info(`[Anilist] Failed to get anime trend with id ${id}`);
      return null;
    }
  }

  async getAnime(id) {
    logger.info(`[Anilist] Getting anime with id ${id}`);
    const search = `
      query {
        Media(id: ${id}, type: ANIME) {
          id
          title {
            english
            romaji
          }
          status
          description(asHtml: true)
          season
          seasonYear
          episodes
          trailer {
            site
            id
          }
          coverImage {
            large
          }
          meanScore
          nextAiringEpisode {
            episode
            timeUntilAiring
          }
          siteUrl
          rankings {
            type
            rank
            allTime
            year
            season
          }
          studios {
            nodes {
              name
              isAnimationStudio
            }
          }
          characters (role: MAIN) {
            nodes {
              id
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Got Anime`);
      response = await response.json();
      const media = response.data.Media;
      const mediaInfo = {};
      let title;
      if (media.title.romaji) {
        title = media.title.romaji;
      } else {
        title = media.title.english;
      }
      mediaInfo.id = media.id;
      mediaInfo.title = title;
      mediaInfo.url = media.siteUrl;
      mediaInfo.status = media.status;
      mediaInfo.descriptionHtml = media.description;
      mediaInfo.season = `${SEASON_MAP[media.season]} ${media.seasonYear}`;
      mediaInfo.episodes = media.episodes;
      mediaInfo.score = media.meanScore;
      mediaInfo.coverImage = media.coverImage.large;
      mediaInfo.nextEpisode = media.nextAiringEpisode;
      if (media.trailer) {
        if (media.trailer.site === 'youtube') {
          mediaInfo.trailer = `https://youtu.be/${media.trailer.id}`;
        } else if (media.trailer.site === 'dailymotion') {
          mediaInfo.trailer = `https://dai.ly/${media.trailer.id}`;
        } else {
          mediaInfo.trailer = null;
        }
      }
      const studios = [];
      for (const studio of media.studios.nodes) {
        if (studio.isAnimationStudio) {
          studios.push(studio.name);
        }
      }
      if (studios.length === 0) {
        mediaInfo.studios = ' ';
      } else {
        mediaInfo.studios = studios.join(', ');
      }
      let ranking = [];
      for (const rank of media.rankings) {
        if (rank.type == 'POPULAR') {
          continue;
        }
        if (rank.allTime) {
          ranking.unshift(`➤ **All Time**: #${rank.rank}`);
        } else {
          if (rank.season && rank.year) {
            ranking.push(`➤ **${SEASON_MAP[rank.season]} ${rank.year}**: #${rank.rank}`);
          }
        }
      }
      if (ranking.length === 0) {
        mediaInfo.rank = null;
      } else {
        mediaInfo.rank = ranking.join('\n');
      }
      if (media.characters.nodes.length === 0) {
        mediaInfo.haveMain = false;
      } else {
        mediaInfo.haveMain = true;
      }
      return mediaInfo;
    } else {
      logger.error(`[Anilist] Failed to get show with status ${response.status}`);
      return null;
    }
  }

  async searchAnime(query) {
    logger.info(`[Anilist] Searching for anime ${query}`);
    const search = `
      query {
        Page(perPage: 20) {
          media (search: "${query}", type: ANIME) {
            id
            title {
              english,
              romaji
            }
          }
        }
      }
    `;
    const url = 'https://graphql.anilist.co';
    let response = await sendPostRequest(url, search);
    if (response.status === 200) {
      logger.info(`[Anilist] Successfully got anime search`);
      response = await response.json();
      const medias = response.data.Page.media;
      const items = [];
      for (const media of medias) {
        let title;
        if (media.title.romaji) {
          title = media.title.romaji;
        } else if (media.title.english) {
          title = media.title.english;
        } else {
          continue;
        }
        if (media.id) {
          items.push({ value: media.id, label: title });
        } else {
          continue;
        }
      }
      if (items.length === 0) {
        return null;
      } else {
        return items;
      }
    } else {
      logger.error(`[Anilist] Failed to search for show with status ${response.status}`);
      return null;
    }
  }
}

async function sendPostRequest(url, search) {
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: search,
    }),
  });
  return response;
}

export default new Anilist();
