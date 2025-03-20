// Global 'period' var that holds a string rep of the current period of the day
let period = "";

function periodOfDay() {
  var today = new Date();
  var hour = today.getHours();
  var timePeriod = "";

  // Morning: 12:00am - 11:00am
  if (hour >= 0 && hour < 12) {
    timePeriod = "Morning";
    // Afternoon: 12:00pm - 3:00pm
  } else if (hour >= 12 && hour < 16) {
    timePeriod = "Afternoon";
    // Evening: 4:00pm - 6:00pm
  } else if (hour >= 16 && hour < 19) {
    timePeriod = "Evening";
    // Night: 7:00pm - 11:00pm
  } else if (hour >= 19 && hour < 24) {
    timePeriod = "Night";
    // Invalid time format
  } else {
    timePeriod = "invalid hour";
  }

  period = timePeriod;

  // For debugging purposes: print the current period to the webpage inspection log
  // console.log("It's currently: " + period);
}
// Call the period() method to set the global
periodOfDay();
// Call the periodOfDay() method every second
setInterval(periodOfDay, 1000);

//===========================================================================================
//   Weather Functionality Below
//===========================================================================================
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

    document.getElementById("feels-like").innerText = `Feels Like: ${Math.round(
      data.main.feels_like
    )}°F`;

    // 3 hour high and low temps in deg F
    var high = Math.round(data.main.temp_max);
    var low = Math.round(data.main.temp_min);

    document.getElementById(
      "high-low-temp"
    ).innerHTML = `${period}&nbspTemps:<br>${high}°F&nbsp;/&nbsp;${low}°F`;

    document.getElementById(
      "sky-condition"
    ).innerText = `Conditions: ${data.weather[0].description}`;

    // To approximately convert KMH to MPH, divide by 1.609
    document.getElementById("wind-speed").innerHTML = `Wind:\n${Math.ceil(
      data.wind.speed / 1.609
    )}&nbsp;mph`;
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

fetchWeather();
setInterval(fetchWeather, 60000);
