const express = require("express");
const { createExp32Router } = require("./routes/exp32");

function createApp(deps) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/exp32", createExp32Router(deps));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json({
        error: "RequestError",
        message: "Malformed JSON body"
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "ValidationError",
        message: "Invalid sensor payload",
        issues: error.issues
      });
    }

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      error: statusCode >= 500 ? "InternalServerError" : "RequestError",
      message: error.message || "Unexpected error"
    });
  });

  return app;
}

module.exports = {
  createApp
};