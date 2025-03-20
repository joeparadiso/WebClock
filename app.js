document.addEventListener("DOMContentLoaded", function () {
  // Hamburger Menu Toggle
  const menuToggle = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");

  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("nav-active");
  });

  // // CLOCK FUNCTION
  // function clock() {
  //   var today = new Date();
  //   var dayNames = [
  //     "Sunday",
  //     "Monday",
  //     "Tuesday",
  //     "Wednesday",
  //     "Thursday",
  //     "Friday",
  //     "Saturday",
  //   ];

  //   var monthNames = [
  //     "January",
  //     "February",
  //     "March",
  //     "April",
  //     "May",
  //     "June",
  //     "July",
  //     "August",
  //     "September",
  //     "October",
  //     "November",
  //     "December",
  //   ];

  //   document.getElementById("Date").innerHTML =
  //     dayNames[today.getDay()] +
  //     ", " +
  //     monthNames[today.getMonth()] +
  //     " " +
  //     today.getDate() +
  //     ", " +
  //     today.getFullYear();

  //   var h = today.getHours() % 12 || 12;
  //   var m = today.getMinutes();
  //   var s = today.getSeconds();

  //   h = h < 10 ? "0" + h : h;
  //   m = m < 10 ? "0" + m : m;
  //   s = s < 10 ? "0" + s : s;

  //   document.getElementById("hours").innerHTML = h;
  //   document.getElementById("minutes").innerHTML = m;
  //   document.getElementById("seconds").innerHTML = s;
  // }

  // setInterval(clock, 1000);

  // // TIMER FUNCTIONALITY
  // document.getElementById("calculate").addEventListener("click", calculate);
  // document.getElementById("reset").addEventListener("click", reset);
  // document.getElementById("stop").addEventListener("click", stopAlarm);

  // const alarmSound = new Audio("alarm.mp3");
  // alarmSound.loop = true;
  // let interval;

  // function calculate() {
  //   const date = document.getElementById("date").value;
  //   const time = document.getElementById("time").value;
  //   const endTime = new Date(`${date}T${time}:00`);

  //   if (!date || !time) {
  //     alert("Please enter a valid date and time.");
  //     return;
  //   }

  //   interval = setInterval(() => {
  //     if (!calculateTime(endTime)) {
  //       clearInterval(interval);
  //       alarmSound.play();
  //     }
  //   }, 1000);
  // }

  // function calculateTime(endTime) {
  //   const currentTime = new Date();
  //   const days = document.getElementById("countdown-days");
  //   const hours = document.getElementById("countdown-hours");
  //   const minutes = document.getElementById("countdown-minutes");
  //   const seconds = document.getElementById("countdown-seconds");

  //   if (endTime > currentTime) {
  //     const timeLeft = (endTime - currentTime) / 1000;

  //     days.innerText = String(Math.floor(timeLeft / (24 * 60 * 60))).padStart(
  //       2,
  //       "0"
  //     );
  //     hours.innerText = String(
  //       Math.floor((timeLeft / (60 * 60)) % 24)
  //     ).padStart(2, "0");
  //     minutes.innerText = String(Math.floor((timeLeft / 60) % 60)).padStart(
  //       2,
  //       "0"
  //     );
  //     seconds.innerText = String(Math.floor(timeLeft % 60)).padStart(2, "0");

  //     return true;
  //   } else {
  //     stopAlarm();
  //     return false;
  //   }
  // }

  // function stopAlarm() {
  //   alarmSound.pause();
  //   alarmSound.currentTime = 0;
  //   clearInterval(interval);
  // }

  // function reset() {
  //   stopAlarm();
  //   document.getElementById("countdown-days").innerText = "--";
  //   document.getElementById("countdown-hours").innerText = "--";
  //   document.getElementById("countdown-minutes").innerText = "--";
  //   document.getElementById("countdown-seconds").innerText = "--";
  // }

  // Theme Selection
  const themes = {
    default: {
      shadow: "#F8E3AF",
      clockbg1: "#2D4067",
      clockbg2: "#0D0B41",
      timerbg1: "#08001f",
      timerbg2: "#1c52b8",
      buttonbg1: "#08001f",
      buttonbg2: "#062963",
      pagebg1: "#08001f",
      pagebg2: "#30197d",
      navbar: "#000000e6",
      text: "#DCC48F",
      input: "#DCC48F",
    },
    lava: {
      shadow: "#F99B4E",
      clockbg1: "#223138",
      clockbg2: "#586566",
      timerbg1: "#4C595E",
      timerbg2: "#1C221E",
      buttonbg1: "#814108",
      buttonbg2: "#071113",
      pagebg1: "#08001f",
      pagebg2: "#30197d",
      navbar: "#000000e6",
      text: "#e6740a",
      input: "#F3B268",
    },
    dark: {
      shadow: "#ADADAD",
      clockbg1: "#192327",
      clockbg2: "#535E66",
      timerbg1: "#566f81",
      timerbg2: "#3d474d",
      buttonbg1: "#232d33",
      buttonbg2: "#6a737c",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "#333537",
      text: "#D1D1D1",
      input: "#96a5b0",
    },
    light: {
      shadow: "#FFFFFF",
      clockbg1: "#0049a3",
      clockbg2: "#89a2c2",
      timerbg1: "#0049a3",
      timerbg2: "#668cbf",
      buttonbg1: "#0254ac",
      buttonbg2: "#b9c1cb",
      pagebg1: "#000000",
      pagebg2: "#000000",
      navbar: "#1f5ea2",
      text: "#FFFFFF",
      input: "#91b6d9",
    },
    // morning: {
    //   shadow: "#FB8728",
    //   // clockbg1: "#342e94",
    //   clockbg1: "rgba(52,46,148,.8)",
    //   // clockbg2: "#F28226",
    //   clockbg2: "rgba(242,130,38,.7)",
    //   timerbg1: "#cda89d",
    //   timerbg2: "#814e38",
    //   buttonbg1: "#6d8000",
    //   buttonbg2: "#cba293",
    //   pagebg1: "#593BA0",
    //   pagebg2: "#673104",
    //   navbar: "#464a6d",
    //   text: "#fee981",
    //   input: "#dc8f50",
    // },
    morning: {
      shadow: "#c88437",
      clockbg1: "rgba(65,108,100,.8)",
      clockbg2: "rgba(242,130,38,.8)",
      timerbg1: "rgba(201,135,44,.9)",
      timerbg2: "rgba(39,73,98,.9)",
      buttonbg1: "rgba(209,126,31,.9)",
      buttonbg2: "rgba(21, 98, 121, 0.9)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#464a6d",
      text: "#fee981",
      input: "rgba(220,143,80,.6)",
    },
    sunset: {
      shadow: "#FB8728",
      clockbg1: "#590193",
      clockbg2: "#F28226",
      timerbg1: "#ec572e",
      timerbg2: "#5840d4",
      buttonbg1: "#0300CC",
      buttonbg2: "#A75858",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#9A4F42",
      text: "#FFFFFF",
      input: "#E9A5A5",
    },
    forest: {
      shadow: "#d2d5a9",
      // clockbg1: "#273313",
      clockbg1: "rgba(39,51,19,.8)",
      // clockbg2: "#62aa38",
      clockbg2: "rgba(98,170,56,.8)",
      timerbg1: "#56803a",
      timerbg2: "#1b4e07",
      buttonbg1: "#445343",
      buttonbg2: "#536443",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#000000",
      text: "#c5dadb",
      input: "#7ba84e",
    },
    ocean: {
      shadow: "#39a0b1",
      clockbg1: "rgba(70,164,156,.8)",
      clockbg2: "rgba(18,68,97,.8)",
      timerbg1: "#0f384b",
      timerbg2: "#46b188",
      buttonbg1: "#359c7b",
      buttonbg2: "#0a2d41",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#296551",
      text: "#ffc766",
      input: "rgba(244,179,97,.8)",
    },
  };

  document
    .getElementById("themeSelector")
    .addEventListener("change", function () {
      let theme = themes[this.value];
      if (theme) {
        document.documentElement.style.setProperty(
          "--box-shadow-color",
          theme.shadow
        );
        document.documentElement.style.setProperty(
          "--clock-bg1",
          theme.clockbg1
        );
        document.documentElement.style.setProperty(
          "--clock-bg2",
          theme.clockbg2
        );
        document.documentElement.style.setProperty(
          "--timer-bg1",
          theme.timerbg1
        );
        document.documentElement.style.setProperty(
          "--timer-bg2",
          theme.timerbg2
        );
        document.documentElement.style.setProperty(
          "--button-bg1",
          theme.buttonbg1
        );
        document.documentElement.style.setProperty(
          "--button-bg2",
          theme.buttonbg2
        );
        document.documentElement.style.setProperty("--page-bg1", theme.pagebg1);
        document.documentElement.style.setProperty("--page-bg2", theme.pagebg2);
        document.documentElement.style.setProperty("--navbar-bg", theme.navbar);
        document.documentElement.style.setProperty("--text-color", theme.text);
        document.documentElement.style.setProperty(
          "--input-box-color",
          theme.input
        );
      }
    });

  // COLOR CUSTOMIZATION FUNCTIONALITY
  function updateCSSVariable(variable, value) {
    document.documentElement.style.setProperty(variable, value);
  }

  document.getElementById("shadowColor").addEventListener("input", function () {
    updateCSSVariable("--box-shadow-color", this.value);
  });

  document.getElementById("clockBg1").addEventListener("input", function () {
    updateCSSVariable("--clock-bg1", this.value);
  });

  document.getElementById("clockBg2").addEventListener("input", function () {
    updateCSSVariable("--clock-bg2", this.value);
  });

  document.getElementById("timerBg1").addEventListener("input", function () {
    updateCSSVariable("--timer-bg1", this.value);
  });

  document.getElementById("timerBg2").addEventListener("input", function () {
    updateCSSVariable("--timer-bg2", this.value);
  });

  document.getElementById("buttonBg1").addEventListener("input", function () {
    updateCSSVariable("--button-bg1", this.value);
  });

  document.getElementById("buttonBg2").addEventListener("input", function () {
    updateCSSVariable("--button-bg2", this.value);
  });

  document.getElementById("pageBg1").addEventListener("input", function () {
    updateCSSVariable("--page-bg1", this.value);
  });

  document.getElementById("pageBg2").addEventListener("input", function () {
    updateCSSVariable("--page-bg2", this.value);
  });

  document.getElementById("textColor").addEventListener("input", function () {
    updateCSSVariable("--text-color", this.value);
  });

  document.getElementById("textColor").addEventListener("input", function () {
    updateCSSVariable("--text-color", this.value);
  });

  document
    .getElementById("inputBoxColor")
    .addEventListener("input", function () {
      updateCSSVariable("--input-box-color", this.value);
    });

  document.getElementById("navbarColor").addEventListener("input", function () {
    updateCSSVariable("--navbar-bg", this.value);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const themes = {
    default: {
      backgroundImage:
        "url('https://images.rawpixel.com/image_800/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcm00NzItMjBhLmpwZw.jpg')",
    },
    lava: {
      backgroundImage:
        "url('https://static.vecteezy.com/system/resources/thumbnails/045/698/869/small_2x/black-marble-texture-with-gold-veins-luxurious-surface-design-photo.jpg')",
    },
    dark: {
      backgroundImage:
        "url('https://media.istockphoto.com/id/106529026/photo/threatening-dark-clouds-covering-the-sky.jpg?s=612x612&w=0&k=20&c=XOSnMeZbKOW541FgTISJkDVvFK_bVHyTvusmAk9jjAs=')",
    },
    light: {
      // backgroundImage: "url('https://www.freeimageslive.com/galleries/nature/weather/pics/sunny_clouds_8092612.jpg')",
      backgroundImage:
        "url('https://burst.shopifycdn.com/photos/bright-blue-sky-dotted-with-fluffy-white-clouds.jpg?exif=0&iptc=0')",
    },
    morning: {
      // backgroundImage:
      //   "url('https://live.staticflickr.com/7915/32413680647_bfa12df896_b.jpg')",
      backgroundImage:
        "url('https://img.freepik.com/premium-photo/sunrise-road-summer-sunny-highway-journey-landscape-way-sunlight-horizon-copy-space_162695-14253.jpg')",
    },
    sunset: {
      backgroundImage:
        "url('https://t4.ftcdn.net/jpg/01/04/78/75/360_F_104787586_63vz1PkylLEfSfZ08dqTnqJqlqdq0eXx.jpg')",
    },
    ocean: {
      backgroundImage:
        "url('https://c1.wallpaperflare.com/preview/874/981/117/ocean-life-under-water-colorful-fish.jpg')",
    },
    forest: {
      backgroundImage: "url('https://images4.alphacoders.com/105/105806.jpg')",
    },
    pastel: {
      backgroundImage: "url('https://example.com/pastel.jpg')",
    },
    neon: {
      backgroundImage: "url('https://example.com/neon.jpg')",
    },
    cyberpunk: {
      backgroundImage: "url('https://example.com/cyberpunk.jpg')",
    },
    autumn: {
      backgroundImage: "url('https://example.com/autumn.jpg')",
    },
  };

  document
    .getElementById("themeSelector")
    .addEventListener("change", function () {
      let theme = themes[this.value];
      if (theme) {
        document.body.style.background = theme.backgroundImage;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
      }
    });
});

