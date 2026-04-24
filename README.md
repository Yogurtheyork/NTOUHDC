# NTOU Space Booking Helper

A Chrome browser extension designed to automate the process of booking club venues at National Taiwan Ocean University (NTOU). 

## Features
- **Automated Form Filling**: Automatically fills in club names, phone numbers, emails, and activity details.
- **Multi-day Booking**: Book spaces for multiple consecutive days in a single run.
- **Time Slot Selection**: Select specific time slots (e.g., 5 PM to 8 PM) for your activity.
- **Background Automation**: The extension runs in the background, automatically navigating through the booking system to complete requests day-by-day.

## Installation



### Local Installation (Developer Mode)
1. Download or clone this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the directory containing this project.
5. The extension will now appear in your browser.

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
