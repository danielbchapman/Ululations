/*
  Ululations Musical Instrument Prototype. 
  Currently this is designed to run on an Uno R4 which has wifi 
  and some nice debug LEDS, but it will be ported to a smaller form 
  factor if the sensors work out.

 */

#include <string.h>
#include <WiFiS3.h>
#include <OSCMessage.h>
#include "secrets.h"
#include "Arduino_LED_Matrix.h"
#include <WiFiUdp.h>
//Fix from Stack Overflow for Multicast...
//#include "user_interface.h"
//WiFi.mode(WIFI_STA);
// the below instructions and now u will receive.
//wifi_set_sleep_type(NONE_SLEEP_T); //LIGHT_SLEEP_T and MODE_SLEEP_T

//This is the float type used by UDP multicast
union FloatBytes {
  float f;
  byte b[sizeof(float)];
};

//LED Matrix
byte led_frame[8][12] = {
  { 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0 },
  { 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0 },
  { 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0 },
  { 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0 },
  { 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }
}; //defaults to a heart

byte base_frame[8][12] = {
  { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }
}; //blank frame after startup
ArduinoLEDMatrix matrix;
//ENCODE VARIABLES
//Position
bool DEBUG = false;
long index = -999;

long time_last = -1L;//Used for the loop
int STEP = (int)(1000.0 / 30.0); //Consider 44Hz...

//WIFI VARIABLES
int status = WL_IDLE_STATUS;

///////please enter your sensitive data in the Secret tab/secrets.h
char ssid[] = WIFI_SSID;
char pass[] = WIFI_PASS;
int keyIndex = 0;

//LOCAL COMMAND PORT
unsigned int RECEIVE_PORT = 53002;  // local port to listen on

char packetBuffer[256];                 //buffer to hold incoming packet
char ReplyBuffer[] = "acknowledged\n";  // a string to send back

IPAddress server = IPAddress(192, 168, 0, 33);
IPAddress backup = IPAddress(192, 168, 0, 138);
IPAddress dev = IPAddress(192, 168, 0, 43);
WiFiUDP Udp;

int MOTOR_INDEX_0 = 3;
int MOTOR_INDEX_1 = 5;
int MOTOR_INDEX_2 = 6;

//MULTICAST TESTING
//Node.js
// const MULTICAST_ADDRESS = '230.1.2.3'; // A valid multicast address (e.g., 224.0.0.0 - 239.255.255.255)
// const MULTICAST_PORT = 5554;
//230.1.2.3:5554
IPAddress multicastIP = IPAddress(230, 1, 2, 3);  // Multicast group address
unsigned int multicastPort = 5554;    // Port to listen on

WiFiUDP multicast;

void setup() {
  //Display Heart When Connecting
  matrix.begin();
  matrix.renderBitmap(led_frame, 8, 12);

  //Initialize serial and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ;  // wait for serial port to connect. Needed for native USB port only
  }
  index = 0;

  //MOTOR PWM Controls
  Serial.println("Motor Intiface Connection Starting Up...");
  Serial.println("Attempting to connect to Wifi");
  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    // don't continue
    while (true)
      ;
  }

  String fv = WiFi.firmwareVersion();
  Serial.println(fv);
  // if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
  //   Serial.println("Please upgrade the firmware");
  // }

  // attempt to connect to WiFi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);

    // wait 10 seconds for connection:
    delay(10000);
  }
  Serial.println("Connected to WiFi");
  printWifiStatus();

  Serial.println("\nStarting connection to server...");
  // if you get a connection, report back via serial:
  
  Serial.println("\nLED Frames recalibrated");


  Serial.println("\nLED Frames Loaded");
  //I think this call blocks indefinitely...
  int status = Udp.begin(RECEIVE_PORT);
  Serial.println(status);
  Serial.println("\nUDP Listening");
  matrix.renderBitmap(base_frame, 8, 12);


  //MULTICAST GROUP
  //Start listening to multicast
  if (multicast.beginMulticast(multicastIP, multicastPort)) {
    Serial.println("Joined multicast group");
  } else {
    Serial.println("Failed to join multicast group");
  }
}

