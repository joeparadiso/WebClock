/********************************************************************************
 * weather.js -- March 2025 -- Joe Paradiso (Refactored & Optimized)
 * DETAILS:
 *  Fetches current weather data from OpenWeatherMap API for Dedham, MA and
 *  updates the weather widget with temperature, feels-like temp, sky conditions,
 *  and wind speed.
 ********************************************************************************/

(function () {
  const API_KEY = "c8308404d372dac83d64419d50deccee";
  const CITY = "Dedham";
  const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=imperial&appid=${API_KEY}`;

  /********************************************************************************
   * Determines the current period of the day based on the hour
   ********************************************************************************/
  function getPeriodOfDay() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 16) return "Afternoon";
    if (hour >= 16 && hour < 19) return "Evening";
    return "Night";
  }

  /********************************************************************************
   * Fetches weather data and updates the widget elements
   ********************************************************************************/
  async function fetchWeather() {
    const tempEl = document.getElementById("current-temp");
    const feelsEl = document.getElementById("feels-like");
    const highLowEl = document.getElementById("high-low-temp");
    const skyEl = document.getElementById("sky-condition");
    const windEl = document.getElementById("wind-speed");

    try {
      const response = await fetch(WEATHER_API_URL);
      if (!response.ok) {
        throw new Error(`Weather API returned status ${response.status}`);
      }

      const data = await response.json();
      const period = getPeriodOfDay();

      if (tempEl && data.main && typeof data.main.temp !== "undefined") {
        tempEl.innerHTML = `<span class="weather-label">Temperature:</span><br>${Math.round(data.main.temp)}°F`;
      }

      if (feelsEl && data.main && typeof data.main.feels_like !== "undefined") {
        feelsEl.innerHTML = `<span class="weather-label">Feels Like:</span><br>${Math.round(data.main.feels_like)}°F`;
      }

      if (highLowEl && data.main) {
        const high = Math.round(data.main.temp_max);
        const low = Math.round(data.main.temp_min);
        highLowEl.innerHTML = `<span class="weather-label">${period}&nbsp;Temps:</span><br>${high}°F&nbsp;/&nbsp;${low}°F`;
      }

      if (skyEl && data.weather && data.weather[0]) {
        const description = data.weather[0].description;
        const capitalizedDesc = description.charAt(0).toUpperCase() + description.slice(1);
        skyEl.innerHTML = `<span class="weather-label">Conditions:</span><br>${capitalizedDesc}`;
      }

      if (windEl && data.wind && typeof data.wind.speed !== "undefined") {
        // With units=imperial, speed is already returned in mph
        windEl.innerHTML = `<span class="weather-label">Wind:</span><br>${Math.round(data.wind.speed)}&nbsp;mph`;
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      if (tempEl) tempEl.innerHTML = `<span class="weather-label">Weather:</span><br>Unavailable`;
    }
  }

  // Initialize weather on DOM ready, then refresh every 60 seconds
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      fetchWeather();
      setInterval(fetchWeather, 60000);
    });
  } else {
    fetchWeather();
    setInterval(fetchWeather, 60000);
  }
})();

