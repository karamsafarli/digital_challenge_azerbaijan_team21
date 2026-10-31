import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();
const server = http.createServer(app);

server.listen(config.port, () => {
  console.log(`Smart Transit API listening on http://localhost:${config.port}`);
});
