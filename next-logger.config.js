const pino = require("pino");

module.exports.logger = (defaultConfig = {}) =>
  pino({
    ...defaultConfig,
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    transport:
      process.env.NODE_ENV === "development"
        ? undefined // raw JSON in dev for screen-readers (no colors)
        : undefined,
  });