void writeBar(int index, int percentage) {
  int max = percentage / 10;

  if(true) { //future DEBUG
    Serial.print("Writing status");
    Serial.print(index);
    Serial.print(" to ");
    Serial.print(percentage);

    
    Serial.print(" Writing index to ");
    Serial.print(max);
    Serial.println();
  }
  
  if(max > 10) {
    max = 10;
  } 
  if(max < 0) {
    max = 0;
  }
  //Lazy but clear cells
  for(int i = 1; i < 12; i++) {
    base_frame[index][i] = 0;
  }
  //Then write the bar
  for(int i = 0; i < max; i++) {
    base_frame[index][i+1] = 1;
  }
  matrix.renderBitmap(base_frame, 8, 12);
  Serial.println("EXITING LOOP");
}

/**
 * Write a PWM motor level at the specific index 
 */
void setMotorValue(int index, int level) {
  if(index == 0) {

  } else if (index == 1) {

  } else if (index == 2) {

  } else {
    Serial.println("invalid index for writePwm, only 0, 1, or 2 are supported");
  }
}

int wait = 22;  //44HZ, 1000/44
void loop() {
  //
  //METER LOOP to 44Hz
  long time_now = millis();
  if (time_now - time_last > STEP) {
    if (DEBUG) {
      Serial.print("index:");
      Serial.print(index);
      Serial.print(",time:");
      Serial.print(time_now);
      Serial.println();
    } 

    //sendDataOSC(server); no current need for this
    readUdp(); //We read once a loop, hopefully there isn't a collision on the buffers, I don't think we're over about 10Hz here on three devices. Shit might be dropped though.
    readMulticast();
    time_last = time_now;
  }
  return;
}

uint8_t OSC_BUFFER[1024];

void readUdp() {
  int len = Udp.parsePacket();
  if (len > 0) {
    OSCMessage msg;
    Udp.readBytes(OSC_BUFFER, len);
    Serial.println("Packet Received");
    msg.fill(OSC_BUFFER, len);
    if (msg.hasError()) {
      Serial.println("Misformated message");
      return; //Exit
    }
    String s = String(msg.getAddress());
    long value = (long)msg.getInt(0);

    msg.empty();
    sendMulticastDebug();
    // for(int i = 0; i < len; i++) {
    //   Serial.print(OSC_BUFFER[i]);
    //   Serial.print("->");
    //   Serial.println(i);
    // }
    // Serial.println("A PACKET");
  }
}

// //Simple Multicast Reader
void readMulticast() {
  
  int packetSize = multicast.parsePacket();
  //Serial.println("Multicast Loop");


  if (packetSize) {
    Serial.print("Loop -> UDP local port: ");
    Serial.println(multicastPort);
    Serial.print("Packet Size: ");
    Serial.println(packetSize);
    Serial.print("From IP: ");
    Serial.println(multicast.remoteIP());

    char buffer[255];
    int len = multicast.read(buffer, sizeof(buffer) - 1);
    if (len > 0) {
      buffer[len] = '\0';
      Serial.print("Received packet: ");
      Serial.println(buffer);
    }
  }
}

//Simple debug to see if backwards works...works fine...receiving is pointless though. 
void sendMulticastDebug() {
  
  const char* message = "Hello from Uno R4!";
  multicast.beginMulticastPacket();
  multicast.write(message);
  multicast.endPacket();
  Serial.println("Sending multicast debug packet...");
}
//Utility Code
void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID()); 

  // print your board's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}

//LOGIC FOR THE INSTRUMENT
float ACCELERATION_X = 0.0f;
float ACCELERATION_Y = 0.0f;
float ACCELERATION_Z = 0.0f;

float GYRO_X = 0.0f;
float GYRO_Y = 0.0f;
float GYRO_Z = 0.0f;

int INSTRUMENT_ID = 0;

//Attempt to send OSC multicast
OSCMessage msg("/live");
void sendDataOSC(IPAddress to) {
  msg.add(ACCELERATION_X);
  msg.add(ACCELERATION_Y);
  msg.add(ACCELERATION_Z);

  msg.add(GYRO_X);
  msg.add(GYRO_Y);
  msg.add(GYRO_Z);

  multicast.beginMulticastPacket();
  msg.send(multicast);
  multicast.endPacket();
  msg.empty();
  // Udp.beginPacket(to, 8000);
  // msg.send(Udp); 
  // Udp.endPacket();
  // msg.empty();
}

