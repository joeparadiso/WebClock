# WebClock Dashboard

**WebClock** is a customizable, feature-rich digital dashboard designed to run in any modern web browser. It aggregates essential daily information—live clock, weather conditions, astronomical sun data, and MBTA commuter rail schedules—configured for **Dedham, MA**.

It features an advanced theming engine with preset visual styles, dynamic background imagery, interactive color pickers with automatic synchronization, persistent preferences, and a built-in countdown timer.

## 📸 Screenshots

### Main Dashboard

![Main Dashboard View](images/webClockImg_1.png)
_The main view showing the clock, weather, sun times, and train schedule._

### Theme Customization

![Theme Menu](images/webClockImg_2.png)
_The customization menu allowing for theme selection and manual color adjustments._

---

## ✨ Features

### 🕒 Time & Date
- **Digital Clock:** Large, easy-to-read 12-hour display (HH:MM:SS) using the _Chivo Mono_ font.
- **Calendar:** Displays current Day of the week, Month, Date, and Year.
- **Sun Data:** Real-time astronomical data fetching **Sunrise** and **Sunset** times for Dedham, MA (via `sunrisesunset.io`).

### 🌦️ Weather Widget
- **Current Conditions:** Real-time temperature, "feels like" temp, and sky condition description.
- **Forecast:** Period-based high/low temperature display (Morning, Afternoon, Evening, Night).
- **Wind:** Real-time wind speed in MPH.
- _Powered by OpenWeatherMap API_.

### 🚆 MBTA Commuter Rail Tracker
- **Route:** Monitors the **Dedham Corporate Center** to **South Station** inbound line.
- **Real-Time Data:** Fetches live real-time predictions; seamlessly falls back to scheduled times if live data is unavailable.
- **Info:** Displays next Departure Time, official Train Number with Route Name (e.g. `5768 (Franklin/Foxboro)`), and estimated Arrival Time at South Station.
- _Powered by MBTA V3 API_.

### 🎨 Advanced Theming & Persistence
- **Dual Theme Selectors:** Choose from "General Themes" (abstract/color palettes) or "Field Themes" (scenic nature backgrounds).
- **Interactive Color Pickers:** Fine-grained runtime control over Box Shadows, Clock Backgrounds, Text Colors, Timer Colors, and Navbar Colors.
- **Bi-directional Color Sync:** Selecting any preset theme automatically syncs the color pickers to the theme's palette.
- **Persistence:** Selected themes and settings automatically persist across page reloads via `localStorage`.

### ⏳ Countdown Timer
- Target specific dates and times with instant real-time countdown.
- Displays remaining Days, Hours, Minutes, and Seconds.
- Audio alarm (`alarm.mp3`) triggers upon completion.
- Streamlined **Start** and **Reset** controls.

---

## 🚀 How to Use

### 1. Installation

Because this is a static web project, no server installation or build step is required.

1. Download/clone the repository.
2. Ensure you have the `alarm.mp3` file in the root directory for timer audio.
3. Open `index.html` in any modern web browser.

### 2. Navigation & Theming

1. Click the **Hamburger Menu (☰)** in the top-left corner of the navbar to open settings.
2. **Select a Preset:**
   - **General Themes:** Abstract palettes (e.g., _Lava, Thunderstorm, Under The Sea_).
   - **Field Themes:** Nature and seasonal themes (e.g., _Morning Field, Rainy Field, Autumnal Field_).
3. **Manual Customization:** Use the color pickers to customize specific elements. Picking a custom Page Background automatically transitions from image mode to a sleek custom gradient.

### 3. Using the Timer

Located at the bottom of the dashboard:

1. **Enter Date:** Select the target date.
2. **Enter Time:** Select the target time.
3. Click **Start**. The countdown will validate the time and begin immediately.
4. Click **Reset** at any time to cancel the countdown, silence the alarm, and clear the display.

---

## ⚙️ Configuration

The project is currently configured for **Dedham, MA**. To customize the location or transit line, edit the configuration constants at the top of each JavaScript file:

- **Weather Location:**
  - Open `weather.js`
  - Update `const CITY = "Dedham";` or modify the coordinates in `WEATHER_API_URL`.
- **Sun Time Coordinates:**
  - Open `sunTimes.js`
  - Update `const LATITUDE` and `const LONGITUDE`.
- **MBTA Stops & Direction:**
  - Open `nextTrain.js`
  - Update `DEDHAM_STOP_ID` (origin) and `SOUTH_STATION_STOP_ID` (destination).

---

## 📂 Project Structure

```text
/
├── index.html       # Semantic HTML layout and Google Fonts integration
├── styles.css       # Core styling, layout geometry, and CSS custom properties
├── clock.js         # Digital clock, date formatting, and countdown timer logic
├── themes.js        # Theme definitions, color picker sync, and localStorage persistence
├── weather.js       # OpenWeatherMap API integration and weather widget rendering
├── sunTimes.js      # SunriseSunset.io API integration and astronomical formatting
├── nextTrain.js     # MBTA v3 API integration for real-time commuter rail tracking
├── alarm.mp3        # Audio sound for timer completion
└── images/          # Background images for scenic and seasonal themes
```

---

## 🔗 APIs Used

- [**MBTA V3 API**](https://www.mbta.com/developers/v3-api) - Commuter rail schedules and real-time predictions.
- [**OpenWeatherMap API**](https://openweathermap.org/api) - Current weather and temperature data.
- [**SunriseSunset.io API**](https://sunrisesunset.io/api/) - Astronomical sunrise and sunset data.

---

## © License

© 2025 Joe Paradiso.
_Personal project for educational purposes._

