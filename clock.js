/********************************************************************************
 * clock.js -- March 2025 -- Joe Paradiso
 * DETAILS:
 *  This script provides the functionality to the clock skeleton in the HTML file.
 *  The details needed for the time and date are retrieved from the Date object.
 *  Next, the script formats (to my spec) and updates the HTML elements to display
 *  the current date and time.
 * NOTE:
 *  There's a flaw with this code that needs to be updated. The user can change
 *  the time/date for the countdown timer while it's still running and it causes
 *  the countdown timer to malfunction/not function as expected. Currently, I am
 *  pressing the reset button before choosing a new time/date for the countdown.
 *  However, this should be addressed if this ever becomes a real website.
 ********************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  /********************************************************************************
   * This method gets the current date details from the Date() and updates the
   * corresponding date and time HTML elements with the current values.
   ********************************************************************************/
  function clock() {
    // Get the current date details from the system clock
    var today = new Date();

    // array of day names to correspond to Date() index
    var dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // array of month names to correspond to Date() index
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Update the elements in the HTML with the date values
    document.getElementById("Date").innerHTML =
      dayNames[today.getDay()] +
      ", " +
      monthNames[today.getMonth()] +
      " " +
      today.getDate() +
      ", " +
      today.getFullYear();

    // Get the current hour of the day. Format to 12hr time.
    var h = today.getHours() % 12 || 12;
    var m = today.getMinutes();
    var s = today.getSeconds();

    // Pad the time with leading zeros if less than '10'
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    // Update the elements in the HTML with the time values
    document.getElementById("hours").innerHTML = h;
    document.getElementById("minutes").innerHTML = m;
    document.getElementById("seconds").innerHTML = s;
  }
  // Call the 'clock' method every second to update the clock every second by
  setInterval(clock, 1000);

  // TIMER FUNCTIONALITY: Set event listeners to call the methods to update the
  //  timer depending on which button was pressed
  document.getElementById("calculate").addEventListener("click", calculate);
  document.getElementById("reset").addEventListener("click", reset);
  document.getElementById("stop").addEventListener("click", stopAlarm);

  // The alarm sound is from freesound.org
  const alarmSound = new Audio("alarm.mp3");
  alarmSound.loop = true;
  let interval;

  /********************************************************************************
   * This method determines the endtime used to setup the countdown timer and
   * sets up the interval for the alarm
   ********************************************************************************/
  function calculate() {
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const endTime = new Date(`${date}T${time}:00`);

    if (!date || !time) {
      alert("Please enter a valid date and time.");
      return;
    }

    interval = setInterval(() => {
      if (!calculateTime(endTime)) {
        clearInterval(interval);
        alarmSound.play();
      }
    }, 1000);
  }

  /********************************************************************************
   * This method does the actual calculation of the end time of the countdown
   * timer. The user picks the end time and date from the dropdown menus in the
   * timer section of the WebClock and the time until the user's choice is
   * calculated using the below script.
   ********************************************************************************/
  function calculateTime(endTime) {
    const currentTime = new Date();
    const days = document.getElementById("countdown-days");
    const hours = document.getElementById("countdown-hours");
    const minutes = document.getElementById("countdown-minutes");
    const seconds = document.getElementById("countdown-seconds");

    // If the user's time is in the future, calculate the time until then. Each
    // part of the display is two digits by default. If the actual time/days is
    // less than 10 in any element, it's padded with leading zeros.
    if (endTime > currentTime) {
      const timeLeft = (endTime - currentTime) / 1000;

      days.innerText = String(Math.floor(timeLeft / (24 * 60 * 60))).padStart(
        2,
        "0"
      );
      hours.innerText = String(
        Math.floor((timeLeft / (60 * 60)) % 24)
      ).padStart(2, "0");
      minutes.innerText = String(Math.floor((timeLeft / 60) % 60)).padStart(
        2,
        "0"
      );
      seconds.innerText = String(Math.floor(timeLeft % 60)).padStart(2, "0");

      return true;
    } else {
      stopAlarm();
      return false;
    }
  }

  /********************************************************************************
   * Method to stop the countdown & alarm sound that plays at the end
   ********************************************************************************/
  function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    clearInterval(interval);
  }

  /********************************************************************************
   * Method to stop the countdown timer. This clears all visible digits as well.
   ********************************************************************************/
  function reset() {
    stopAlarm();
    document.getElementById("countdown-days").innerText = "--";
    document.getElementById("countdown-hours").innerText = "--";
    document.getElementById("countdown-minutes").innerText = "--";
    document.getElementById("countdown-seconds").innerText = "--";
  }
});
