#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include "esp_camera.h"
#include "config.h"
#include "server.h"
#include "sensors.h"
#include "pump.h"

AsyncWebServer server(80);

void initServer() {
    Serial.print("\n-> Starting Access Point: ");
    Serial.println(AP_SSID);

    // Start ESP32 in AP Mode
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    
    // Give the hardware a moment to broadcast the network
    delay(2000); 
    
    Serial.println("\n=======================================");
    Serial.println("Access Point Created Successfully!");
    Serial.print("-> 1. Connect your laptop to Wi-Fi: ");
    Serial.println(AP_SSID);
    Serial.print("-> 2. Go to your LIVE CAMERA URL: http://");
    Serial.println(WiFi.softAPIP());
    Serial.println("=======================================");

    // Web Route 1: The main dashboard with the auto-refreshing image and status
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'><title>Smart Planter</title>";
        html += "<style>";
        html += "body{text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#121212;color:white;margin:0;padding:20px;}";
        html += ".container{max-width:700px;margin:0 auto;}";
        html += "img{width:100%;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.6);margin-bottom:16px;}";
        html += ".stats{display:flex;justify-content:center;gap:16px;margin-bottom:18px;}";
        html += ".card{background:#1e1e1e;padding:16px 24px;border-radius:12px;min-width:140px;}";
        html += ".val{font-size:28px;font-weight:bold;color:#4CAF50;}";
        html += "button{background-color:#2e7d32;color:white;border:none;padding:14px 28px;font-size:16px;font-weight:bold;border-radius:30px;cursor:pointer;transition:0.2s;}";
        html += "button:hover{background-color:#388e3c;} button:disabled{background-color:#555;}";
        html += "#msg{margin-top:12px;font-size:14px;min-height:20px;color:#aaa;}";
        html += "</style>";
        html += "</head><body><div class='container'>";
        html += "<h1>🌱 Smart Planter</h1>";
        html += "<img id='cam' src='/capture'>";
        html += "<div class='stats'>";
        html += "<div class='card'><div>Soil Moisture</div><div class='val' id='moist'>--%</div></div>";
        html += "</div>";
        html += "<button id='wbtn' onclick='water()'>Water Plant</button>";
        html += "<div id='msg'></div>";
        html += "</div>";
        html += "<script>";
        html += "setInterval(()=>{ document.getElementById('cam').src = '/capture?t=' + Date.now(); }, 300);";
        html += "async function updateStats(){ try{ const r=await fetch('/status'); const d=await r.json(); document.getElementById('moist').innerText=d.moisture+'%'; }catch(e){} }";
        html += "setInterval(updateStats, 2000); updateStats();";
        html += "async function water(){";
        html += " const btn=document.getElementById('wbtn'); const msg=document.getElementById('msg');";
        html += " btn.disabled=true; msg.innerText='Watering...';";
        html += " try{";
        html += "   const r=await fetch('/water',{method:'POST'}); const d=await r.json();";
        html += "   if(d.ok){ msg.innerText='Watering complete!'; } else { msg.innerText='Note: ' + (d.error||'Cooldown active'); }";
        html += " }catch(e){ msg.innerText='Failed to trigger water.'; }";
        html += " setTimeout(()=>{ btn.disabled=false; msg.innerText=''; updateStats(); }, 5000);";
        html += "}";
        html += "</script></body></html>";
        request->send(200, "text/html", html);
    });

    // Web Route 2: GET /status for the mobile app
    server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request){
        int moisture = getMoisturePercentage();
        String json = "{\"moisture\":" + String(moisture) + ",\"temperature\":null}";
        AsyncWebServerResponse *response = request->beginResponse(200, "application/json", json);
        response->addHeader("Access-Control-Allow-Origin", "*");
        response->addHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response->addHeader("Access-Control-Allow-Headers", "*");
        request->send(response);
    });

    // Web Route 3: POST /water for the mobile app & web UI
    server.on("/water", HTTP_POST, [](AsyncWebServerRequest *request){
        bool started = pumpStart();
        AsyncWebServerResponse *response;
        if (started) {
            response = request->beginResponse(200, "application/json", "{\"ok\":true}");
        } else {
            response = request->beginResponse(400, "application/json", "{\"ok\":false,\"error\":\"Pump is cooling down or already running\"}");
        }
        response->addHeader("Access-Control-Allow-Origin", "*");
        response->addHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response->addHeader("Access-Control-Allow-Headers", "*");
        request->send(response);
    });

    // Web Route 4: GET /capture - camera frame capture
    server.on("/capture", HTTP_GET, [](AsyncWebServerRequest *request){
        camera_fb_t * fb = esp_camera_fb_get();
        if (!fb) {
            request->send(500, "text/plain", "Camera capture failed");
            return;
        }
        
        AsyncWebServerResponse *response = request->beginResponse("image/jpeg", fb->len, 
            [fb](uint8_t *buffer, size_t maxLen, size_t index) -> size_t {
                size_t bytes_to_send = fb->len - index;
                if (bytes_to_send == 0) {
                    esp_camera_fb_return(fb); 
                    return 0;
                }
                size_t chunk = (bytes_to_send > maxLen) ? maxLen : bytes_to_send;
                memcpy(buffer, fb->buf + index, chunk);
                return chunk;
            }
        );
        
        response->addHeader("Access-Control-Allow-Origin", "*");
        response->addHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response->addHeader("Access-Control-Allow-Headers", "*");
        request->send(response);
    });

    // Handle CORS preflight requests (HTTP OPTIONS) and 404s
    server.onNotFound([](AsyncWebServerRequest *request) {
        if (request->method() == HTTP_OPTIONS) {
            AsyncWebServerResponse *response = request->beginResponse(204);
            response->addHeader("Access-Control-Allow-Origin", "*");
            response->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            request->send(response);
        } else {
            request->send(404, "text/plain", "Not found");
        }
    });

    server.begin();
}
