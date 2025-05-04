/********************************************************************************
 * themes.js -- March 2025 -- Joe Paradiso
 * DETAILS:
 *  This script defines the details of the themes available in the navbar menu.
 *  There are pre-determined themes that the user can choose from a dropdown menu
 *  and there are options for changing nearly every visible element displayed in
 *  the WebClock. This script is responsible for managing and updating the themes
 *  and colors of this WebClock.
 ********************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  // Hamburger Menu Toggle
  const menuToggle = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");

  // Toggles the navbar menu between active/inactive when clicked
  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("nav-active");
  });

  /********************************************************************************
   * The 'themes' define the colors for each visible element in the WebClock. They
   * are chosen to match the backgound images of each theme.
   ********************************************************************************/
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
    "Thunderstorm": {
      shadow: "#ADADAD",
      clockbg1: "rgba(25, 35, 39, .7)",
      clockbg2: "rgba(83, 94, 102, .7)",
      timerbg1: "rgba(86, 111, 129, .6)",
      timerbg2: "rgba(61, 71, 77, .6)",
      buttonbg1: "#232d33",
      buttonbg2: "#6a737c",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "#333537",
      text: "#D1D1D1",
      input: "#96a5b0",
    },
    "Summer Afternoon": {
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
    "Dusk Road": {
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
    "Brilliant Sunset": {
      shadow: "#FB8728",
      clockbg1: "rgba(89, 1, 147, .8)",
      clockbg2: "rgba(242, 130, 38, .8)",
      timerbg1: "rgba(236, 87, 46, .8)",
      timerbg2: "rgba(88, 64, 212, .8)",
      buttonbg1: "rgba(3, 0, 204, .6)",
      buttonbg2: "rgba(167, 88, 88, .6)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#9A4F42",
      text: "#FFFFFF",
      input: "#E9A5A5",
    },
    "Verdant Forest": {
      shadow: "#d2d5a9",
      clockbg1: "rgba(39,51,19,.8)",
      clockbg2: "rgba(98,170,56,.8)",
      timerbg1: "rgba(86, 128, 58, .8)",
      timerbg2: "rgba(27, 78, 7, .8)",
      buttonbg1: "rgba(68, 83, 67, .8)",
      buttonbg2: "rgba(83, 100, 67, .8)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#000000",
      text: "#c5dadb",
      input: "rgba(123, 168, 78, .8)",
    },
    "Under The Sea": {
      shadow: "#39a0b1",
      clockbg1: "rgba(70,164,156,.8)",
      clockbg2: "rgba(18,68,97,.8)",
      timerbg1: "rgba(15, 56, 75, .8)",
      timerbg2: "rgba(70, 177, 136, .8)",
      buttonbg1: "rgba(53, 156, 123, .8)",
      buttonbg2: "rgba(10, 45, 65, .8)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#296551",
      text: "#ffc766",
      input: "rgba(244,179,97,.7)",
    },
    "City Rain": {
      shadow: "#ADADAD",
      clockbg1: "rgba(38,30,20,.8)",
      clockbg2: "rgba(124,111,106,.8)",
      timerbg1: "rgba(129,119,111,.8)",
      timerbg2: "rgba(97,93,95,.8)",
      buttonbg1: "rgba(88,74,60,.8)",
      buttonbg2: "rgba(197,177,164,.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(38,30,20,.8)",
      text: "rgb(215, 211, 209)",
      input: "rgba(171,161,155,.9)",
    },
    "Morning Field": {
      shadow: "rgb(118,137,142)",
      clockbg1: "rgba(228,194,136,0.9)",
      clockbg2: "rgba(129,144,147,0.9)",
      timerbg1: "rgba(236, 201, 3, 0.8)",
      timerbg2: "rgba(177, 198, 40, 0.8)",
      buttonbg1: "rgba(212,183,139,0.8)",
      buttonbg2: "rgba(223,185,119,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(108,103,74)",
      text: "rgb(98,23,04)",
      input: "rgba(226,190,124,0.9)",
    },
    "Mid Morning Field": {
      shadow: "rgb(118,137,142)",
      clockbg1: "rgba(228,194,136,0.9)",
      clockbg2: "rgba(129,144,147,0.9)",
      timerbg1: "rgba(236, 201, 3, 0.8)",
      timerbg2: "rgba(177, 198, 40, 0.8)",
      buttonbg1: "rgba(212,183,139,0.8)",
      buttonbg2: "rgba(223,185,119,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(108,103,74)",
      text: "rgb(98,23,04)",
      input: "rgba(226,190,124,0.9)",
    },
    "Mid Day Field": {
      shadow: "rgb(181,192,196)",
      clockbg1: "rgba(255,255,255,0.85)",
      clockbg2: "rgba(98,140,172,0.85)",
      timerbg1: "rgba(198,198,036, 0.85)",
      timerbg2: "rgba(106,115,043, 0.85)",
      buttonbg1: "rgba(156,176,120,0.8)",
      buttonbg2: "rgba(249,255,209,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(023,038,009)",
      text: "rgb(002,076,136)",
      input: "rgba(172,179,180,0.9)",
    },
    "Rainy Field": {
      shadow: "rgb(37,41,32)",
      clockbg1: "rgba(65,75,66,.8)",
      clockbg2: "rgba(136,150,145,.8)",
      timerbg1: "rgba(71,88,39,.8)",
      timerbg2: "rgba(97,113,86,.8)",
      buttonbg1: "rgba(80,99,57,.8)",
      buttonbg2: "rgba(115,131,123,.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(161,161,161,.9)",
    },
    "Foggy Woods": {
      shadow: "rgb(121,62,24)",
      clockbg1: "rgba(138,149,153,0.85)",
      clockbg2: "rgba(55,78,55,0.85)",
      timerbg1: "rgba(167,174,175,0.8)",
      timerbg2: "rgba(30,40,32,0.8)",
      buttonbg1: "rgba(122,54,7,0.8)",
      buttonbg2: "rgba(176,185,186,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(58,69,57)",
      text: "rgb(255,221,189)",
      input: "rgba(195,163,141,0.6)",
    },
    "Golden Blue Morning": {
      shadow: "rgb(194,130,45)",
      clockbg1: "rgba(35,74,97,0.85)",
      clockbg2: "rgba(179,132,85,0.85)",
      timerbg1: "rgba(178,141,94,0.8)",
      timerbg2: "rgba(95,101,85,0.8)",
      buttonbg1: "rgba(167,133,95,0.8)",
      buttonbg2: "rgba(105,104,83,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(98,72,45)",
      text: "rgb(255,221,189)",
      input: "rgba(177,157,114,0.9)",
    },
    "Placid River": {
      shadow: "rgb(152,180,0)",
      clockbg1: "rgba(39,51,19,.8)",
      clockbg2: "rgba(98,170,56,.8)",
      timerbg1: "rgba(86, 128, 58, .8)",
      timerbg2: "rgba(27, 78, 7, .8)",
      buttonbg1: "rgba(68, 83, 67, .8)",
      buttonbg2: "rgba(83, 100, 67, .8)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "rgb(5,36,21)",
      text: "rgb(182,242,235",
      input: "rgba(123, 168, 78, .8)",
    },
    "Natural Dystopia": {
      shadow: "rgb(133,123,63)",
      clockbg1: "rgba(196,162,115,.7)",
      clockbg2: "rgba(68,48,19,.7)",
      timerbg1: "rgba(18,31,14,.8)",
      timerbg2: "rgba(99,83,54,.8)",
      buttonbg1: "rgba(53,40,14,.8)",
      buttonbg2: "rgba(166,158,63,.8)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "rgba(118, 109, 11, 0.45)",
      text: "rgb(244,242,203)",
      input: "rgba(149,147,91,.6)",
    },
  };

  // Populate the themeSelector dropdown
  const themeSelector = document.getElementById("themeSelector");
  themeSelector.innerHTML = ""; // Clear any existing options
  Object.keys(themes).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    // Capitalize first letter for display
    option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    themeSelector.appendChild(option);
  });

  /********************************************************************************
   * This script updates the visible elements in the HTML document with the
   * colors defined for each theme. Every time a new theme is chosen, the HTML
   * elements are updated with the new colors of that theme.
   ********************************************************************************/
  document
    .getElementById("themeSelector")
    .addEventListener("change", function () {
      let theme = themes[this.value];
      if (theme) {
        // Update the color of the box shadow on the clock, buttons, and timer
        document.documentElement.style.setProperty(
          "--box-shadow-color",
          theme.shadow
        );
        // Update the background color 1 of the clock
        document.documentElement.style.setProperty(
          "--clock-bg1",
          theme.clockbg1
        );
        // Update the background color 2 of the clock
        document.documentElement.style.setProperty(
          "--clock-bg2",
          theme.clockbg2
        );
        // Update the background color 1 of the timer
        document.documentElement.style.setProperty(
          "--timer-bg1",
          theme.timerbg1
        );
        // Update the background color 2 of the timer
        document.documentElement.style.setProperty(
          "--timer-bg2",
          theme.timerbg2
        );
        // Update the background color 1 of the start/stop/reset buttons
        document.documentElement.style.setProperty(
          "--button-bg1",
          theme.buttonbg1
        );
        // Update the background color 2 of the start/stop/reset buttons
        document.documentElement.style.setProperty(
          "--button-bg2",
          theme.buttonbg2
        );
        // Update the background color 1 of the whole page background
        // NOTE: This is only visible when the user chooses a color different
        // from the default theme background image. Remove this?
        // document.documentElement.style.setProperty("--page-bg1", theme.pagebg1);
        // Update the background color 2 of the whole page background
        // NOTE: This is only visible when the user chooses a color different
        // from the default theme background image. Remove this?
        // document.documentElement.style.setProperty("--page-bg2", theme.pagebg2);
        // Update the color of the navbar
        document.documentElement.style.setProperty("--navbar-bg", theme.navbar);
        // Update the color of all text displayed on the WebClock
        document.documentElement.style.setProperty("--text-color", theme.text);
        // Update the background color of the date/time input boxes
        document.documentElement.style.setProperty(
          "--input-box-color",
          theme.input
        );
      }
    });

  /********************************************************************************
   * This script updates the visible elements in the HTML document with the
   * colors that are chosen by the user in the color picker options found in the
   * navbar menu. See above for HTML element descriptions for updated elements.
   ********************************************************************************/
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

