import * as path from 'path';
import anilist from '../utils/anilist.js';
const dbWeb = require('../databaseUtils/web');
import { Router } from 'express';

const router = express.Router();

router.get('/show', async (request, response) => {
  response.sendFile(path.join(__dirname, '../web/html/anime-show.html'));
});

router.get('/current', async (request, response) => {
  const media = await anilist.getAnimeSeason('FALL', 2022);
  response.send({ media: media });
});

router.get('/show/airing', async (request, response) => {
  const startTime = request.query.start;
  const endTime = request.query.end;
  if (startTime && endTime) {
    const media = await anilist.getAnimeAiring(startTime, endTime);
    response.send({ media: media });
  } else {
    response.sendStatus(404);
  }
});

router.get('/show/users', async (request, response) => {
  const users = await dbWeb.getAllAnimeShowUser();
  response.send({ users: users });
});

router.get('/show/watching', async (request, response) => {
  const userId = request.query.userId;
  const media = await anilist.getAnimeWatching(userId);
  response.send({ media: media });
});

export default router;
