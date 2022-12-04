import { Router } from 'express';
import * as path from 'path';
import Anilist from '../utils/anilist.js';
import * as dbWeb from '../utils/databases/web.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/show', async (request, response) => {
  response.sendFile(path.join(__dirname, '../web/html/anime-show.html'));
});

router.get('/current', async (request, response) => {
  const media = await Anilist.getAnimeSeason('FALL', 2022);
  response.send({ media: media });
});

router.get('/show/airing', async (request, response) => {
  const startTime = request.query.start;
  const endTime = request.query.end;
  if (startTime && endTime) {
    const media = await Anilist.getAnimeAiringBetweenTimes(startTime, endTime);
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
  const media = await Anilist.getUserAnimeWatching(userId);
  response.send({ media: media });
});

export default router;
