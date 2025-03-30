/********************************************************************************
 * sunTimes.js -- March 2025 -- Joe Paradiso
 * DETAILS:
 *  This script uses the sunrisesunset.io API to get the sunrise and sunset times
 *  for Dedham, MA. The script uses the UNIX time option in the API call and
 *  converts the time to an HH:MM format instead of the default HH:MM:SS XM format
 *  This script updates the HTML elements in the WebClock with the sunrise and
 *  sunset times for the current day.
 ********************************************************************************/

// Coordinates for Dedham, MA
const latitude = 42.228205;
const longitude = -71.174505;

// The default time style is 12 hr in the API call. Options are 24hr, military, and UNIX
// const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`;

// I'm using UNIX time format because I want to custom format the time results (w/o seconds and am/pm)
const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&time_format=unix`;

/********************************************************************************
 * This method makes the API call using the above url and stores the response in a
 * JSON document called data. Next, the html elements are updated by the script
 * to display the sunrise/sunset times that are custom formatted using the method
 * convertTime(). NOTE: If you use this on an actual website, you must list the
 * API website somewhere to give proper credit for the source of the times...
 ********************************************************************************/
async function fetchSun() {
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Set the div with the ID 'sunrise' with the sunrise time text
    document.getElementById("sunrise").innerText = convertTime(
      data.results.sunrise
    );

    // Set the div with the ID 'sunset' with the sunset time text
    document.getElementById("sunset").innerText = convertTime(
      data.results.sunset
    );

    // Set the div with the ID 'data' to display all JSON contents
    // document.getElementById("data").innerText = JSON.stringify(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}
// Run this script every hour to refresh
fetchSun();
setInterval(fetchSun, 3600000);

/********************************************************************************
 * This method will take in the current sunrise time in UNIX format and convert it
 * to a HH:MM format that includes prefix '0's if necessary
 * @param {*} current_time - This is the API's returned sunrise or sunset time
 * for the day in UNIX format
 * @returns - string with the sunrise/sunset time in an HH:MM format
 ********************************************************************************/
function convertTime(current_time) {
  // const current_time = 1679852400; // Example Unix timestamp (seconds since epoch)

  // Convert the Unix timestamp to milliseconds (JavaScript Date works with ms)
  const date = new Date(current_time * 1000);

  // Extract and convert the hours from 24 hr style time into 12 hr time:
  let hours = date.getHours() % 12;

  // Convert the hours number to a padded string to display in the UI
  hours = hours.toString().padStart(2, "0");

  // Extract and convert the minutes to a padded string to display in the UI
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Combine hours and minutes into HH:MM format
  const timeString = `${hours}:${minutes}`;

  return timeString;
}
