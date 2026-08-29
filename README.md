# WebClock Dashboard

**WebClock** is a customizable, feature-rich digital dashboard designed to run in any modern web browser. It aggregates essential daily information—live clock, weather conditions, astronomical sun data, and MBTA commuter rail schedules—configured for **Dedham, MA**.

It features an advanced theming engine with preset visual styles, dynamic background imagery, interactive color pickers with automatic synchronization, persistent preferences, a dynamic multi-timer system, and a full-featured **Theme Studio**.

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

### 🎨 Theme Studio & Visual Designer
- **Full-Screen Workspace & Collapsible Accordions:** An expansive design environment featuring clean, collapsible section accordions for fast navigation across theme metadata, backgrounds, and color palettes.
- **Interactive Mock Display:** Design new themes against an isolated, non-live mock WebClock dashboard showing real-time updates for clock digits, date, sun times, transit tracker, weather widget, and timer gauges.
- **Live Test Mode:** Minimize the studio into a sleek, floating bottom toolbar (`👁️ Test Live`) to test changes directly on the active WebClock dashboard. Reopen the studio with your in-progress draft preserved, copy the code directly, or keep and import with one click.
- **Local Image Browsing & Instant Preview:** Pick any image file directly from your computer (Desktop, Downloads, etc.) to preview immediately in both the mock display and live test mode. The studio suggests a clean theme name and pre-fills the project path (`images/<filename>`) for seamless export.
- **Precision Color & Opacity Controls:** Fine-grained color pickers paired with opacity range sliders (0–100%) for core theme properties (Clock backgrounds, Timer card backgrounds, Box shadows, Navbar, Text, Inputs, and Timer visual ring).
- **Cohesive Auto-Inheritance:** Button gradients and default timer card backgrounds automatically inherit the theme's two-tone clock gradient for unified aesthetics, with full support for custom timer background overrides.
- **Direct Code Generator:** Instantly copy clean JavaScript snippets with standard unquoted keys formatted for direct pasting into `themes.js`.
- **Theme Library & Management:** Browse all themes with category filters (All, General, Field, Custom), search by name, edit existing themes, clone/duplicate presets, or delete unwanted themes.

### ⏳ Dynamic Multi-Timer System
- **Simultaneous Countdowns:** Run multiple independent meeting or event timers at the same time.
- **Modern Hybrid Card Design:** Compact cards featuring an SVG circular progress ring indicating elapsed percentage alongside large countdown digits and target timestamps (e.g. *"Sprint Planning: Today, 7:51 PM"*).
- **Custom Notes & Overdue Count-Up:** Optional note attached to any timer (e.g. *"Bring updated datasheets"*); when a timer finishes, audio alarm (`alarm.mp3`) triggers and digits switch to counting **UP** until dismissed.
- **Dedicated "Stop Alarm" Button:** When a timer alarm goes off, a prominent glowing button appears in the bottom-right corner of the card allowing you to **silence the alarm sound** while keeping the count-up timer visible.
- **In-Place Editing:** Edit timer labels, notes, dates, or times directly via the **`✎` Edit** button on each card.
- **Popup Creation Modal:** Right-aligned "＋ Create Timer" navbar link opens a modal with custom label, note, date/time pickers, and quick `+15m / +30m / +45m / +1h` presets.
- **Dynamic Shelf & Persistence:** Automatic reflowing shelf; timers persist in `localStorage` across page reloads.

---

## 🚀 How to Use

### 1. Installation

Because this is a static web project, no server installation or build step is required.

1. Download or clone the repository.
2. Ensure you have the `alarm.mp3` file in the root directory for timer audio.
3. Open `index.html` in any modern web browser.

### 2. Navigation & Theming

1. Click the **Hamburger Menu (☰)** in the top-left corner of the navbar to open settings.
2. **Select a Preset:**
   - **General Themes:** Abstract palettes (e.g., _Lava, Thunderstorm, Under The Sea_).
   - **Field Themes:** Nature and seasonal themes (e.g., _Morning Field, Rainy Field, Autumnal Field_).
3. **Launch Theme Studio:** Click **"🎨 Open Theme Studio"** to design custom themes, browse local images, test live changes, and export clean JavaScript code.

### 3. Using the Multi-Timer System

1. Click the **"＋ Create Timer"** link on the right side of the navbar.
2. Enter a **Timer Label / Meeting Name** and optional **Note** (e.g. *"Bring updated datasheets"*).
3. Select the target Date (defaults to today) and Time, or use the **Quick Add** buttons (*+15m, +30m, +45m, +1h*).
4. Click **Start Timer**. A new modern card will appear on the dashboard shelf.
5. Click **`✎`** on any timer card to edit its details, date, or time in place.
6. When the timer finishes, it alerts you with audio and switches to count-up mode. Click **"🔔 Stop Alarm"** in the bottom-right corner to silence the sound, or click **"✕ Dismiss"** to remove the timer.

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
├── index.html          # Semantic HTML layout, Theme Studio modal, and timer markup
├── styles.css          # Core styling, responsive layout geometry, and CSS custom properties
├── clock.js            # Digital clock, date formatting, and dynamic Multi-Timer engine
├── themes.js           # Theme engine definitions, dropdown synchronization, and persistence
├── themeStudio.js      # Full-Screen Theme Studio visual customizer and live test controller
├── weather.js          # OpenWeatherMap API integration and weather widget rendering
├── sunTimes.js         # SunriseSunset.io API integration and astronomical formatting
├── nextTrain.js        # MBTA v3 API integration for real-time commuter rail tracking
├── alarm.mp3           # Audio sound for timer completion
└── images/             # Background images for scenic and seasonal themes
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

