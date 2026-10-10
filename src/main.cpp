#include <Arduino.h>

// User specified GPIO 4 for the Soil Moisture Sensor test
#define SOIL_MOISTURE_PIN 4

// Estimated calibration values (you will need to tune these)
// Air Value (completely dry)
const int DRY_VALUE = 3000; 
// Water Value (completely submerged)
const int WET_VALUE = 1500; 

void setup() {
    // Initialize Serial Monitor at the baud rate specified in platformio.ini
    Serial.begin(115200);
    
    // Wait a brief moment for the serial console to open
    delay(2000); 
    
    Serial.println("===================================");
    Serial.println("Soil Moisture Sensor Test Started");
    Serial.println("===================================");
    
    // Configure the ADC pin
    pinMode(SOIL_MOISTURE_PIN, INPUT);
}

void loop() {
    // 1. Read the raw analog value (12-bit ADC -> 0 to 4095)
    int rawValue = analogRead(SOIL_MOISTURE_PIN);
    
    // 2. Map the raw value to an estimated percentage (0 - 100%)
    // map(value, fromLow, fromHigh, toLow, toHigh)
    int percentage = map(rawValue, DRY_VALUE, WET_VALUE, 0, 100);
    
    // 3. Constrain the percentage so it doesn't go below 0 or above 100 
    // if the raw value exceeds our estimated bounds
    percentage = constrain(percentage, 0, 100);
    
    // 4. Print the results to the Serial Monitor
    Serial.print("Raw Value: ");
    Serial.print(rawValue);
    Serial.print("  |  Estimated Moisture: ");
    Serial.print(percentage);
    Serial.println("%");
    
    // 5. Wait for 1 second before taking the next reading
    delay(1000);
}
