/* *********************************************************************************
 * themes.js -- March 2025 -- Joe Paradiso (Enhanced Theme Engine)
 *
 * PURPOSE:
 *  - Centralizes built-in theme definitions (colors + background images) in master
 *    objects and manages runtime theme persistence in localStorage.
 *  - Populates two independent dropdowns in the navbar: `themeSelector` (General)
 *    and `themeSelector2` (Field Themes).
 *  - Exposes the global `window.ThemeEngine` API allowing the Theme Studio to
 *    visually create, edit, delete, preview, import, and export themes.
 *********************************************************************************/

(function () {
  "use strict";

  // Built-in color theme definitions
  const defaultColorThemes = {
    "Morning Light": {
      shadow: "#eaa593",
      clockbg1: "rgba(142, 174, 193, 0.5)",
      clockbg2: "rgba(139, 121, 149, 0.5)",
      timerbg1: "rgba(199, 147, 138, 0.5)",
      timerbg2: "rgba(119, 117, 174, 0.5)",
      pagebg1: "#08001f",
      pagebg2: "#30197d",
      navbar: "rgba(138, 122, 148, 0.9)",
      text: "#ffdb8f",
      input: "#DCC48F",
      timerVisual: "#F8E3AF",
      navbarText: "#DCC48F",
    },
    lava: {
      shadow: "#F99B4E",
      clockbg1: "#223138",
      clockbg2: "#586566",
      pagebg1: "#08001f",
      pagebg2: "#30197d",
      navbar: "#000000e6",
      text: "#e6740a",
      input: "#F3B268",
    },
    Thunderstorm: {
      shadow: "#ADADAD",
      clockbg1: "rgba(25, 35, 39, .7)",
      clockbg2: "rgba(83, 94, 102, .7)",
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
      pagebg1: "#000000",
      pagebg2: "#000000",
      navbar: "#1f5ea2",
      text: "#FFFFFF",
      input: "#91b6d9",
    },
    "Dusk Road": {
      shadow: "#c88437",
      clockbg1: "rgba(65,108,100,.65)",
      clockbg2: "rgba(242,130,38,.65)",
      navbar: "rgba(70, 74, 109, .5)",
      text: "rgb(254, 233, 129)",
      input: "rgba(220,143,80,.5)",
    },
    "Brilliant Sunset": {
      shadow: "#FB8728",
      clockbg1: "rgba(89, 1, 147, .8)",
      clockbg2: "rgba(242, 130, 38, .8)",
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
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "#296551",
      text: "#ffc766",
      input: "rgba(244,179,97,.7)",
      timerVisual: "#00d9ff",
      navbarText: "#ffc766",
    },
    "City Rain": {
      shadow: "#ADADAD",
      clockbg1: "rgba(38,30,20,.8)",
      clockbg2: "rgba(124,111,106,.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(38,30,20,.8)",
      text: "rgb(215, 211, 209)",
      input: "rgba(171,161,155,.9)",
    },
    "Morning Field": {
      shadow: "rgb(37,47,57)",
      clockbg1: "rgba(129,144,147,0.8)",
      clockbg2: "rgba(228,194,136,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(108,103,74)",
      text: "rgb(98,23,04)",
      input: "rgba(226,190,124,0.9)",
      timerVisual: "#f3d482",
      navbarText: "#d6ca8a",
    },
    "Mid Morning Field": {
      shadow: "rgb(118,137,142)",
      clockbg1: "rgba(151,178,201,0.8)",
      clockbg2: "rgba(243,230,210,0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(108,103,74)",
      text: "rgb(98,23,04)",
      input: "rgba(204,176,124,0.9)",
    },
    "Mid Day Field": {
      shadow: "rgb(181,192,196)",
      clockbg1: "rgba(255,255,255,0.7)",
      clockbg2: "rgba(190,216,247,0.7)",
      timerbg1: "rgba(255,255,255,0.7)",
      timerbg2: "rgba(190,216,247,0.7)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(023,038,009)",
      text: "rgb(002,076,136)",
      input: "rgba(208,201,57,0.9)",
      timerVisual: "rgb(181,192,196)",
      navbarText: "#cce8ff",
    },
    "Rainy Field": {
      shadow: "rgb(37,41,32)",
      clockbg1: "rgba(59, 59, 59, 0.8)",
      clockbg2: "rgba(153, 153, 153, 0.8)",
      timerbg1: "rgba(79, 79, 79, 0.8)",
      timerbg2: "rgba(156, 156, 156, 0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(161,161,161,.9)",
      timerVisual: "rgb(37,41,32)",
      navbarText: "rgb(215,211,209)",
    },
    "Post Rain Field": {
      shadow: "rgb(181,192,196)",
      clockbg1: "rgba(163, 181, 210, 0.7)",
      clockbg2: "rgba(241, 244, 249, 0.8)",
      timerbg1: "rgba(233, 236, 241, 0.7)",
      timerbg2: "rgba(102, 118, 143, 0.8)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(023,038,009)",
      text: "rgb(002,076,136)",
      input: "rgba(208,201,57,0.9)",
      timerVisual: "#485d7e",
      navbarText: "#e1f1fe",
    },
    "Cloudy Field": {
      shadow: "rgb(19,29,08)",
      clockbg1: "rgba(44,63,63,.9)",
      clockbg2: "rgba(102,124,127,.9)",
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
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(58,69,57)",
      text: "rgb(255,221,189)",
      input: "rgba(195,163,141,0.6)",
    },
    "Whispering Cottage": {
      shadow: "rgb(194,130,45)",
      clockbg1: "rgba(35,74,97,0.6)",
      clockbg2: "rgba(179,132,85,0.6)",
      pagebg1: "#303030",
      pagebg2: "#000000",
      navbar: "rgba(98,72,45,.4)",
      text: "rgb(255,244,189)",
      input: "rgba(177,157,114,0.6)",
    },
    "Space Clouds": {
      shadow: "rgb(152,159,160)",
      clockbg1: "rgba(177,170,160,.7)",
      clockbg2: "rgba(14,19,40,.8)",
      pagebg1: "#000000",
      pagebg2: "#000000",
      navbar: "rgba(51,54,56, 0.45)",
      text: "rgb(243, 228, 201)",
      input: "rgba(185,176,149, .6)",
      timerVisual: "#98b2e7",
      navbarText: "rgb(243, 228, 201)",
    },
    "Natural Dystopia": {
      shadow: "rgb(133,123,63)",
      clockbg1: "rgba(196,162,115,.7)",
      clockbg2: "rgba(68,48,19,.7)",
      pagebg1: "#593BA0",
      pagebg2: "#673104",
      navbar: "rgba(118, 109, 11, 0.45)",
      text: "rgb(244,242,203)",
      input: "rgba(149,147,91,.6)",
      timerVisual: "#e4d167",
      navbarText: "rgb(244,242,203)",
    },
    "Autumnal Field": {
      shadow: "rgb(189,128,62)",
      clockbg1: "rgba(223,154,114,.7)",
      clockbg2: "rgba(128,52,15,.7)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(244,242,203)",
      input: "rgba(211,196,173,.6)",
    },
    "Afternoon Pumpkin Field": {
      shadow: "rgb(145,122,85)",
      clockbg1: "rgba(193,190,179,.7)",
      clockbg2: "rgba(153,173,178,.7)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(66,43,6)",
      input: "rgba(211,196,173,.6)",
    },
    "Misty Autumnal Field": {
      shadow: "rgb(77,48,10)",
      clockbg1: "rgba(162,153,134,.8)",
      clockbg2: "rgba(129,130,124,.8)",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(175,167,150,.9)",
    },
    "Scattered Clouds Fall Field": {
      shadow: "rgb(77,48,10)",
      clockbg1: "rgba(198,168,120,.8)",
      clockbg2: "rgba(56,56,52,.8)",
      navbar: "rgba(60,68,64,.8)",
      text: "rgb(215,211,209)",
      input: "rgba(175,167,150,.9)",
    },
    "Sunny Autumnal Field": {
      shadow: "rgb(189,128,62)",
      clockbg1: "rgba(223,154,114,.7)",
      clockbg2: "rgba(128,52,15,.7)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(244,242,203)",
      input: "rgba(211,196,173,.6)",
    },
    "Mid Morning Frosty Field": {
      shadow: "rgb(242,212,173)",
      clockbg1: "rgba(251,230,195,.7)",
      clockbg2: "rgba(147,150,161,.7)",
      navbar: "rgba(161,100,38, 0.45)",
      text: "rgb(104,80,39)",
      input: "rgba(211,196,173,.6)",
    },
    "Morning Frosty Field": {
      shadow: "rgb(119,134,154)",
      clockbg1: "rgba(251,230,195,.7)",
      clockbg2: "rgba(147,150,161,.7)",
      navbar: "rgba(95,95,100, 0.45)",
      text: "rgb(90,72,43)",
      input: "rgba(211,215,222,.6)",
    },
    "Partly Sunny Frosty Field": {
      shadow: "rgb(119,134,154)",
      clockbg1: "rgba(242,247,253,.7)",
      clockbg2: "rgba(159,166,186,.7)",
      navbar: "rgba(95,95,100, 0.45)",
      text: "rgb(90,72,43)",
      input: "rgba(211,215,222,.6)",
    },
    "Winter Evening Field": {
      shadow: "rgb(188,146,91)",
      clockbg1: "rgba(206,147,80,.5)",
      clockbg2: "rgba(59,69,109,.5)",
      navbar: "rgba(95,95,100, 0.45)",
      text: "rgb(197,205,211)",
      input: "rgba(192,159,128,.6)",
    },
    "Winter Night Field": {
      shadow: "rgb(209,212,228)",
      clockbg1: "rgba(242,247,253,.5)",
      clockbg2: "rgba(159,166,186,.8)",
      pagebg1: "#000000",
      pagebg2: "#000000",
      navbar: "rgba(95,95,100, 0.45)",
      text: "rgb(90,72,43)",
      input: "rgba(211,215,222,.6)",
      timerVisual: "rgb(209,212,228)",
      navbarText: "#dfe3ea",
    },
    "Iridescent Clouds": {
      shadow: "rgb(192,136,114)",
      clockbg1: "rgba(247,215,183,.5)",
      clockbg2: "rgba(154,100,88,.8)",
      pagebg1: "#000000",
      pagebg2: "#000000",
      navbar: "rgba(128,108,120, 0.45)",
      text: "rgb(70,52,61)",
      input: "rgba(197,135,114,.6)",
      timerVisual: "#faccab",
      navbarText: "rgb(70,52,61)",
    },
  };

  // Built-in background image definitions
  const defaultBgThemes = {
    "Morning Light": {
      backgroundImage: "url('images/morningLight.jpg')",
    },
    lava: {
      backgroundImage:
        "url('https://static.vecteezy.com/system/resources/thumbnails/045/698/869/small_2x/black-marble-texture-with-gold-veins-luxurious-surface-design-photo.jpg')",
    },
    Thunderstorm: {
      backgroundImage:
        "url('https://media.istockphoto.com/id/106529026/photo/threatening-dark-clouds-covering-the-sky.jpg?s=612x612&w=0&k=20&c=XOSnMeZbKOW541FgTISJkDVvFK_bVHyTvusmAk9jjAs=')",
    },
    "Summer Afternoon": {
      backgroundImage:
        "url('https://burst.shopifycdn.com/photos/bright-blue-sky-dotted-with-fluffy-white-clouds.jpg?exif=0&iptc=0')",
    },
    "Dusk Road": {
      backgroundImage: "url('images/duskRoad.png')",
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
      backgroundImage: "url('images/morningField_26.png')",
    },
    "Mid Morning Field": {
      backgroundImage: "url('images/midMorningField.png')",
    },
    "Mid Day Field": {
      backgroundImage: "url('images/middayField_26.png')",
    },
    "Rainy Field": {
      backgroundImage: "url('images/rainyField.png')",
    },
    "Post Rain Field": {
      backgroundImage: "url('images/postRainField_26.png')",
    },
    "Cloudy Field": {
      backgroundImage: "url('images/cloudyField.png')",
    },
    "Overcast Field": {
      backgroundImage: "url('images/cloudyAfternoonField.png')",
    },
    "Stormy Field": {
      backgroundImage: "url('images/darkStormyField.png')",
    },
    "City Rain": {
      backgroundImage:
        "url('https://t3.ftcdn.net/jpg/01/18/77/84/240_F_118778493_2wK8Eom8T1PIRZU564kaowvLNooggsVZ.jpg')",
    },
    "Whispering Cottage": {
      backgroundImage: "url('images/whisperingCottage.png')",
    },
    "Space Clouds": {
      backgroundImage: "url('images/spaceClouds.png')",
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
    "Mid Morning Frosty Field": {
      backgroundImage: "url('images/midMorningFrostyField.png')",
    },
    "Morning Frosty Field": {
      backgroundImage: "url('images/morningFrostyField.png')",
    },
    "Partly Sunny Frosty Field": {
      backgroundImage: "url('images/partlySunnyFrostyField.png')",
    },
    "Winter Evening Field": {
      backgroundImage: "url('images/eveningWinterField.png')",
    },
    "Winter Night Field": {
      backgroundImage: "url('images/winterNightField.png')",
    },
    "Iridescent Clouds": {
      backgroundImage: "url('images/iridescentClouds.png')",
    },
  };

  // Manual list of themes assigned to Group B (Field Themes)
  const defaultManualGroupB = [
    "Morning Field",
    "Mid Morning Field",
    "Mid Day Field",
    "Mid Morning Frosty Field",
    "Morning Frosty Field",
    "Partly Sunny Frosty Field",
    "Winter Evening Field",
    "Winter Night Field",
    "Autumnal Field",
    "Sunny Autumnal Field",
    "Misty Autumnal Field",
    "Scattered Clouds Fall Field",
    "Afternoon Pumpkin Field",
    "Rainy Field",
    "Post Rain Field",
    "Cloudy Field",
    "Overcast Field",
    "Stormy Field",
  ];

  // List of pre-bundled images in the images/ directory
  const BUNDLED_IMAGES = [
    { name: "Morning Field 26", path: "images/morningField_26.png" },
    { name: "Mid Morning Field", path: "images/midMorningField.png" },
    { name: "Mid Day Field 26", path: "images/middayField_26.png" },
    { name: "Midday Field", path: "images/middayField.png" },
    { name: "Afternoon Field", path: "images/afternoonField.png" },
    { name: "Cool Midday Field", path: "images/coolMiddayField.png" },
    { name: "Morning Haze", path: "images/morningHaze.png" },
    { name: "Cloudy Field", path: "images/cloudyField.png" },
    { name: "Cloudy Afternoon Field", path: "images/cloudyAfternoonField.png" },
    { name: "Rainy Field", path: "images/rainyField.png" },
    { name: "Dark Stormy Field", path: "images/darkStormyField.png" },
    { name: "Autumnal Field", path: "images/autumnal_field.png" },
    { name: "Sunny Autumnal Field", path: "images/sunnyAutumnalField.png" },
    { name: "Autumnal Misty Field", path: "images/autumnal_misty_field.png" },
    { name: "Cloudy Fall Field", path: "images/cloudyFallField.png" },
    { name: "Afternoon Pumpkin Patch", path: "images/afternoonPumpkinPatchField.png" },
    { name: "Mid Morning Frosty Field", path: "images/midMorningFrostyField.png" },
    { name: "Morning Frosty Field", path: "images/morningFrostyField.png" },
    { name: "Partly Sunny Frosty Field", path: "images/partlySunnyFrostyField.png" },
    { name: "Evening Winter Field", path: "images/eveningWinterField.png" },
    { name: "Winter Night Field", path: "images/winterNightField.png" },
    { name: "Whispering Cottage", path: "images/whisperingCottage.png" },
    { name: "Space Clouds", path: "images/spaceClouds.png" },
    { name: "Dusk Road", path: "images/duskRoad.png" },
    { name: "Iridescent Clouds", path: "images/iridescentClouds.png" },
    { name: "Apocalypse Field", path: "images/apocalypseField.png" },
  ];

  // Storage keys
  const STORAGE_CUSTOM_THEMES = "webclock_custom_themes";
  const STORAGE_DELETED_THEMES = "webclock_deleted_themes";
  const STORAGE_CURRENT_THEME = "webclock_theme_key";

  /********************************************************************************
   * Storage helpers
   ********************************************************************************/
  function getCustomThemesStore() {
    try {
      const data = localStorage.getItem(STORAGE_CUSTOM_THEMES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn("Error reading custom themes:", e);
      return {};
    }
  }

  function setCustomThemesStore(store) {
    try {
      localStorage.setItem(STORAGE_CUSTOM_THEMES, JSON.stringify(store));
    } catch (e) {
      console.warn("Error saving custom themes:", e);
    }
  }

  function getDeletedThemesList() {
    try {
      const data = localStorage.getItem(STORAGE_DELETED_THEMES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Error reading deleted themes:", e);
      return [];
    }
  }

  function setDeletedThemesList(list) {
    try {
      localStorage.setItem(STORAGE_DELETED_THEMES, JSON.stringify(list));
    } catch (e) {
      console.warn("Error saving deleted themes:", e);
    }
  }

  /********************************************************************************
   * Color Parsing and Formatting Utilities
   ********************************************************************************/
  function colorToHex(colorStr) {
    if (!colorStr) return "#000000";
    colorStr = colorStr.trim();

    if (colorStr.startsWith("#")) {
      if (colorStr.length === 4) {
        return `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
      }
      return colorStr.slice(0, 7);
    }

    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
      const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
      const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }

    return "#000000";
  }

  function parseColor(colorStr) {
    if (!colorStr) return { hex: "#000000", alpha: 1.0, isTransparent: false };
    colorStr = colorStr.trim();

    if (colorStr.startsWith("#")) {
      let hex = colorStr;
      let alpha = 1.0;
      if (colorStr.length === 4) {
        hex = `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
      } else if (colorStr.length === 5) {
        hex = `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
        alpha = Math.round((parseInt(colorStr[4] + colorStr[4], 16) / 255) * 100) / 100;
      } else if (colorStr.length >= 9) {
        hex = colorStr.slice(0, 7);
        const aInt = parseInt(colorStr.slice(7, 9), 16);
        alpha = Math.round((aInt / 255) * 100) / 100;
      } else {
        hex = colorStr.slice(0, 7);
      }
      return { hex, alpha, isTransparent: alpha < 1.0 };
    }

    const match = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (match) {
      const r = Math.min(255, parseInt(match[1], 10) || 0).toString(16).padStart(2, "0");
      const g = Math.min(255, parseInt(match[2], 10) || 0).toString(16).padStart(2, "0");
      const b = Math.min(255, parseInt(match[3], 10) || 0).toString(16).padStart(2, "0");
      let alpha = 1.0;
      if (match[4] !== undefined) {
        alpha = parseFloat(match[4]);
        if (isNaN(alpha)) alpha = 1.0;
      }
      return { hex: `#${r}${g}${b}`, alpha, isTransparent: alpha < 1.0 };
    }

    return { hex: "#000000", alpha: 1.0, isTransparent: false };
  }

  function formatColor(hex, alpha) {
    if (!hex) return "#000000";
    if (alpha === undefined || alpha === null || alpha >= 1.0) {
      return hex;
    }
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const roundedAlpha = Math.round(alpha * 100) / 100;
    return `rgba(${r}, ${g}, ${b}, ${roundedAlpha})`;
  }

  /********************************************************************************
   * Master Theme Store Builder & Resolver
   ********************************************************************************/
  function getMasterThemes() {
    const customThemes = getCustomThemesStore();
    const deletedThemes = getDeletedThemesList();

    const master = {};

    // 1. Load built-in colors & bg images
    Object.keys(defaultColorThemes).forEach(key => {
      if (deletedThemes.includes(key)) return;
      master[key] = Object.assign({}, defaultColorThemes[key]);
      if (defaultBgThemes[key]) {
        master[key].backgroundImage = defaultBgThemes[key].backgroundImage;
      }
      master[key].isCustom = false;
      master[key].group = defaultManualGroupB.includes(key) ? "groupB" : "groupA";
    });

    Object.keys(defaultBgThemes).forEach(key => {
      if (deletedThemes.includes(key)) return;
      if (!master[key]) {
        master[key] = {
          backgroundImage: defaultBgThemes[key].backgroundImage,
          isCustom: false,
          group: defaultManualGroupB.includes(key) ? "groupB" : "groupA",
        };
      }
    });

    // 2. Overlay / add custom or modified themes from localStorage
    Object.keys(customThemes).forEach(key => {
      if (deletedThemes.includes(key)) return;
      const customItem = customThemes[key];
      master[key] = Object.assign({}, customItem.colors || customItem);
      if (customItem.backgroundImage) {
        master[key].backgroundImage = customItem.backgroundImage;
      }
      master[key].isCustom = true;
      master[key].group = customItem.group || (defaultManualGroupB.includes(key) ? "groupB" : "groupA");
    });

    return master;
  }

  function getGroupA() {
    const master = getMasterThemes();
    return Object.keys(master).filter(k => master[k].group === "groupA");
  }

  function getGroupB() {
    const master = getMasterThemes();
    const groupBKeys = Object.keys(master).filter(k => master[k].group === "groupB");
    return groupBKeys.sort((a, b) => {
      const idxA = defaultManualGroupB.indexOf(a);
      const idxB = defaultManualGroupB.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }

  /********************************************************************************
   * Applies a theme to live CSS variables and document background
   ********************************************************************************/
  function applyThemeByKey(key, savePreference = true) {
    const master = getMasterThemes();
    let theme = master[key];

    // Fallback if key does not exist: pick first Group B theme or first available
    if (!theme) {
      const groupB = getGroupB();
      if (groupB.length > 0) {
        key = groupB[0];
        theme = master[key];
      } else {
        const keys = Object.keys(master);
        if (keys.length > 0) {
          key = keys[0];
          theme = master[key];
        } else {
          return;
        }
      }
    }

    if (theme.shadow) document.documentElement.style.setProperty("--box-shadow-color", theme.shadow);
    if (theme.clockbg1) document.documentElement.style.setProperty("--clock-bg1", theme.clockbg1);
    if (theme.clockbg2) document.documentElement.style.setProperty("--clock-bg2", theme.clockbg2);

    const todobg1 = theme.todobg1 || theme.clockbg1;
    if (todobg1) document.documentElement.style.setProperty("--todo-bg1", todobg1);

    const todobg2 = theme.todobg2 || theme.clockbg2;
    if (todobg2) document.documentElement.style.setProperty("--todo-bg2", todobg2);

    const todoItemBg = theme.todoItemBg || "rgba(0, 0, 0, 0.25)";
    if (todoItemBg) document.documentElement.style.setProperty("--todo-item-bg", todoItemBg);

    const timerbg1 = theme.timerbg1 || theme.clockbg1;
    if (timerbg1) document.documentElement.style.setProperty("--timer-bg1", timerbg1);

    const timerbg2 = theme.timerbg2 || theme.clockbg2;
    if (timerbg2) document.documentElement.style.setProperty("--timer-bg2", timerbg2);

    if (theme.navbar) document.documentElement.style.setProperty("--navbar-bg", theme.navbar);
    if (theme.text) document.documentElement.style.setProperty("--text-color", theme.text);

    const timerVisual = theme.timerVisual || theme.shadow;
    if (timerVisual) document.documentElement.style.setProperty("--timer-visual-color", timerVisual);

    const navbarText = theme.navbarText || theme.text;
    if (navbarText) document.documentElement.style.setProperty("--navbar-text-color", navbarText);

    if (theme.backgroundImage && theme.backgroundImage !== "none") {
      document.body.style.background = theme.backgroundImage;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    } else {
      document.body.style.backgroundImage = "none";
      document.body.style.background = "linear-gradient(45deg, var(--page-bg1), var(--page-bg2))";
    }

    if (savePreference) {
      try {
        localStorage.setItem(STORAGE_CURRENT_THEME, key);
      } catch (e) { }
    }

    // Sync dropdown values: active dropdown gets theme key, inactive dropdown resets to neutral state
    const selA = document.getElementById("themeSelector");
    const selB = document.getElementById("themeSelector2");
    if (selA) {
      if (selA.querySelector(`option[value="${key}"]`)) {
        selA.value = key;
      } else {
        selA.value = "";
      }
    }
    if (selB) {
      if (selB.querySelector(`option[value="${key}"]`)) {
        selB.value = key;
      } else {
        selB.value = "";
      }
    }
  }

  /********************************************************************************
   * Dropdown Management
   ********************************************************************************/
  function repopulateDropdowns() {
    const themeSelector = document.getElementById("themeSelector");
    const themeSelector2 = document.getElementById("themeSelector2");
    const groupA = getGroupA();
    const groupB = getGroupB();

    let current = localStorage.getItem(STORAGE_CURRENT_THEME);
    if (!current) {
      current = groupB.length > 0 ? groupB[0] : (groupA[0] || "default");
    }

    if (themeSelector) {
      themeSelector.innerHTML = '<option value="" disabled selected hidden>-- Select General Theme --</option>';
      groupA.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        themeSelector.appendChild(option);
      });
      if (groupA.includes(current)) {
        themeSelector.value = current;
      } else {
        themeSelector.value = "";
      }
    }

    if (themeSelector2) {
      themeSelector2.innerHTML = '<option value="" disabled selected hidden>-- Select Field Theme --</option>';
      groupB.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        themeSelector2.appendChild(option);
      });
      if (groupB.includes(current)) {
        themeSelector2.value = current;
      } else {
        themeSelector2.value = "";
      }
    }
  }

  /********************************************************************************
   * Save, Delete, and Reset Theme Operations
   ********************************************************************************/
  function saveTheme(key, themeData, group = "groupA", shouldApply = true) {
    if (!key || typeof key !== "string") return false;
    key = key.trim();
    if (!key) return false;

    const customThemes = getCustomThemesStore();
    const deletedThemes = getDeletedThemesList().filter(k => k !== key);
    setDeletedThemesList(deletedThemes); // Un-delete if previously deleted

    customThemes[key] = {
      colors: {
        shadow: themeData.shadow,
        clockbg1: themeData.clockbg1,
        clockbg2: themeData.clockbg2,
        todobg1: themeData.todobg1 || themeData.clockbg1,
        todobg2: themeData.todobg2 || themeData.clockbg2,
        todoItemBg: themeData.todoItemBg || "rgba(0, 0, 0, 0.25)",
        timerbg1: themeData.timerbg1 || themeData.clockbg1,
        timerbg2: themeData.timerbg2 || themeData.clockbg2,
        navbar: themeData.navbar,
        text: themeData.text,
        timerVisual: themeData.timerVisual || themeData.shadow,
        navbarText: themeData.navbarText || themeData.text,
      },
      backgroundImage: themeData.backgroundImage || "",
      group: group === "groupB" ? "groupB" : "groupA",
      isCustom: true,
    };

    setCustomThemesStore(customThemes);
    repopulateDropdowns();

    if (shouldApply) {
      applyThemeByKey(key, true);
    }
    return true;
  }

  function deleteTheme(key) {
    if (!key) return false;
    const customThemes = getCustomThemesStore();
    if (customThemes[key]) {
      delete customThemes[key];
      setCustomThemesStore(customThemes);
    }

    // Mark as deleted in deleted list (even if built-in)
    const deletedThemes = getDeletedThemesList();
    if (!deletedThemes.includes(key)) {
      deletedThemes.push(key);
      setDeletedThemesList(deletedThemes);
    }

    repopulateDropdowns();

    // If deleted theme was active, switch to first available theme
    const current = localStorage.getItem(STORAGE_CURRENT_THEME);
    if (current === key) {
      const master = getMasterThemes();
      const firstAvailable = Object.keys(master)[0] || "default";
      applyThemeByKey(firstAvailable, true);
    }

    return true;
  }

  function resetToDefaults() {
    try {
      localStorage.removeItem(STORAGE_CUSTOM_THEMES);
      localStorage.removeItem(STORAGE_DELETED_THEMES);
    } catch (e) { }

    repopulateDropdowns();
    applyThemeByKey("default", true);
  }

  /********************************************************************************
   * Code Generator for themes.js
   ********************************************************************************/
  function generateThemesJsCode() {
    const master = getMasterThemes();
    const colorOutput = {};
    const bgOutput = {};
    const groupBOutput = [];

    Object.keys(master).forEach(key => {
      const t = master[key];
      colorOutput[key] = {
        shadow: t.shadow || "#FFFFFF",
        clockbg1: t.clockbg1 || "#000000",
        clockbg2: t.clockbg2 || "#000000",
        todobg1: t.todobg1 || t.clockbg1 || "#000000",
        todobg2: t.todobg2 || t.clockbg2 || "#000000",
        todoItemBg: t.todoItemBg || "rgba(0, 0, 0, 0.25)",
        timerbg1: t.timerbg1 || t.clockbg1 || "#000000",
        timerbg2: t.timerbg2 || t.clockbg2 || "#000000",
        navbar: t.navbar || "#000000",
        text: t.text || "#FFFFFF",
        timerVisual: t.timerVisual || t.shadow || "#FFFFFF",
        navbarText: t.navbarText || t.text || "#FFFFFF",
      };

      if (t.backgroundImage) {
        bgOutput[key] = {
          backgroundImage: t.backgroundImage,
        };
      }

      if (t.group === "groupB") {
        groupBOutput.push(key);
      }
    });

    const codeSnippet = `/* =========================================================
 * Generated Theme Definitions for themes.js
 * ========================================================= */

const colorThemes = ${JSON.stringify(colorOutput, null, 2)};

const bgThemes = ${JSON.stringify(bgOutput, null, 2)};

const manualGroupB = ${JSON.stringify(groupBOutput, null, 2)};
`;
    return codeSnippet;
  }

  /********************************************************************************
   * Public ThemeEngine API
   ********************************************************************************/
  window.ThemeEngine = {
    getDefaultColorThemes: () => Object.assign({}, defaultColorThemes),
    getDefaultBgThemes: () => Object.assign({}, defaultBgThemes),
    getManualGroupB: () => [...defaultManualGroupB],
    getBundledImages: () => [...BUNDLED_IMAGES],
    getMasterThemes,
    getGroupA,
    getGroupB,
    applyThemeByKey,
    saveTheme,
    deleteTheme,
    resetToDefaults,
    repopulateDropdowns,
    colorToHex,
    parseColor,
    formatColor,
    generateThemesJsCode,
  };

  /********************************************************************************
   * DOM Initialization
   ********************************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
    // Hamburger Menu Toggle
    const menuToggle = document.getElementById("mobile-menu");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
      menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("nav-active");
      });
    }

    // Populate dropdown selectors
    repopulateDropdowns();

    // Wire dropdown change events
    const themeSelector = document.getElementById("themeSelector");
    const themeSelector2 = document.getElementById("themeSelector2");

    if (themeSelector) {
      themeSelector.addEventListener("change", function () {
        applyThemeByKey(this.value);
      });
    }

    if (themeSelector2) {
      themeSelector2.addEventListener("change", function () {
        applyThemeByKey(this.value);
      });
    }

    // Restore saved theme or default to the first Field Theme in Group B
    let initialTheme = null;
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_THEME);
      const master = getMasterThemes();
      if (saved && master[saved]) {
        initialTheme = saved;
      }
    } catch (e) { }

    if (!initialTheme) {
      const groupB = getGroupB();
      const master = getMasterThemes();
      if (groupB.length > 0) {
        initialTheme = groupB[0];
      } else {
        initialTheme = Object.keys(master)[0] || "default";
      }
    }

    applyThemeByKey(initialTheme, false);
  });
})();
