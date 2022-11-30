import * as fs from 'node:fs';
import { Router } from 'express';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/', async (request, response) => {
  response.sendFile(path.join(__dirname, '../web/html/logs.html'));
});

router.get('/currentLogs', async (request, response) => {
  let fileNames = fs.readdirSync(path.join(__dirname, '../logs/runtime'));
  let logNames = [];
  for (let i = 0; i < fileNames.length; i++) {
    if (fileNames[i].endsWith('.log')) {
      logNames.push(fileNames[i]);
    }
  }
  response.send({ logNames: logNames });
});

router.get('/*', async (request, response) => {
  response.sendFile(path.join(__dirname, `../logs/runtime${request.path}`));
});

export default router;
