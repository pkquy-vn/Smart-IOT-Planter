#include <Arduino.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include "esp_camera.h"
#include "config.h"
#include "server.h"

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

    // Web Route 1: The main dashboard with the auto-refreshing image
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
        String html = "<html><head><title>Smart Planter</title>";
        // Auto-refresh the image rapidly in the background to simulate a livestream video
        html += "<script>setInterval(() => { document.getElementById('cam').src = '/capture?rand=' + Math.random(); }, 200);</script>";
        html += "<style>body{text-align:center;font-family:sans-serif;background-color:#121212;color:white;} img{width:100%;max-width:800px;border-radius:10px;box-shadow: 0px 4px 15px rgba(0,0,0,0.5);}</style>";
        html += "</head><body>";
        html += "<h1>Smart Planter Live View</h1>";
        html += "<img id='cam' src='/capture'>";
        html += "</body></html>";
        request->send(200, "text/html", html);
    });

    // Web Route 2: The actual camera frame capture endpoint
    server.on("/capture", HTTP_GET, [](AsyncWebServerRequest *request){
        camera_fb_t * fb = esp_camera_fb_get();
        if (!fb) {
            request->send(500, "text/plain", "Camera capture failed");
            return;
        }
        
        // Safely chunk the image data out of PSRAM to the browser without crashing the ESP32
        AsyncWebServerResponse *response = request->beginResponse("image/jpeg", fb->len, 
            [fb](uint8_t *buffer, size_t maxLen, size_t index) -> size_t {
                size_t bytes_to_send = fb->len - index;
                // If we sent everything, free the camera memory buffer so it can take the next picture!
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
        request->send(response);
    });

    server.begin();
}
