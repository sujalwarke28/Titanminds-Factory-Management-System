const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(8100),
  ML_BACKEND_URL: z.string().url().default("http://localhost:8000"),
  ML_BACKEND_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("titanmind"),
  MONGODB_COLLECTION: z.string().min(1).default("sensor_events"),
  REDIS_URL: z.string().min(1),
  REDIS_KEY_PREFIX: z.string().min(1).default("titanmind"),
  REDIS_LIVE_TTL_SECONDS: z.coerce.number().int().positive().default(86400)
});

function loadConfig() {
  return configSchema.parse(process.env);
}

module.exports = {
  loadConfig
};