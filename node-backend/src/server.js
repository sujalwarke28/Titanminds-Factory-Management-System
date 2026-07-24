const { loadConfig } = require("./config");
const { createApp } = require("./app");
const { MLBackendClient } = require("./services/mlClient");
const { MongoStore } = require("./services/mongoStore");
const { RedisCache } = require("./services/redisCache");

async function main() {
  const config = loadConfig();

  const mlClient = new MLBackendClient(config.ML_BACKEND_URL, config.ML_BACKEND_TIMEOUT_MS);
  const mongoStore = new MongoStore(config.MONGODB_URI, config.MONGODB_DB, config.MONGODB_COLLECTION);
  const redisCache = new RedisCache(config.REDIS_URL, config.REDIS_KEY_PREFIX, config.REDIS_LIVE_TTL_SECONDS);

  await Promise.all([mongoStore.connect(), redisCache.connect()]);

  const app = createApp({ mlClient, mongoStore, redisCache });
  const server = app.listen(config.PORT, () => {
    console.log(`TitanMind Node backend listening on port ${config.PORT}`);
  });

  const shutdown = async () => {
    server.close(() => {
      console.log("HTTP server closed");
    });

    await Promise.allSettled([mlClient.close(), mongoStore.close(), redisCache.close()]);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start TitanMind Node backend:", error);
  process.exit(1);
});