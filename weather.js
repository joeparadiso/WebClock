/********************************************************************************
 * weather.js -- March 2025 -- Joe Paradiso
 * DETAILS:
 *  This script uses the openweather.com API to get the local weather details
 *  and display them in the WebClock's weather-widget: Current temp, 'feels like',
 *  a three hour temp forecast, sky conditions, and wind speed. For the short term
 *  forecast, This script gets the current hour of the day and determines the
 *  current period of the day (Morning, Afternoon, Evening, or Night). Then the
 *  script updates the WebClock weather-widget section with the short term forecast
 *  to display the period of day that the short term forecast refers to.
 ********************************************************************************/

// Global 'period' var that holds a string rep of the current period of the day
let period = "";

/********************************************************************************
 * This method uses the time of day to determine the current 'period' of the day:
 * Morning, Afternoon, Evening, and Night. This 'period' is displayed in the
 * clock's weather widget (high-low-temp) to display the short term temperatures.
 ********************************************************************************/
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
  // set the global var 'period' to the current determined period
  period = timePeriod;

  // For debugging purposes: print the current period to the webpage inspection log
  // console.log("It's currently: " + period);
}
// Call the period() method to set the global
periodOfDay();
// Call the periodOfDay() method every second
setInterval(periodOfDay, 1000);

// API setup variables for the weather details used in the weather-widget of the WebClock
const apiKey = "c8308404d372dac83d64419d50deccee";
const city = "Dedham";
const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;

/********************************************************************************
 * This method makes the call to the API and stores the weather results in a
 * JSON document called 'data'. Next, various elements in the HTML are updated
 * by the script to display the various weather details from the API results.
 ********************************************************************************/
async function fetchWeather() {
  try {
    const response = await fetch(weatherApiUrl);
    const data = await response.json();

    // Currently have the weather icon commented out because of work computer issues
    // document.getElementById(
    //   "weather-icon"
    // ).src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    // Set the current temp in the weather widget
    document.getElementById(
      "current-temp"
    ).innerText = `Temperature: ${Math.ceil(data.main.temp)}°F`;

    // Set what the current temp 'feels like' in the weather widget
    document.getElementById("feels-like").innerText = `Feels Like: ${Math.round(
      data.main.feels_like
    )}°F`;

    // The free API only provides the hi/lo temps for the next 3 hours
    var high = Math.round(data.main.temp_max);
    var low = Math.round(data.main.temp_min);

    // Set the high and low temps for the next three hours in the weather widget
    document.getElementById(
      "high-low-temp"
    ).innerHTML = `${period}&nbspTemps:<br>${high}°F&nbsp;/&nbsp;${low}°F`;

    // Set the current visible sky conditions in the weather widget
    document.getElementById(
      "sky-condition"
    ).innerText = `Conditions: ${data.weather[0].description}`;

    // Set the current wind speed in the weather widget
    // (To approximately convert KMH to MPH, divide by 1.609)
    document.getElementById("wind-speed").innerHTML = `Wind:\n${Math.ceil(
      data.wind.speed / 1.609
    )}&nbsp;mph`;
    // catch any errors and display them in the console
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}
// Call the method every 60 seconds so details are updated by the minute
fetchWeather();
setInterval(fetchWeather, 60000);
