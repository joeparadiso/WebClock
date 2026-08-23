/********************************************************************************
 * sunTimes.js -- March 2025 -- Joe Paradiso (Refactored & Optimized)
 * DETAILS:
 *  Fetches astronomical data (sunrise and sunset) for Dedham, MA from the
 *  sunrisesunset.io API using UNIX timestamps, formats the times to 12-hour
 *  HH:MM display, and updates the dashboard.
 ********************************************************************************/

(function () {
  // Coordinates for Dedham, MA
  const LATITUDE = 42.228205;
  const LONGITUDE = -71.174505;
  const SUN_API_URL = `https://api.sunrisesunset.io/json?lat=${LATITUDE}&lng=${LONGITUDE}&time_format=unix`;

  /********************************************************************************
   * Converts a UNIX timestamp into a 12-hour "HH:MM" padded string
   * @param {number} unixTimestamp - Sunrise or sunset timestamp in seconds
   * @returns {string} Formatted 12-hour time (e.g., "06:45")
   ********************************************************************************/
  function formatUnixTo12Hr(unixTimestamp) {
    if (!unixTimestamp) return "--:--";
    const date = new Date(unixTimestamp * 1000);
    const hours = date.getHours() % 12 || 12;
    const hoursStr = String(hours).padStart(2, "0");
    const minutesStr = String(date.getMinutes()).padStart(2, "0");
    return `${hoursStr}:${minutesStr}`;
  }

  /********************************************************************************
   * Fetches sunrise/sunset data and updates the corresponding DOM elements
   ********************************************************************************/
  async function fetchSunTimes() {
    const sunriseEl = document.getElementById("sunrise");
    const sunsetEl = document.getElementById("sunset");

    try {
      const response = await fetch(SUN_API_URL);
      if (!response.ok) {
        throw new Error(`Sun API returned status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.results) {
        if (sunriseEl) sunriseEl.textContent = formatUnixTo12Hr(data.results.sunrise);
        if (sunsetEl) sunsetEl.textContent = formatUnixTo12Hr(data.results.sunset);
      }
    } catch (error) {
      console.error("Error fetching sun times:", error);
      if (sunriseEl && sunriseEl.textContent === "--:--") sunriseEl.textContent = "N/A";
      if (sunsetEl && sunsetEl.textContent === "--:--") sunsetEl.textContent = "N/A";
    }
  }

  // Initialize on DOM ready, then refresh hourly
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      fetchSunTimes();
      setInterval(fetchSunTimes, 3600000);
    });
  } else {
    fetchSunTimes();
    setInterval(fetchSunTimes, 3600000);
  }
})();

