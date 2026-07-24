#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* API_URL = "http://192.168.1.100:8100/api/exp32/sensor-data";
const char* MACHINE_ID = "CNC_01";
const char* NTP_SERVER = "pool.ntp.org";

unsigned long lastPostMs = 0;
const unsigned long POST_INTERVAL_MS = 10000;

String isoTimestampNow() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 2000)) {
    return String("1970-01-01T00:00:00.000Z");
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeInfo);

  char timestamp[30];
  snprintf(timestamp, sizeof(timestamp), "%s.000Z", buffer);
  return String(timestamp);
}

float readTemperature() {
  return 62.0 + (random(-20, 21) / 10.0);
}

float readVibration() {
  return 1.5 + (random(-15, 16) / 100.0);
}

float readSound() {
  return 40.0 + random(-50, 51) / 10.0;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void syncClock() {
  configTime(0, 0, NTP_SERVER);

  struct tm timeInfo;
  while (!getLocalTime(&timeInfo, 2000)) {
    delay(500);
  }
}

bool postSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  StaticJsonDocument<256> doc;
  doc["machine_id"] = MACHINE_ID;
  doc["temperature"] = readTemperature();
  doc["vibration"] = readVibration();
  doc["sound"] = readSound();
  doc["timestamp"] = isoTimestampNow();

  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["device"] = "esp32";
  metadata["source"] = "exp32";

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  int statusCode = http.POST(body);
  String response = http.getString();
  http.end();

  Serial.printf("POST %s -> %d\n", API_URL, statusCode);
  Serial.println(response);

  return statusCode >= 200 && statusCode < 300;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  randomSeed(analogRead(0));
  connectWiFi();
  syncClock();
}

void loop() {
  if (millis() - lastPostMs >= POST_INTERVAL_MS) {
    lastPostMs = millis();
    postSensorData();
  }

  delay(100);
}