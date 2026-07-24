const express = require("express");
const { sensorPayloadSchema, formatSensorPayload } = require("../validation/sensor");

function createExp32Router(deps) {
  const router = express.Router();

  router.post("/sensor-data", async (req, res, next) => {
    try {
      const sensorPayload = sensorPayloadSchema.parse(req.body);
      const mlRequestPayload = formatSensorPayload(sensorPayload);

      const prediction = await deps.mlClient.predict(mlRequestPayload);

      const record = {
        machine_id: sensorPayload.machine_id,
        sensor: mlRequestPayload,
        prediction,
        source: "exp32",
        created_at: new Date(),
        updated_at: new Date()
      };

      const mongoRecordId = await deps.mongoStore.saveEvent(record);

      let cacheStatus = "updated";
      let cacheKeys = {};

      try {
        cacheKeys = await deps.redisCache.storeLiveReading(sensorPayload.machine_id, mlRequestPayload, prediction);
      } catch (cacheError) {
        cacheStatus = "degraded";
        console.error("Redis cache update failed:", cacheError);
      }

      res.status(201).json({
        machine_id: sensorPayload.machine_id,
        mongo_record_id: mongoRecordId,
        prediction,
        cache_status: cacheStatus,
        cache_keys: cacheKeys
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createExp32Router
};