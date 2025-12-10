# WebClock Dashboard

**WebClock** is a highly customizable, feature-rich digital dashboard designed to run in a browser. It aggregates essential daily information—time, weather, astronomical data, and commuter rail schedules—specifically configured for **Dedham, MA**.

It features a robust theming engine allowing for preset visual styles or granular color control, along with a built-in countdown timer.

## 📸 Screenshots

### Main Dashboard

![Main Dashboard View](images/screenshot_main.png)
_The main view showing the clock, weather, sun times, and train schedule._

### Theme Customization

![Theme Menu](images/screenshot_themes.png)
_The customization menu allowing for theme selection and manual color adjustments._

---

## ✨ Features

### 🕒 Time & Date

- **Digital Clock:** Large, easy-to-read display (HH:MM:SS) using the _Chivo Mono_ font.
- **Calendar:** Displays the current Day, Month, Date, and Year.
- **Sun Data:** Real-time fetch of **Sunrise** and **Sunset** times for Dedham, MA (via `sunrisesunset.io`).

### 🌦️ Weather Widget

- **Current Conditions:** Real-time temperature, "feels like" temp, and sky conditions.
- **Forecast:** High/Low temperature display based on the current time of day (Morning, Afternoon, Evening, Night).
- **Wind:** Current wind speed (converted to MPH).
- _Powered by OpenWeatherMap API_.

### 🚆 MBTA Commuter Rail Tracker

- **Route:** Monitors the **Dedham Corporate Center** to **South Station** line.
- **Real-Time Data:** Fetches live predictions; falls back to scheduled times if live data is unavailable.
- **Info:** Displays Departure Time, Train/Route Number, and estimated Arrival Time.
- _Powered by MBTA V3 API_.

### 🎨 Advanced Theming

- **Dual Theme Selectors:** Choose from "General Themes" (abstract/colors) or "Field Themes" (scenic backgrounds).
- **Manual Overrides:** Granular control over almost every element's color (Box Shadows, Clock Backgrounds, Text, Buttons, etc.).
- **Dynamic Backgrounds:** Themes include high-quality background images or gradients.

### ⏳ Countdown Timer

- Target specific dates and times.
- Displays remaining Days, Hours, Minutes, and Seconds.
- Audio alarm (`alarm.mp3`) triggers upon completion.

---

## 🚀 How to Use

### 1. Installation

Because this is a static web project, no server installation is required.

1.  Download the project files.
2.  Ensure you have an `alarm.mp3` file in the root directory for the timer sound.
3.  Open `index.html` in any modern web browser.

### 2. Navigation & Theming

The dashboard features a collapsible **Navbar** at the top of the screen.

1.  Click the **Hamburger Menu (☰)** in the top-left to open the settings.
2.  **Select a Preset:**
    - **General Themes:** Selects from abstract color palettes (e.g., _Lava, Thunderstorm, Under The Sea_).
    - **Field Themes:** Selects from scenic/nature-based themes (e.g., _Morning Field, Rainy Field, Autumnal Field_).
3.  **Manual Customization:** Use the color pickers to override specific elements. For example, if you like the "Lava" theme but want green text, simply change the "Text Color" picker.

### 3. Using the Timer

Located at the bottom of the dashboard:

1.  **Enter Date:** Select the target date.
2.  **Enter Time:** Select the target time.
3.  Click **Start**. The countdown will begin immediately.
4.  **Stop:** Pauses the alarm sound if ringing.
5.  **Reset:** Clears the timer and resets the display to `--`.

### 4. Interpretation of Data

- **Train Data:** If the display reads `Loading...`, the API is fetching data. If it says `-` or `No inbound trains`, there are no scheduled trains for the remainder of the day.
- **Weather:** Updates automatically every 60 seconds.
- **Sun Times:** Updates hourly to ensure accuracy for the current date.

---

## ⚙️ Configuration

The project is currently hardcoded for **Dedham, MA**. To change the location, you must edit the JavaScript files directly:

- **Weather Location:**
  - Open `weather.js`
  - Update `const city = "Dedham";` or change the API call coordinates.
- **Sun Time Coordinates:**
  - Open `sunTimes.js`
  - Update `const latitude` and `const longitude`.
- **MBTA Stops:**
  - Open `nextTrain.js`
  - Update `DEDHAM_STOP_ID` and `SOUTH_STATION_STOP_ID` with your desired MBTA stop IDs.

---

## 📂 Project Structure

```text
/
├── index.html       # Main HTML skeleton
├── styles.css       # Core styling and CSS variables
├── clock.js         # Time logic and Countdown Timer functionality
├── themes.js        # Theme object definitions and color picker logic
├── weather.js       # OpenWeatherMap API fetch and logic
├── sunTimes.js      # SunriseSunset.io API fetch
├── nextTrain.js     # MBTA API logic for train tracking
├── alarm.mp3        # (Required) Audio file for timer
└── images/          # Folder containing background images

```

## 🔗 APIs Used

- [**MBTA V3 API**](https://www.mbta.com/developers/v3-api) - Train schedules and predictions.
- [**OpenWeatherMap**](https://openweathermap.org/api) - Current weather and forecast.
- [**SunriseSunset.io**](https://sunrisesunset.io/api/) - Astronomical data.

---

## © License

© 2025 Joe Paradiso.
_Personal project for educational purposes._
