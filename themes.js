/* *********************************************************************************
 * themes.js -- March 2025 -- Joe Paradiso
 *
 * PURPOSE:
 *  - Centralizes theme definitions (colors + background images) in one master
 *    object so theme data is easy to maintain.
 *  - Populates two independent dropdowns in the navbar: `themeSelector` and
 *    `themeSelector2`. Each dropdown may contain a different subset of themes
 *    (initially defined by `manualGroupB`). Selecting an option applies the
 *    associated theme (CSS variables and background image) immediately.
 *  - Provides color picker handlers that allow the user to override CSS
 *    variables at runtime.
 *
 * HOW TO ADD NEW THEMES / CONTROL WHICH DROPDOWN THEY APPEAR IN
 *  1) Add the theme's color properties into the `colorThemes` object below.
 *     Use the same property keys other themes use (shadow, clockbg1, clockbg2,
 *     timerbg1, timerbg2, buttonbg1, buttonbg2, pagebg1, pagebg2, navbar, text,
 *     input). You can omit properties that aren't relevant for a theme.
 *
 *  2) Add the theme's background image entry into `bgThemes` below. The key
 *     must match the key you used in `colorThemes`.
 *
 *  3) Control which dropdown contains the theme:
 *     - To place a theme in the SECOND dropdown (`themeSelector2`) initially,
 *       add its exact key (string) to the `manualGroupB` array (near the
 *       grouping logic). The order in `manualGroupB` dictates the order the
 *       theme appears inside `themeSelector2`.
 *     - Themes not listed in `manualGroupB` will appear in the FIRST dropdown
 *       (`themeSelector`) in the same order they are defined in `colorThemes`
 *       / `masterThemes`.
 *
 *  NOTES:
 *  - This is just the initial placement. If you later want to reassign a
 *    theme, edit `manualGroupB` and reload the page.
 *  - Theme keys are treated as exact strings. Be consistent with capitalization.
 *  - For maintainability, keep colorThemes and bgThemes near each other so
 *    adding a theme is a small, local change.
 *
 * INTERNALS / IMPLEMENTATION SUMMARY:
 *  - `colorThemes` contains the color-related properties for each theme.
 *  - `bgThemes` contains backgroundImage entries.
 *  - `masterThemes` merges the two so a single lookup contains both colors and
 *    background image for a theme.
 *  - Dropdowns are populated from `masterThemes` using either manual lists or
 *    ordering preserved from `masterThemes`.
 *********************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  // Hamburger Menu Toggle
  const menuToggle = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");

  // Toggles the navbar menu between active/inactive when clicked
  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("nav-active");
  });

  /********************************************************************************
   * Master theme store: colors + background images in one place. We'll split the
   * available keys into two groups and populate `themeSelector` and
   * `themeSelector2` from those groups.
   ********************************************************************************/
  const colorThemes = {
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
    "Cloudy Field": {
      shadow: "rgb(19,29,08)",
      clockbg1: "rgba(44,63,63,.9)",
      clockbg2: "rgba(102,124,127,.9)",
      timerbg1: "rgba(40,63,0,.8)",
      timerbg2: "rgba(97,113,86,.8)",
      buttonbg1: "rgba(80,99,57,.8)",
      buttonbg2: "rgba(115,131,123,.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(161,161,161,.9)",
    },
    "Overcast Field": {
      shadow: "rgb(46,41,24)",
      clockbg1: "rgba(99,110,99,.9)",
      clockbg2: "rgba(61,70,76,.9)",
      timerbg1: "rgba(39,45,06,.8)",
      timerbg2: "rgba(95,106,38,.8)",
      buttonbg1: "rgba(61,70,32,.8)",
      buttonbg2: "rgba(115,131,123,.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(161,161,161,.9)",
    },
    "Stormy Field": {
      shadow: "rgb(121,89,42)",
      clockbg1: "rgba(47,39,31,.8)",
      clockbg2: "rgba(11,15,18,.8)",
      timerbg1: "rgba(11,15,2,.8)",
      timerbg2: "rgba(71,53,2,.8)",
      buttonbg1: "rgba(96,80,52,.7)",
      buttonbg2: "rgba(11,16,17,.7)",
      pagebg1: "#000000",
      pagebg2: "#000000",
      navbar: "rgba(24,21,17,.8)",
      text: "rgb(165,117,49)",
      input: "rgba(99,70,39,.9)",
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
    "Autumnal Field": {
      shadow: "rgb(189,128,62)",
      clockbg1: "rgba(223,154,114,.7)",
      clockbg2: "rgba(128,52,15,.7)",
      timerbg1: "rgba(243,186,88,.8)",
      timerbg2: "rgba(152,97,46,.8)",
      buttonbg1: "rgba(160,69,24,.8)",
      buttonbg2: "rgba(246,212,157,.8)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(244,242,203)",
      input: "rgba(211,196,173,.6)",
    },
    "Afternoon Pumpkin Field": {
      shadow: "rgb(145,122,85)",
      clockbg1: "rgba(193,190,179,.7)",
      clockbg2: "rgba(153,173,178,.7)",
      timerbg1: "rgba(238,153,33,.8)",
      timerbg2: "rgba(177,103,11,.8)",
      buttonbg1: "rgba(62,49,4,.8)",
      buttonbg2: "rgba(246,212,157,.8)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(66,43,6)",
      input: "rgba(211,196,173,.6)",
    },
    "Misty Autumnal Field": {
      shadow: "rgb(77,48,10)",
      clockbg1: "rgba(162,153,134,.8)",
      clockbg2: "rgba(129,130,124,.8)",
      timerbg1: "rgba(185,146,95,.8)",
      timerbg2: "rgba(90,69,38,.8)",
      buttonbg1: "rgba(102,77,47,.8)",
      buttonbg2: "rgba(169,140,102,.8)",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(175,167,150,.9)",
    },
    "Scattered Clouds Fall Field": {
      shadow: "rgb(77,48,10)",
      clockbg1: "rgba(198,168,120,.8)",
      clockbg2: "rgba(56,56,52,.8)",
      timerbg1: "rgba(185,146,95,.8)",
      timerbg2: "rgba(90,69,38,.8)",
      buttonbg1: "rgba(102,77,47,.8)",
      buttonbg2: "rgba(169,140,102,.8)",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(175,167,150,.9)",
    },
    "Sunny Autumnal Field": {
      shadow: "rgb(189,128,62)",
      clockbg1: "rgba(223,154,114,.7)",
      clockbg2: "rgba(128,52,15,.7)",
      timerbg1: "rgba(243,186,88,.8)",
      timerbg2: "rgba(152,97,46,.8)",
      buttonbg1: "rgba(160,69,24,.8)",
      buttonbg2: "rgba(246,212,157,.8)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(244,242,203)",
      input: "rgba(211,196,173,.6)",
    },
  };

  const bgThemes = {
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
      backgroundImage:
        "url('https://burst.shopifycdn.com/photos/bright-blue-sky-dotted-with-fluffy-white-clouds.jpg?exif=0&iptc=0')",
    },
    "Dusk Road": {
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
    "Cloudy Field": {
      backgroundImage:
        "url('images/cloudyField.png')",
    },
    "Overcast Field": {
      backgroundImage:
        "url('images/cloudyAfternoonField.png')",
    },
    "Stormy Field": {
      backgroundImage:
        "url('images/darkStormyField.png')",
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
    "Autumnal Field": {
      backgroundImage: "url('images/autumnal_field.png')",
    },
    "Afternoon Pumpkin Field": {
      backgroundImage: "url('images/afternoonPumpkinPatchField.png')",
    },
    "Misty Autumnal Field": {
      backgroundImage: "url('images/autumnal_misty_field.png')",
    },
    "Scattered Clouds Fall Field": {
      backgroundImage: "url('images/cloudyFallField.png')",
    },
    "Sunny Autumnal Field": {
      backgroundImage: "url('images/sunnyAutumnalField.png')",
    },
  };

  // Build a single master themes object by merging colorThemes and bgThemes
  const masterThemes = {};
  Object.keys(colorThemes).forEach(key => {
    masterThemes[key] = Object.assign({}, colorThemes[key]);
    if (bgThemes[key]) masterThemes[key].backgroundImage = bgThemes[key].backgroundImage;
  });
  // Include any bg-only keys
  Object.keys(bgThemes).forEach(key => {
    if (!masterThemes[key]) masterThemes[key] = { backgroundImage: bgThemes[key].backgroundImage };
  });

  // Split keys into two groups using a manual list for groupB so you can control
  // initial assignment and order. The remaining keys (groupA) will preserve the
  // order they appear in the code (masterThemes insertion order).
  const allKeys = Object.keys(masterThemes);
  // MANUAL: list themes that should initially appear in the second selector
  // (themeSelector2). Change this array to control which themes belong to
  // selector2 and the order they appear. This is a one-time initial mapping;
  // you can add/remove names here as you add new themes later.
  const manualGroupB = [
    "Autumnal Field",
    "Sunny Autumnal Field",
    "Misty Autumnal Field",
    "Scattered Clouds Fall Field",
    "Afternoon Pumpkin Field",
    "Morning Field",
    "Mid Morning Field",
    "Mid Day Field",
    "Rainy Field",
    "Cloudy Field",
    "Overcast Field",
    "Stormy Field",
  ];
  // groupA keeps the master order but excludes the manual groupB entries
  const groupA = allKeys.filter(k => !manualGroupB.includes(k));
  // groupB follows the manual list but only includes keys that exist
  const groupB = manualGroupB.filter(k => Object.prototype.hasOwnProperty.call(masterThemes, k));

  // Populate the dropdowns
  const themeSelector = document.getElementById("themeSelector");
  const themeSelector2 = document.getElementById("themeSelector2");
  if (themeSelector) {
    themeSelector.innerHTML = "";
    groupA.forEach(key => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      themeSelector.appendChild(option);
    });
  }
  if (themeSelector2) {
    themeSelector2.innerHTML = "";
    groupB.forEach(key => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      themeSelector2.appendChild(option);
    });
  }

  // Helper to apply a theme object to CSS variables and background
  function applyThemeByKey(key) {
    const theme = masterThemes[key];
    if (!theme) return;
    // Apply CSS variables if present
    if (theme.shadow) document.documentElement.style.setProperty("--box-shadow-color", theme.shadow);
    if (theme.clockbg1) document.documentElement.style.setProperty("--clock-bg1", theme.clockbg1);
    if (theme.clockbg2) document.documentElement.style.setProperty("--clock-bg2", theme.clockbg2);
    if (theme.timerbg1) document.documentElement.style.setProperty("--timer-bg1", theme.timerbg1);
    if (theme.timerbg2) document.documentElement.style.setProperty("--timer-bg2", theme.timerbg2);
    if (theme.buttonbg1) document.documentElement.style.setProperty("--button-bg1", theme.buttonbg1);
    if (theme.buttonbg2) document.documentElement.style.setProperty("--button-bg2", theme.buttonbg2);
    if (theme.navbar) document.documentElement.style.setProperty("--navbar-bg", theme.navbar);
    if (theme.text) document.documentElement.style.setProperty("--text-color", theme.text);
    if (theme.input) document.documentElement.style.setProperty("--input-box-color", theme.input);
    // Apply background image if available, otherwise preserve gradient
    if (theme.backgroundImage) {
      document.body.style.background = theme.backgroundImage;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    }
  }

  // Wire change handlers
  if (themeSelector) {
    themeSelector.addEventListener("change", function () {
      applyThemeByKey(this.value);
    });
    // apply initial selection
    if (themeSelector.options.length) applyThemeByKey(themeSelector.options[0].value);
  }
  if (themeSelector2) {
    themeSelector2.addEventListener("change", function () {
      applyThemeByKey(this.value);
    });
    if (themeSelector2.options.length) applyThemeByKey(themeSelector2.options[0].value);
  }

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