/********************************************************************************
 * This script updates the background images for each theme. Currently, all theme
 * images are just links to public images on the internet. If this becomes a real
 * website, ensure all images are contained in the project and are free to use.
 ********************************************************************************/
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
    "Thunderstorm": {
      backgroundImage:
        "url('https://media.istockphoto.com/id/106529026/photo/threatening-dark-clouds-covering-the-sky.jpg?s=612x612&w=0&k=20&c=XOSnMeZbKOW541FgTISJkDVvFK_bVHyTvusmAk9jjAs=')",
    },
    "Summer Afternoon": {
      // backgroundImage: "url('https://www.freeimageslive.com/galleries/nature/weather/pics/sunny_clouds_8092612.jpg')",
      backgroundImage:
        "url('https://burst.shopifycdn.com/photos/bright-blue-sky-dotted-with-fluffy-white-clouds.jpg?exif=0&iptc=0')",
    },
    "Dusk Road": {
      // backgroundImage:
      //   "url('https://live.staticflickr.com/7915/32413680647_bfa12df896_b.jpg')",
      backgroundImage:
        "url('https://img.freepik.com/premium-photo/sunrise-road-summer-sunny-highway-journey-landscape-way-sunlight-horizon-copy-space_162695-14253.jpg')",
    },
    "Brilliant Sunset": {
      backgroundImage:
        "url('https://t4.ftcdn.net/jpg/01/04/78/75/360_F_104787586_63vz1PkylLEfSfZ08dqTnqJqlqdq0eXx.jpg')",
    },
    "Under The Sea": {
      backgroundImage:
        "url('https://c1.wallpaperflare.com/preview/874/981/117/ocean-life-under-water-colorful-fish.jpg')",
    },
    "Verdant Forest": {
      backgroundImage: "url('https://images4.alphacoders.com/105/105806.jpg')",
    },
    "Foggy Woods": {
      backgroundImage: "url('https://wallpapersok.com/images/hd/foggy-road-in-the-redwood-forest-hekos5o4bl1makkv.jpg')",
    },
    "Morning Field": {
      backgroundImage:
        "url('https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
    },
    "Mid Morning Field": {
      backgroundImage:
        "url('images/midMorningField.png')",
    },
    "Mid Day Field": {
      backgroundImage:
        "url('images/middayField.png')",
    },
    "Rainy Field": {
      backgroundImage:
        "url('images/rainyField.png')",
    },
    autumn: {
      backgroundImage: "url('https://example.com/autumn.jpg')",
    },
    "City Rain": {
      backgroundImage:
        "url('https://t3.ftcdn.net/jpg/01/18/77/84/240_F_118778493_2wK8Eom8T1PIRZU564kaowvLNooggsVZ.jpg')",
    },
    "Golden Blue Morning": {
      backgroundImage:
        "url('https://c1.wallpaperflare.com/preview/288/835/770/sunset-sweden-sm%C3%A5land-blue.jpg')",
    },
    "Placid River": {
      backgroundImage: "url('https://live.staticflickr.com/4232/35623383532_31c9ccf0f4_h.jpg')",
    },
    "Natural Dystopia": {
      backgroundImage: "url('https://wallpapercave.com/wp/wp2015884.jpg')",
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

/********************************************************************************
 * This script is the result of inexperienced JS coding. This script fixes the
 * issue of not being able to update the background colors of a pre defined theme
 * instead of using the default theme background image. Using the below script,
 * backgound colors can be updated by the user instead of using default images.
 ********************************************************************************/
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
