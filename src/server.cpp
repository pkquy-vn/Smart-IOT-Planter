#include <Arduino.h>
#include <memory>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include "config.h"
#include "server.h"
#include "sensors.h"
#include "camera.h"
#include "pump.h"

static AsyncWebServer server(80);

// The dashboard lives in flash (PROGMEM) and is streamed straight from there,
// so no 3 KB String is built per request. Edit it like a normal HTML file.
static const char INDEX_HTML[] PROGMEM = R"HTML(<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Smart Planter</title>
<style>
  body{text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#121212;color:#fff;margin:0;padding:20px}
  .container{max-width:700px;margin:0 auto}
  .cam{position:relative;aspect-ratio:4/3;background:#1e1e1e;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.6);margin-bottom:16px}
  .cam img{width:100%;height:100%;object-fit:cover;display:block}
  .cam .off{position:absolute;inset:0;display:none;align-items:center;justify-content:center;color:#aaa}
  .cam.nosignal img{display:none}.cam.nosignal .off{display:flex}
  .stats{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:18px}
  .card{background:#1e1e1e;padding:14px 20px;border-radius:12px;min-width:120px;flex:1}
  .label{font-size:13px;color:#aaa}.val{font-size:28px;font-weight:bold;color:#4CAF50}
  button{background:#2e7d32;color:#fff;border:none;padding:14px 28px;font-size:16px;font-weight:bold;border-radius:30px;cursor:pointer;transition:.2s}
  button:hover{background:#388e3c}button:disabled{background:#555}
  #msg{margin-top:12px;font-size:14px;min-height:20px;color:#aaa}
</style>
</head>
<body>
<div class="container">
  <h1>&#127793; Smart Planter</h1>
  <div class="cam" id="cam"><img id="frame" alt="Live camera"><div class="off">Camera not available</div></div>
  <div class="stats">
    <div class="card"><div class="label">Soil moisture</div><div class="val" id="moist">--%</div></div>
    <div class="card"><div class="label">Temperature</div><div class="val" id="temp">--</div></div>
    <div class="card"><div class="label">Humidity</div><div class="val" id="hum">--</div></div>
  </div>
  <button id="wbtn" onclick="water()">Water plant</button>
  <div id="msg"></div>
</div>
<script>
  const $ = id => document.getElementById(id);
  let camOk = true;
  $('frame').onload = () => { camOk = true; $('cam').classList.remove('nosignal'); };
  $('frame').onerror = () => { camOk = false; $('cam').classList.add('nosignal'); };
  function refreshFrame(){ $('frame').src = '/capture?t=' + Date.now(); }
  setInterval(refreshFrame, 1000); refreshFrame();

  async function updateStats(){
    try{
      const d = await (await fetch('/status')).json();
      $('moist').innerText = d.moisture + '%';
      $('temp').innerText = d.temperature == null ? '--' : d.temperature.toFixed(1) + ' °C';
      $('hum').innerText = d.humidity == null ? '--' : Math.round(d.humidity) + '%';
      $('wbtn').disabled = d.pumpRunning;
      if (d.pumpRunning) $('msg').innerText = 'Watering…';
      else if (d.cooldownMs > 0) $('msg').innerText = 'Next watering in ' + Math.ceil(d.cooldownMs/1000) + ' s';
      else if ($('msg').innerText.startsWith('Next watering')) $('msg').innerText = '';
    }catch(e){ $('msg').innerText = 'Lost connection to the planter'; }
  }
  setInterval(updateStats, 2000); updateStats();

  async function water(){
    $('wbtn').disabled = true; $('msg').innerText = 'Starting pump…';
    try{
      const r = await fetch('/water', {method:'POST'}); const d = await r.json();
      $('msg').innerText = d.ok ? 'Watering…' : (d.error || 'Could not water');
    }catch(e){ $('msg').innerText = 'Failed to reach the planter.'; }
    setTimeout(updateStats, 500);
  }
</script>
</body>
</html>)HTML";

static void sendJson(AsyncWebServerRequest *request, int code, const String &json) {
    request->send(code, "application/json", json);
}

void initServer() {
    Serial.print("\n-> Starting Access Point: ");
    Serial.println(AP_SSID);

    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    delay(500); // let the AP come up before printing its address

    Serial.println("\n=======================================");
    Serial.println("Access Point Created Successfully!");
    Serial.print("-> 1. Connect your phone/laptop to Wi-Fi: ");
    Serial.println(AP_SSID);
    Serial.print("-> 2. Open http://");
    Serial.println(WiFi.softAPIP());
    Serial.println("=======================================");

    // The mobile app and the browser dashboard are different origins, so every
    // response carries CORS headers.
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");

    // GET / : the dashboard, served from flash
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        AsyncWebServerResponse *response =
            request->beginResponse(200, "text/html", (const uint8_t *)INDEX_HTML, sizeof(INDEX_HTML) - 1);
        request->send(response);
    });

    // GET /status : everything the app needs in one call
    server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
        float t = getTemperatureC();
        float h = getHumidity();

        String json;
        json.reserve(192);
        json += "{\"moisture\":";
        json += getMoisturePercentage();
        json += ",\"raw\":";
        json += getMoistureRaw();
        json += ",\"temperature\":";
        if (isnan(t)) json += "null"; else json += String(t, 1);
        json += ",\"humidity\":";
        if (isnan(h)) json += "null"; else json += String(h, 0);
        json += ",\"pumpRunning\":";
        json += pumpIsRunning() ? "true" : "false";
        json += ",\"cooldownMs\":";
        json += pumpCooldownRemainingMs();
        json += ",\"runsToday\":";
        json += pumpRunsLast24h();
        json += ",\"cameraReady\":";
        json += cameraIsReady() ? "true" : "false";
        json += ",\"uptimeMs\":";
        json += millis();
        json += "}";
        sendJson(request, 200, json);
    });

    // POST /water : run the pump once (duration and limits live in config.h)
    server.on("/water", HTTP_POST, [](AsyncWebServerRequest *request) {
        PumpResult r = pumpStart();
        if (r == PUMP_STARTED) {
            sendJson(request, 200, "{\"ok\":true}");
            return;
        }
        String json = "{\"ok\":false,\"error\":\"";
        json += pumpResultMessage(r);
        json += "\",\"cooldownMs\":";
        json += pumpCooldownRemainingMs();
        json += "}";
        // 429 = too many requests: the client did nothing wrong, it just has to wait.
        sendJson(request, 429, json);
    });

    // GET /capture : the latest JPEG. Copies out of the camera task's buffer,
    // so it never waits on the sensor and never holds a driver frame buffer.
    server.on("/capture", HTTP_GET, [](AsyncWebServerRequest *request) {
        uint8_t *buf = nullptr;
        size_t len = 0;
        if (!cameraSnapshot(&buf, &len)) {
            request->send(503, "text/plain", cameraIsReady() ? "Camera busy, retry" : "Camera not available");
            return;
        }

        // Freed when the response (and this lambda) is destroyed, i.e. after the
        // last byte is sent or the client disconnects.
        std::shared_ptr<uint8_t> frame(buf, free);
        AsyncWebServerResponse *response = request->beginResponse("image/jpeg", len,
            [frame, len](uint8_t *out, size_t maxLen, size_t index) -> size_t {
                if (index >= len) return 0;
                size_t chunk = len - index;
                if (chunk > maxLen) chunk = maxLen;
                memcpy(out, frame.get() + index, chunk);
                return chunk;
            });
        response->addHeader("Cache-Control", "no-store");
        request->send(response);
    });

    // CORS preflight and 404s
    server.onNotFound([](AsyncWebServerRequest *request) {
        if (request->method() == HTTP_OPTIONS) {
            request->send(204);
        } else {
            request->send(404, "text/plain", "Not found");
        }
    });

    server.begin();
}
