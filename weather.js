const apiKey = "c8308404d372dac83d64419d50deccee";
const city = "Dedham";
const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;

async function fetchWeather() {
  try {
    const response = await fetch(weatherApiUrl);
    const data = await response.json();

    // Currently have the weather icon commented out because of work computer issues
    // document.getElementById(
    //   "weather-icon"
    // ).src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    document.getElementById(
      "current-temp"
    ).innerText = `Temperature: ${Math.ceil(data.main.temp)}°F`;

    document.getElementById("feels-like").innerText = `Feels like: ${Math.round(
      data.main.feels_like
    )}°F`;

    document.getElementById("high-low-temp").innerText = `High: ${Math.round(
      data.main.temp_max
    )}°F / Low: ${Math.round(data.main.temp_min)}°F`;

    document.getElementById(
      "sky-condition"
    ).innerText = `Conditions: ${data.weather[0].description}`;

    // To approximately convert KMH to MPH, divide by 1.609
    document.getElementById("wind-speed").innerText = `Wind: ${Math.ceil(
      data.wind.speed / 1.609
    )} mph`;
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

fetchWeather();
setInterval(fetchWeather, 60000);
