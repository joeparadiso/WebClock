/********************************************************************************
 * clock.js -- March 2025 -- Joe Paradiso (Refactored & Optimized)
 * DETAILS:
 *  Retrieves system time, formats date and 12-hour clock (with leading zeros),
 *  and manages the countdown timer with audio alarm functionality.
 ********************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  let timerEndTime = null;

  // Cached DOM elements
  const dateEl = document.getElementById("Date");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");
  const countdownDays = document.getElementById("countdown-days");
  const countdownHours = document.getElementById("countdown-hours");
  const countdownMinutes = document.getElementById("countdown-minutes");
  const countdownSeconds = document.getElementById("countdown-seconds");
  const inputDate = document.getElementById("date");
  const inputTime = document.getElementById("time");

  // Constant lookup arrays (defined once, not reallocated every second)
  const DAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Alarm sound setup
  const alarmSound = new Audio("alarm.mp3");
  alarmSound.loop = true;

  /********************************************************************************
   * Updates the clock display and advances countdown timer if active
   ********************************************************************************/
  function updateClock() {
    const now = new Date();

    // Update Date text (e.g. "Sunday, March 23, 2025")
    if (dateEl) {
      dateEl.textContent = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }

    // Format 12-hour time with leading zeros
    const rawHours = now.getHours() % 12 || 12;
    const hours = String(rawHours).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
    if (secondsEl) secondsEl.textContent = seconds;

    // Update countdown timer if currently active
    if (timerEndTime) {
      updateCountdown(timerEndTime, now);
    }
  }

  /********************************************************************************
   * Calculates remaining time for the countdown and triggers alarm when complete
   ********************************************************************************/
  function updateCountdown(endTime, now) {
    if (!countdownDays || !countdownHours || !countdownMinutes || !countdownSeconds) return;

    if (endTime > now) {
      const timeLeft = Math.floor((endTime - now) / 1000);
      countdownDays.textContent = String(Math.floor(timeLeft / 86400)).padStart(2, "0");
      countdownHours.textContent = String(Math.floor((timeLeft / 3600) % 24)).padStart(2, "0");
      countdownMinutes.textContent = String(Math.floor((timeLeft / 60) % 60)).padStart(2, "0");
      countdownSeconds.textContent = String(timeLeft % 60).padStart(2, "0");
    } else {
      // Countdown complete: reset timer state, display zeroes, and trigger alarm
      timerEndTime = null;
      countdownDays.textContent = "00";
      countdownHours.textContent = "00";
      countdownMinutes.textContent = "00";
      countdownSeconds.textContent = "00";

      alarmSound.play().catch(function (err) {
        console.warn("Audio playback was prevented by browser policy:", err);
      });
    }
  }

  /********************************************************************************
   * Validates inputs, resets previous alarms, and begins countdown
   ********************************************************************************/
  function startTimer() {
    const dateVal = inputDate ? inputDate.value : "";
    const timeVal = inputTime ? inputTime.value : "";

    if (!dateVal || !timeVal) {
      alert("Please enter both a date and time for the countdown.");
      return;
    }

    const targetDate = new Date(`${dateVal}T${timeVal}:00`);
    const now = new Date();

    if (isNaN(targetDate.getTime())) {
      alert("Invalid date or time entered. Please try again.");
      return;
    }

    if (targetDate <= now) {
      alert("Please choose a future date and time.");
      return;
    }

    // Stop any existing ringing alarm and set new target
    stopAlarm();
    timerEndTime = targetDate;
    updateClock(); // Immediately update countdown numbers without waiting 1s
  }

  /********************************************************************************
   * Stops and resets the alarm sound
   ********************************************************************************/
  function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
  }

  /********************************************************************************
   * Resets the countdown timer, silences alarm, and clears display values
   ********************************************************************************/
  function resetTimer() {
    stopAlarm();
    timerEndTime = null;
    if (countdownDays) countdownDays.textContent = "--";
    if (countdownHours) countdownHours.textContent = "--";
    if (countdownMinutes) countdownMinutes.textContent = "--";
    if (countdownSeconds) countdownSeconds.textContent = "--";
  }

  // Attach button event listeners
  const startBtn = document.getElementById("calculate");
  const resetBtn = document.getElementById("reset");

  if (startBtn) startBtn.addEventListener("click", startTimer);
  if (resetBtn) resetBtn.addEventListener("click", resetTimer);

  // Initialize clock immediately on page load, then update every second
  updateClock();
  setInterval(updateClock, 1000);
});

