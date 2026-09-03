# NTOU Space Booking Helper

A Chrome browser extension designed to automate the process of booking club venues at National Taiwan Ocean University (NTOU). 

## Features
- **Automated Form Filling**: Automatically fills in club names, phone numbers, emails, and activity details.
- **Multi-day Booking**: Book spaces for multiple consecutive days in a single run.
- **Time Slot Selection**: Select specific time slots (e.g., 5 PM to 8 PM) for your activity.
- **Background Automation**: The extension runs in the background, automatically navigating through the booking system to complete requests day-by-day.

## Installation

### For end users (no coding required)
1. Download `NTOU-Helper-Local.zip` from the [latest release](https://github.com/Yogurtheyork/NTOUHDC/releases/latest).
2. Extract it and keep the folder somewhere permanent (e.g. Documents).
3. Open Chrome, go to `chrome://extensions/`, and enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extracted folder (the one that directly contains `manifest.json`).
5. Done. A step-by-step guide with FAQ is included in the zip as `安裝說明.html`.

Microsoft Edge: use `edge://extensions/` instead; the button is labelled **Load unpacked**.

### For developers: build from source
```bash
npm install
npm run build   # compiles TypeScript, copies static files, generates icons, and writes NTOU-Helper-Local.zip
```
After building, `dist/` is a loadable extension folder and `NTOU-Helper-Local.zip` is ready to distribute.

## Usage
1. Log in to the [NTOU Club Venue Booking System](https://sclub.ntou.edu.tw/).
2. Click on the extension icon in your Chrome toolbar.
3. Fill in the required details: Start/End dates, venue, club name, responsible person, phone, email, and time slots.
4. Click **Start Automation**. The extension will automatically navigate the booking system and submit the forms for the selected dates.
5. Wait for the progress bar to complete.

## Permissions Required
- `activeTab`: To read the current tab URL and ensure you are on the NTOU system.
- `storage`: To save your previously entered details (phone, email, club name) for faster form filling next time.
- `scripting`: To execute the automation scripts directly on the booking page.

## License
MIT License
