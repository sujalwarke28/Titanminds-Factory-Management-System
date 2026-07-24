class MLBackendClient {
  constructor(baseUrl, timeoutMs) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
  }

  async predict(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(new URL("/api/predict", this.baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          throw this.buildError(`ML backend returned invalid JSON: ${error.message}`, 502);
        }
      }

      if (!response.ok) {
        const detail = data && typeof data === "object" ? JSON.stringify(data) : text || response.statusText;
        throw this.buildError(`ML backend request failed (${response.status}): ${detail}`, response.status >= 500 ? 502 : response.status);
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw this.buildError("ML backend request timed out", 504);
      }

      if (error.statusCode) {
        throw error;
      }

      throw this.buildError(`Unable to reach ML backend: ${error.message}`, 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  buildError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  async close() {
    return undefined;
  }
}

module.exports = {
  MLBackendClient
};