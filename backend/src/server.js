const { createApp } = require('./app');
const { getEnv, logConfigSummary } = require('./config/env');

const env = getEnv();
const app = createApp();

logConfigSummary(env);

app.listen(env.app.port, env.app.host, () => {
  // Placeholder entrypoint for the backend scaffold.
  // Extend with logging, graceful shutdown, and process management when implementation begins.
  console.log(`CloudTune backend listening on http://${env.app.host}:${env.app.port}`);
});