//------------------------
function updateCSSVariable(variable, value) {
  document.documentElement.style.setProperty(variable, value);
  document.body.style.background = `linear-gradient(45deg, var(--page-bg1), var(--page-bg2))`;
}

document.getElementById("pageBg1").addEventListener("input", function () {
  updateCSSVariable("--page-bg1", this.value);
});

document.getElementById("pageBg2").addEventListener("input", function () {
  updateCSSVariable("--page-bg2", this.value);
});
//----------------------

// const apiKey = "c8308404d372dac83d64419d50deccee";
// const city = "Dedham";
// const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`;

// async function fetchWeather() {
//   try {
//     const response = await fetch(weatherApiUrl);
//     const data = await response.json();

//     // Currently have the weather icon commented out because of work computer issues
//     // document.getElementById(
//     //   "weather-icon"
//     // ).src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

//     document.getElementById(
//       "current-temp"
//     ).innerText = `Temperature: ${Math.ceil(data.main.temp)}°F`;

//     document.getElementById("feels-like").innerText = `Feels like: ${Math.round(
//       data.main.feels_like
//     )}°F`;

//     document.getElementById("high-low-temp").innerText = `High: ${Math.round(
//       data.main.temp_max
//     )}°F / Low: ${Math.round(data.main.temp_min)}°F`;

//     document.getElementById(
//       "sky-condition"
//     ).innerText = `Conditions: ${data.weather[0].description}`;

//     // To approximately convert KMH to MPH, divide by 1.609
//     document.getElementById("wind-speed").innerText = `Wind: ${Math.ceil(
//       data.wind.speed / 1.609
//     )} mph`;
//   } catch (error) {
//     console.error("Error fetching weather data:", error);
//   }
// }

// fetchWeather();
// setInterval(fetchWeather, 60000);
