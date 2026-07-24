const { z } = require("zod");

const sensorPayloadSchema = z.object({
  machine_id: z.string().min(1),
  temperature: z.number(),
  vibration: z.number(),
  sound: z.number(),
  timestamp: z.coerce.date(),
  metadata: z.record(z.any()).default({})
});

function formatSensorPayload(payload) {
  return {
    machine_id: payload.machine_id,
    temperature: payload.temperature,
    vibration: payload.vibration,
    sound: payload.sound,
    timestamp: payload.timestamp.toISOString(),
    metadata: payload.metadata ?? {}
  };
}

module.exports = {
  sensorPayloadSchema,
  formatSensorPayload
};