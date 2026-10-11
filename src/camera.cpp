#include "camera.h"
#include "config.h"
#include "esp_camera.h"
#include "esp_heap_caps.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"

// The latest JPEG, owned by the camera task. Readers copy it out under the mutex.
static SemaphoreHandle_t frameMutex = nullptr;
static uint8_t *latestBuf = nullptr;
static size_t latestLen = 0;
static size_t latestCap = 0;
static volatile bool ready = false;

static void storeFrame(const camera_fb_t *fb) {
    if (xSemaphoreTake(frameMutex, pdMS_TO_TICKS(50)) != pdTRUE) return; // a reader is copying; skip this frame
    if (fb->len > latestCap) {
        uint8_t *grown = (uint8_t *)heap_caps_realloc(latestBuf, fb->len, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
        if (grown) {
            latestBuf = grown;
            latestCap = fb->len;
        }
    }
    if (latestCap >= fb->len) {
        memcpy(latestBuf, fb->buf, fb->len);
        latestLen = fb->len;
        ready = true;
    }
    xSemaphoreGive(frameMutex);
}

// Grabs frames forever. Only this task ever touches the driver, so a slow or
// stalled sensor can never block an HTTP handler.
static void cameraTask(void *) {
    for (;;) {
        camera_fb_t *fb = esp_camera_fb_get();
        if (fb) {
            if (fb->format == PIXFORMAT_JPEG && fb->len > 0) storeFrame(fb);
            esp_camera_fb_return(fb);
        }
        vTaskDelay(pdMS_TO_TICKS(CAMERA_FRAME_INTERVAL_MS));
    }
}

bool initCamera() {
    if (!psramFound()) {
        Serial.println("ERROR: PSRAM not found. Camera cannot initialize without it.");
        return false;
    }

    camera_config_t config = {};
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sccb_sda = SIOD_GPIO_NUM;
    config.pin_sccb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.frame_size = FRAMESIZE_VGA;
    config.pixel_format = PIXFORMAT_JPEG;
    config.grab_mode = CAMERA_GRAB_LATEST;
    config.fb_location = CAMERA_FB_IN_PSRAM;
    config.jpeg_quality = 12;
    config.fb_count = 2;

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x\n", err);
        return false;
    }

    // Orientation (see CAMERA_VFLIP / CAMERA_HMIRROR in config.h).
    sensor_t *sensor = esp_camera_sensor_get();
    if (sensor) {
        sensor->set_vflip(sensor, CAMERA_VFLIP);
        sensor->set_hmirror(sensor, CAMERA_HMIRROR);
    }

    frameMutex = xSemaphoreCreateMutex();
    // Core 1 alongside loop(); Wi-Fi and the web server live on core 0.
    if (xTaskCreatePinnedToCore(cameraTask, "camera", 4096, nullptr, 1, nullptr, 1) != pdPASS) {
        Serial.println("ERROR: could not start the camera task.");
        return false;
    }

    Serial.println("Camera initialized.");
    return true;
}

bool cameraIsReady() {
    return ready;
}

bool cameraSnapshot(uint8_t **outBuf, size_t *outLen) {
    if (!ready || !frameMutex) return false;
    if (xSemaphoreTake(frameMutex, pdMS_TO_TICKS(100)) != pdTRUE) return false;

    bool ok = false;
    uint8_t *copy = (uint8_t *)heap_caps_malloc(latestLen, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
    if (!copy) copy = (uint8_t *)malloc(latestLen);
    if (copy) {
        memcpy(copy, latestBuf, latestLen);
        *outBuf = copy;
        *outLen = latestLen;
        ok = true;
    }
    xSemaphoreGive(frameMutex);
    return ok;
}
