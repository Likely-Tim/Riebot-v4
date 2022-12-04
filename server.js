import express from 'express';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import logger from './utils/logger.js';
import { readFileSync } from 'node:fs';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import express_openid_connect from 'express-openid-connect';
const { auth, requiresAuth } = express_openid_connect;

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERTIFICATE_PATH = process.env.SSL_CERTIFICATE_PATH;
const BASE_URL = process.env.BASE_URL;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_SECRET = process.env.AUTH0_SECRET;

const sslKey = readFileSync(SSL_KEY_PATH, 'utf8');
const sslCertificate = readFileSync(SSL_CERTIFICATE_PATH, 'utf8');
const credentials = { key: sslKey, cert: sslCertificate };

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: BASE_URL,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: 'https://riebot-v3.us.auth0.com',
};

app.use(auth(authConfig));
app.use(express.json());
app.use(express.static('web'));
app.use(cookieParser());

// Routing
import authService from './routes/auth.js';
import logs from './routes/logs.js';
import anime from './routes/anime.js';
//import googleVision from './routes/googleVision.js';

app.use('/auth', requiresAuth(), authService);
app.use('/logs', requiresAuth(), logs);
app.use('/anime', requiresAuth(), anime);
//app.use('/googleVision', requiresAuth(), googleVision);

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/web/html/index.html');
});

app.get('/user', (request, response) => {
  const user = request.oidc.user;
  if (user) {
    response.send({ user: user.name });
  } else {
    response.send({ user: undefined });
  }
});

app.get('/favicon.ico', (request, response) => {
  response.sendFile(__dirname + '/web/favicon/favicon.ico');
});

app.all('*', (request, response) => {
  response.sendFile(__dirname + '/web/html/404.html');
});

export default function initializeServer() {
  httpServer.listen(3000, () => {
    logger.info('HTTP Server Initialized');
  });
  httpsServer.listen(8443, () => {
    logger.info('HTTPS Server Initialized');
  });
}
