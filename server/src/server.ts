import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.port, () => {
  console.info(`API EliteFit démarrée sur http://localhost:${env.port}/api`);
});
