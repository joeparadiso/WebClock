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
  let timerEndTime = null; // Store the end time globally

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

    // Update the timer countdown if running
    if (timerEndTime) {
      updateCountdown(timerEndTime, today);
    }
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

  /********************************************************************************
   * This method determines the endtime used to setup the countdown timer and
   * sets up the interval for the alarm
   ********************************************************************************/
  function calculate() {
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    if (!date || !time) {
      alert("Please enter a valid date and time.");
      return;
    }
    timerEndTime = new Date(`${date}T${time}:00`);
    clock(); // Immediately update display
  }

  /********************************************************************************
   * This method does the actual calculation of the end time of the countdown
   * timer. The user picks the end time and date from the dropdown menus in the
   * timer section of the WebClock and the time until the user's choice is
   * calculated using the below script.
   ********************************************************************************/
  function updateCountdown(endTime, now) {
    const days = document.getElementById("countdown-days");
    const hours = document.getElementById("countdown-hours");
    const minutes = document.getElementById("countdown-minutes");
    const seconds = document.getElementById("countdown-seconds");

    if (endTime > now) {
      const timeLeft = Math.floor((endTime - now) / 1000);
      days.innerText = String(Math.floor(timeLeft / (24 * 60 * 60))).padStart(2, "0");
      hours.innerText = String(Math.floor((timeLeft / (60 * 60)) % 24)).padStart(2, "0");
      minutes.innerText = String(Math.floor((timeLeft / 60) % 60)).padStart(2, "0");
      seconds.innerText = String(timeLeft % 60).padStart(2, "0");
    } else {
      // Play the alarm sound when timer reaches zero
      alarmSound.play();
      timerEndTime = null;
      // Optionally, set the countdown display to zero
      days.innerText = "00";
      hours.innerText = "00";
      minutes.innerText = "00";
      seconds.innerText = "00";
    }
  }

  /********************************************************************************
   * Method to stop the countdown & alarm sound that plays at the end
   ********************************************************************************/
  function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    timerEndTime = null;
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
