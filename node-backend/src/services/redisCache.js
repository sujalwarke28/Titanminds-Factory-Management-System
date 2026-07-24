const { createClient } = require("redis");

class RedisCache {
  constructor(url, keyPrefix, ttlSeconds) {
    this.url = url;
    this.keyPrefix = keyPrefix;
    this.ttlSeconds = ttlSeconds;
    this.client = null;
  }

  async connect() {
    if (this.client) {
      return this.client;
    }

    this.client = createClient({ url: this.url });
    this.client.on("error", (error) => {
      console.error("Redis error:", error);
    });
    await this.client.connect();
    return this.client;
  }

  buildKey(machineId, suffix) {
    return `${this.keyPrefix}:live:${machineId}:${suffix}`;
  }

  async storeLiveReading(machineId, sensorPayload, prediction) {
    const client = await this.connect();
    const keys = {
      snapshot: this.buildKey(machineId, "snapshot"),
      sensor: this.buildKey(machineId, "sensor"),
      prediction: this.buildKey(machineId, "prediction")
    };

    const snapshot = {
      machine_id: machineId,
      sensor: sensorPayload,
      prediction,
      updated_at: new Date().toISOString()
    };

    await client
      .multi()
      .set(keys.snapshot, JSON.stringify(snapshot), { EX: this.ttlSeconds })
      .set(keys.sensor, JSON.stringify(sensorPayload), { EX: this.ttlSeconds })
      .set(keys.prediction, JSON.stringify(prediction), { EX: this.ttlSeconds })
      .exec();

    return keys;
  }

  async close() {
    if (!this.client) {
      return;
    }

    await this.client.quit();
    this.client = null;
  }
}

module.exports = {
  RedisCache
};