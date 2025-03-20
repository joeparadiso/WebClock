document.addEventListener("DOMContentLoaded", function () {
  function clock() {
    var today = new Date();
    var dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

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

    document.getElementById("Date").innerHTML =
      dayNames[today.getDay()] +
      ", " +
      monthNames[today.getMonth()] +
      " " +
      today.getDate() +
      ", " +
      today.getFullYear();

    var h = today.getHours() % 12 || 12;
    var m = today.getMinutes();
    var s = today.getSeconds();

    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    document.getElementById("hours").innerHTML = h;
    document.getElementById("minutes").innerHTML = m;
    document.getElementById("seconds").innerHTML = s;
  }

  setInterval(clock, 1000);

  // TIMER FUNCTIONALITY
  document.getElementById("calculate").addEventListener("click", calculate);
  document.getElementById("reset").addEventListener("click", reset);
  document.getElementById("stop").addEventListener("click", stopAlarm);

  const alarmSound = new Audio("alarm.mp3");
  alarmSound.loop = true;
  let interval;

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

  function calculateTime(endTime) {
    const currentTime = new Date();
    const days = document.getElementById("countdown-days");
    const hours = document.getElementById("countdown-hours");
    const minutes = document.getElementById("countdown-minutes");
    const seconds = document.getElementById("countdown-seconds");

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

  function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    clearInterval(interval);
  }

  function reset() {
    stopAlarm();
    document.getElementById("countdown-days").innerText = "--";
    document.getElementById("countdown-hours").innerText = "--";
    document.getElementById("countdown-minutes").innerText = "--";
    document.getElementById("countdown-seconds").innerText = "--";
  }
});
