# Vision Aid — Object Detection Android App

This is a starter-ready Vision Aid application using Expo/React Native and TensorFlow.js COCO-SSD.

## What it does
- Live rear-camera object detection
- Announces the highest-confidence detected object using Android text-to-speech
- Vibration alert
- Bluetooth earphone/speaker support through the phone's selected audio output
- Start/Stop detection
- Voice and vibration switches
- Detection confidence threshold: 60%
- Repeated-object cooldown: 3.5 seconds

## Build an APK without Android Studio

1. Install Node.js LTS on your computer.
2. Open this folder in a terminal.
3. Run:
   npm install
4. Install Expo/EAS:
   npm install -g eas-cli
5. Log in:
   eas login
6. Build an APK:
   eas build --platform android --profile preview
7. EAS will give you a browser link to download the APK.
8. Install the APK on the Android phone.
9. Connect Bluetooth earphones/speaker, grant camera permission, and press START DETECTION.

You can then send the APK through WhatsApp.

## Important
The current version is designed for the app being open in the foreground. Android background camera access has additional restrictions and should be implemented as a separate foreground-service/native feature for a production accessibility device.

The COCO-SSD model recognizes common everyday categories (for example person, car, chair, bottle, dog, cat, etc.). It is not a custom medical/accessibility classifier.

## Production improvements
- Hindi + English selectable voice
- Custom object list
- "Obstacle ahead" / distance estimation
- Multi-object announcements
- Foreground service for supported use cases
- Battery optimization
- Custom TensorFlow Lite model for Vision Aid-specific objects
