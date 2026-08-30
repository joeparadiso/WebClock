/********************************************************************************
 * themeStudio.js -- March 2025 -- Joe Paradiso
 * DETAILS:
 *  - Manages the Theme Studio & Theme Management System.
 *  - Handles non-live mock WebClock preview with real-time CSS variable updates.
 *  - Color pickers paired with opacity/alpha sliders (0-100%).
 *  - Image gallery selection indexing bundled images + custom URLs.
 *  - Preset cloning, theme library management (editing, applying, duplicating, deleting),
 *    and direct JavaScript code generation for themes.js.
 ********************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  // Check that ThemeEngine exists
  if (!window.ThemeEngine) {
    console.error("ThemeEngine not found. Ensure themes.js is loaded prior to themeStudio.js.");
    return;
  }

  const {
    getMasterThemes,
    getGroupA,
    getGroupB,
    applyThemeByKey,
    saveTheme,
    deleteTheme,
    resetToDefaults,
    colorToHex,
    parseColor,
    formatColor,
    generateThemesJsCode,
    getBundledImages,
  } = window.ThemeEngine;

  // DOM Elements - Modal & Navigation
  const openStudioBtn = document.getElementById("open-theme-studio-btn");
  const closeStudioBtn = document.getElementById("close-theme-studio");
  const studioModal = document.getElementById("theme-studio-modal-overlay");
  const tabButtons = document.querySelectorAll(".studio-tab-btn");
  const tabContents = document.querySelectorAll(".studio-tab-content");

  // DOM Elements - Studio & Mock Viewport
  const mockContainer = document.getElementById("mock-preview-container");
  const mockBadge = document.getElementById("mock-active-theme-badge");
  const btnPreviewLive = document.getElementById("btn-preview-live");

  // DOM Elements - Studio Controls
  const templateSelect = document.getElementById("studio-template-select");
  const themeNameInput = document.getElementById("studio-theme-name");
  const themeGroupSelect = document.getElementById("studio-theme-group");
  const btnModeImage = document.getElementById("btn-mode-image");
  const btnModeGradient = document.getElementById("btn-mode-gradient");
  const imageControlsPanel = document.getElementById("studio-image-controls");
  const gradientControlsPanel = document.getElementById("studio-gradient-controls");
  const bundledImageSelect = document.getElementById("studio-image-select");
  const customImageUrlInput = document.getElementById("studio-image-url");

  // Action Buttons
  const btnSaveTheme = document.getElementById("btn-save-theme");
  const btnQuickCopy = document.getElementById("btn-quick-copy");
  const btnResetStudio = document.getElementById("btn-reset-studio");

  // Library Elements
  const librarySearchInput = document.getElementById("library-search-input");
  const libraryFilterButtons = document.querySelectorAll(".lib-filter-btn");
  const libraryThemeGrid = document.getElementById("library-theme-grid");
  const btnLibraryNewTheme = document.getElementById("btn-library-new-theme");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");

  // Export Code Elements
  const exportCodeDisplay = document.getElementById("export-code-display");
  const btnCopyFullCode = document.getElementById("btn-copy-full-code");
  const btnDownloadThemesJs = document.getElementById("btn-download-themes-js");

  // Toast Notification
  const toastEl = document.getElementById("studio-toast");

  // Color Property Definitions for Studio
  const COLOR_PROPERTIES = [
    { key: "text", ctrlId: "ctrl-text", badgeId: "val-text", hasAlpha: false },
    { key: "shadow", ctrlId: "ctrl-shadow", badgeId: "val-shadow", hasAlpha: false },
    { key: "timerVisual", ctrlId: "ctrl-timerVisual", badgeId: "val-timerVisual", hasAlpha: false },
    { key: "navbarText", ctrlId: "ctrl-navbarText", badgeId: "val-navbarText", hasAlpha: false },
    { key: "navbar", ctrlId: "ctrl-navbar", badgeId: "val-navbar", hasAlpha: true, sliderId: "slider-navbar", alphaBadgeId: "val-navbar-alpha" },
    { key: "clockbg1", ctrlId: "ctrl-clockbg1", badgeId: "val-clockbg1", hasAlpha: true, sliderId: "slider-clockbg1", alphaBadgeId: "val-clockbg1-alpha" },
    { key: "clockbg2", ctrlId: "ctrl-clockbg2", badgeId: "val-clockbg2", hasAlpha: true, sliderId: "slider-clockbg2", alphaBadgeId: "val-clockbg2-alpha" },
    { key: "todobg1", ctrlId: "ctrl-todobg1", badgeId: "val-todobg1", hasAlpha: true, sliderId: "slider-todobg1", alphaBadgeId: "val-todobg1-alpha" },
    { key: "todobg2", ctrlId: "ctrl-todobg2", badgeId: "val-todobg2", hasAlpha: true, sliderId: "slider-todobg2", alphaBadgeId: "val-todobg2-alpha" },
    { key: "todoItemBg", ctrlId: "ctrl-todoItemBg", badgeId: "val-todoItemBg", hasAlpha: true, sliderId: "slider-todoItemBg", alphaBadgeId: "val-todoItemBg-alpha" },
    { key: "trainPillBg", ctrlId: "ctrl-trainPillBg", badgeId: "val-trainPillBg", hasAlpha: true, sliderId: "slider-trainPillBg", alphaBadgeId: "val-trainPillBg-alpha" },
    { key: "timerbg1", ctrlId: "ctrl-timerbg1", badgeId: "val-timerbg1", hasAlpha: true, sliderId: "slider-timerbg1", alphaBadgeId: "val-timerbg1-alpha" },
    { key: "timerbg2", ctrlId: "ctrl-timerbg2", badgeId: "val-timerbg2", hasAlpha: true, sliderId: "slider-timerbg2", alphaBadgeId: "val-timerbg2-alpha" },
  ];

  // Studio Draft State
  let currentDraft = {
    name: "New Custom Theme",
    group: "groupA",
    bgMode: "image",
    backgroundImage: "url('images/whisperingCottage.png')",
    colors: {
      shadow: "#F8E3AF",
      clockbg1: "rgba(45, 64, 103, 0.8)",
      clockbg2: "rgba(13, 11, 65, 0.8)",
      todobg1: "rgba(45, 64, 103, 0.8)",
      todobg2: "rgba(13, 11, 65, 0.8)",
      todoItemBg: "rgba(0, 0, 0, 0.25)",
      trainPillBg: "rgba(0, 0, 0, 0.25)",
      timerbg1: "rgba(45, 64, 103, 0.8)",
      timerbg2: "rgba(13, 11, 65, 0.8)",
      navbar: "rgba(0, 0, 0, 0.85)",
      text: "#DCC48F",
      timerVisual: "#F8E3AF",
      navbarText: "#DCC48F",
    },
  };

  let activeLibraryFilter = "all";
  let activeLibrarySearch = "";
  let isLivePreviewing = false;
  let currentBaselineThemeKey = "default";

  /********************************************************************************
   * Toast Notifications
   ********************************************************************************/
  let toastTimer = null;
  function showToast(message, type = "success") {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `studio-toast show ${type}`;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 3200);
  }

  /********************************************************************************
   * Clipboard Helper with Visual Button Feedback
   ********************************************************************************/
  function safeCopyToClipboard(text, successMsg = "📋 Copied to clipboard!", btn = null) {
    function triggerSuccess() {
      showToast(successMsg, "success");
      if (btn) {
        const originalHtml = btn.innerHTML;
        btn.classList.add("copied");
        btn.innerHTML = "✓ Copied!";
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove("copied");
        }, 1800);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        triggerSuccess();
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }

    function fallbackCopy(str) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = str;
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (success) {
          triggerSuccess();
        } else {
          showToast("Could not copy automatically. Please view in Export tab.", "error");
        }
      } catch (e) {
        showToast("Clipboard access denied.", "error");
      }
    }
  }

  /********************************************************************************
   * Tab Navigation
   ********************************************************************************/
  function switchTab(tabName) {
    tabButtons.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    tabContents.forEach(content => {
      if (content.id === `tab-content-${tabName}`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    if (tabName === "library") {
      renderThemeLibrary();
    } else if (tabName === "export") {
      renderExportCode();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      switchTab(tab);
    });
  });

  /********************************************************************************
   * Modal Open / Close Lifecycle
   ********************************************************************************/
  function openStudio(initialThemeKey = null, preserveDraft = false) {
    if (!studioModal) return;

    try {
      populateTemplateDropdown();
      populateBundledImagesDropdown();

      if (preserveDraft) {
        // Keep the user's customized colors, inputs, and background intact!
        syncControlsFromDraft();
        updateMockPreview();
      } else if (initialThemeKey) {
        loadThemeIntoStudio(initialThemeKey);
      } else {
        const master = getMasterThemes();
        const currentThemeKey = localStorage.getItem("webclock_theme_key") || Object.keys(master)[0] || "default";
        if (master[currentThemeKey]) {
          loadThemeIntoStudio(currentThemeKey);
        } else {
          syncControlsFromDraft();
          updateMockPreview();
        }
      }

      // If opening fresh (not returning from live test), collapse accordions by default
      if (!preserveDraft) {
        const accordions = studioModal.querySelectorAll(".studio-section-accordion");
        accordions.forEach(acc => {
          acc.open = false;
        });
      }

      switchTab("studio");
    } catch (err) {
      console.warn("Notice initializing studio draft:", err);
    }

    studioModal.style.display = "flex";
    studioModal.classList.add("open");
    studioModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeStudio() {
    if (!studioModal) return;
    if (isLivePreviewing) {
      stopLivePreview();
    }
    studioModal.style.display = "none";
    studioModal.classList.remove("open");
    studioModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Expose global controller for inline triggers or external access
  window.ThemeStudio = {
    openStudio,
    closeStudio,
    loadTheme: loadThemeIntoStudio,
  };

  if (openStudioBtn) {
    openStudioBtn.addEventListener("click", (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const navLinks = document.querySelector(".nav-links");
      if (navLinks) navLinks.classList.remove("nav-active");
      openStudio();
    });
  }

  if (closeStudioBtn) {
    closeStudioBtn.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      closeStudio();
    });
  }

  if (studioModal) {
    studioModal.addEventListener("click", (e) => {
      if (e.target === studioModal) {
        closeStudio();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && studioModal && studioModal.classList.contains("open")) {
      closeStudio();
    }
  });

  // Ensure opened sections scroll into view cleanly
  if (studioModal) {
    const accordions = studioModal.querySelectorAll(".studio-section-accordion");
    accordions.forEach(acc => {
      acc.addEventListener("toggle", function () {
        if (this.open) {
          setTimeout(() => {
            this.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 60);
        }
      });
    });
  }

  /********************************************************************************
   * Populate Dropdowns (Templates & Bundled Images)
   ********************************************************************************/
  function populateTemplateDropdown() {
    if (!templateSelect) return;
    const master = getMasterThemes();
    templateSelect.innerHTML = '<option value="">-- Choose existing theme as baseline --</option>';

    const groupA = getGroupA();
    const groupB = getGroupB();

    if (groupA.length > 0) {
      const optGroupA = document.createElement("optgroup");
      optGroupA.label = "General Themes";
      groupA.forEach(key => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        optGroupA.appendChild(opt);
      });
      templateSelect.appendChild(optGroupA);
    }

    if (groupB.length > 0) {
      const optGroupB = document.createElement("optgroup");
      optGroupB.label = "Field Themes";
      groupB.forEach(key => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        optGroupB.appendChild(opt);
      });
      templateSelect.appendChild(optGroupB);
    }
  }

  function populateBundledImagesDropdown() {
    if (!bundledImageSelect) return;
    const images = getBundledImages();
    bundledImageSelect.innerHTML = '<option value="">-- Select from bundled images --</option>';

    images.forEach(img => {
      const opt = document.createElement("option");
      opt.value = img.path;
      opt.textContent = img.name;
      bundledImageSelect.appendChild(opt);
    });
  }

  /********************************************************************************
   * Synchronize Studio UI Controls with currentDraft
   ********************************************************************************/
  function syncControlsFromDraft() {
    if (themeNameInput) themeNameInput.value = currentDraft.name || "";
    if (themeGroupSelect) themeGroupSelect.value = currentDraft.group || "groupA";
    if (mockBadge) mockBadge.textContent = currentDraft.name || "Draft Theme";

    // Set background mode
    if (currentDraft.bgMode === "image") {
      setBgMode("image");
      let bgUrl = currentDraft.backgroundImage || "";
      // Extract raw path or URL from url('...') format
      const match = bgUrl.match(/url\(['"]?(.*?)['"]?\)/i);
      const cleanPath = match ? match[1] : bgUrl;

      if (customImageUrlInput) customImageUrlInput.value = cleanPath;

      if (bundledImageSelect) {
        let found = false;
        for (let i = 0; i < bundledImageSelect.options.length; i++) {
          if (bundledImageSelect.options[i].value === cleanPath) {
            bundledImageSelect.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) bundledImageSelect.value = "";
      }
    } else {
      setBgMode("gradient");
    }

    // Set all color inputs & sliders
    COLOR_PROPERTIES.forEach(prop => {
      const rawVal = currentDraft.colors[prop.key] || "#000000";
      const { hex, alpha } = parseColor(rawVal);

      const colorInput = document.getElementById(prop.ctrlId);
      if (colorInput) {
        colorInput.value = hex;
      }

      const hexBadge = document.getElementById(prop.badgeId);
      if (hexBadge) {
        hexBadge.textContent = hex.toUpperCase();
      }

      if (prop.hasAlpha) {
        const slider = document.getElementById(prop.sliderId);
        if (slider) {
          slider.value = alpha;
        }
        const alphaBadge = document.getElementById(prop.alphaBadgeId);
        if (alphaBadge) {
          alphaBadge.textContent = `${Math.round(alpha * 100)}%`;
        }
      }
    });
  }

  /********************************************************************************
   * Update Non-Live Mock WebClock Preview
   ********************************************************************************/
  function updateMockPreview() {
    if (!mockContainer) return;

    // Apply scoped CSS variables to the mock preview container
    mockContainer.style.setProperty("--mock-text-color", currentDraft.colors.text || "#DCC48F");
    mockContainer.style.setProperty("--mock-box-shadow-color", currentDraft.colors.shadow || "#F8E3AF");
    mockContainer.style.setProperty("--mock-timer-visual-color", currentDraft.colors.timerVisual || currentDraft.colors.shadow || "#F8E3AF");
    mockContainer.style.setProperty("--mock-navbar-text-color", currentDraft.colors.navbarText || currentDraft.colors.text || "#DCC48F");
    mockContainer.style.setProperty("--mock-navbar-bg", currentDraft.colors.navbar || "#000000e6");
    mockContainer.style.setProperty("--mock-clock-bg1", currentDraft.colors.clockbg1 || "#2D4067");
    mockContainer.style.setProperty("--mock-clock-bg2", currentDraft.colors.clockbg2 || "#0D0B41");
    mockContainer.style.setProperty("--mock-todo-bg1", currentDraft.colors.todobg1 || currentDraft.colors.clockbg1 || "#2D4067");
    mockContainer.style.setProperty("--mock-todo-bg2", currentDraft.colors.todobg2 || currentDraft.colors.clockbg2 || "#0D0B41");
    mockContainer.style.setProperty("--mock-todo-item-bg", currentDraft.colors.todoItemBg || "rgba(0, 0, 0, 0.25)");
    mockContainer.style.setProperty("--mock-train-pill-bg", currentDraft.colors.trainPillBg || "rgba(0, 0, 0, 0.25)");
    mockContainer.style.setProperty("--mock-timer-bg1", currentDraft.colors.timerbg1 || currentDraft.colors.clockbg1 || "#08001F");
    mockContainer.style.setProperty("--mock-timer-bg2", currentDraft.colors.timerbg2 || currentDraft.colors.clockbg2 || "#1C52B8");

    // Background Image
    if (currentDraft.backgroundImage && currentDraft.backgroundImage !== "none") {
      mockContainer.style.backgroundImage = currentDraft.backgroundImage.startsWith("url")
        ? currentDraft.backgroundImage
        : `url('${currentDraft.backgroundImage}')`;
      mockContainer.style.backgroundSize = "cover";
      mockContainer.style.backgroundPosition = "center";
    } else {
      mockContainer.style.backgroundImage = "none";
      mockContainer.style.background = "#0b0f19";
    }

    if (mockBadge) {
      mockBadge.textContent = currentDraft.name || "Draft Theme";
    }

    // If live testing is active, mirror changes to live DOM as well
    if (isLivePreviewing) {
      applyDraftToLiveDOM();
    }
  }

  /********************************************************************************
   * Background Mode Switcher (Image vs Gradient)
   ********************************************************************************/
  function setBgMode(mode, preserveExistingImage = false) {
    currentDraft.bgMode = mode;
    if (mode === "image") {
      if (btnModeImage) btnModeImage.classList.add("active");
      if (btnModeGradient) btnModeGradient.classList.remove("active");
      if (imageControlsPanel) imageControlsPanel.style.display = "block";
      if (gradientControlsPanel) gradientControlsPanel.style.display = "none";

      if (!preserveExistingImage && !currentDraft.backgroundImage) {
        const val = customImageUrlInput ? customImageUrlInput.value.trim() : "";
        if (val) {
          currentDraft.backgroundImage = val.startsWith("url") ? val : `url('${val}')`;
        }
      }
    } else {
      if (btnModeImage) btnModeImage.classList.remove("active");
      if (btnModeGradient) btnModeGradient.classList.add("active");
      if (imageControlsPanel) imageControlsPanel.style.display = "none";
      if (gradientControlsPanel) gradientControlsPanel.style.display = "block";

      currentDraft.backgroundImage = "";
    }
    updateMockPreview();
  }

  if (btnModeImage) {
    btnModeImage.addEventListener("click", () => setBgMode("image", false));
  }

  if (btnModeGradient) {
    btnModeGradient.addEventListener("click", () => setBgMode("gradient", false));
  }

  if (bundledImageSelect) {
    bundledImageSelect.addEventListener("change", function () {
      if (this.value) {
        if (customImageUrlInput) customImageUrlInput.value = this.value;
        currentDraft.backgroundImage = `url('${this.value}')`;
        currentDraft.exportedImagePath = this.value;
        setBgMode("image", true);
        showToast(`Selected bundled image: "${this.value}"`, "info");
      }
    });
  }

  if (customImageUrlInput) {
    customImageUrlInput.addEventListener("input", function () {
      const val = this.value.trim();
      if (val) {
        currentDraft.backgroundImage = val.startsWith("url") ? val : `url('${val}')`;
        currentDraft.exportedImagePath = val;
        setBgMode("image", true);
      } else {
        currentDraft.backgroundImage = "";
        currentDraft.exportedImagePath = "";
        updateMockPreview();
      }
    });
  }

  // Local Image File Chooser (Instant Preview from Desktop/Computer & Path Generator)
  const btnBrowseImage = document.getElementById("btn-browse-image");
  const studioImageFileInput = document.getElementById("studio-image-file");

  if (btnBrowseImage && studioImageFileInput) {
    btnBrowseImage.addEventListener("click", () => {
      studioImageFileInput.click();
    });

    studioImageFileInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      if (!file) return;

      const relativePath = `images/${file.name}`;
      if (customImageUrlInput) {
        customImageUrlInput.value = relativePath;
      }
      currentDraft.exportedImagePath = relativePath;

      // Automatically suggest a clean theme name if current is default or blank
      const cleanBaseName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      if (themeNameInput && (!themeNameInput.value || themeNameInput.value === "New Theme" || themeNameInput.value === "New Custom Theme")) {
        themeNameInput.value = cleanBaseName;
        currentDraft.name = cleanBaseName;
        if (mockBadge) mockBadge.textContent = cleanBaseName;
      }

      // Read as Data URL for instant live rendering in Mock Viewport & Live Test
      const reader = new FileReader();
      reader.onload = function (e) {
        currentDraft.backgroundImage = `url('${e.target.result}')`;
        setBgMode("image", true);
        showToast(`🖼️ Local image "${file.name}" loaded for preview! Target path: "${relativePath}"`, "success");
      };
      reader.readAsDataURL(file);
    });
  }

  /********************************************************************************
   * Wire Event Listeners to Color Pickers & Sliders
   ********************************************************************************/
  COLOR_PROPERTIES.forEach(prop => {
    const picker = document.getElementById(prop.ctrlId);
    const hexBadge = document.getElementById(prop.badgeId);
    const slider = prop.hasAlpha ? document.getElementById(prop.sliderId) : null;
    const alphaBadge = prop.hasAlpha ? document.getElementById(prop.alphaBadgeId) : null;

    if (picker) {
      picker.addEventListener("input", function () {
        const hex = this.value;
        if (hexBadge) hexBadge.textContent = hex.toUpperCase();

        const alpha = slider ? parseFloat(slider.value) : 1.0;
        currentDraft.colors[prop.key] = formatColor(hex, alpha);
        updateMockPreview();
      });
    }

    if (slider) {
      slider.addEventListener("input", function () {
        const alpha = parseFloat(this.value);
        if (alphaBadge) alphaBadge.textContent = `${Math.round(alpha * 100)}%`;

        const hex = picker ? picker.value : "#000000";
        currentDraft.colors[prop.key] = formatColor(hex, alpha);
        updateMockPreview();
      });
    }
  });

  if (themeNameInput) {
    themeNameInput.addEventListener("input", function () {
      currentDraft.name = this.value.trim();
      if (mockBadge) mockBadge.textContent = currentDraft.name || "Draft Theme";
    });
  }

  if (themeGroupSelect) {
    themeGroupSelect.addEventListener("change", function () {
      currentDraft.group = this.value;
    });
  }

  /********************************************************************************
   * Template Cloner / Loader
   ********************************************************************************/
  function loadThemeIntoStudio(themeKey) {
    const master = getMasterThemes();
    const theme = master[themeKey];
    if (!theme) return;

    currentBaselineThemeKey = themeKey;
    currentDraft.name = themeKey;
    currentDraft.group = theme.group || "groupA";

    if (theme.backgroundImage && theme.backgroundImage !== "none") {
      currentDraft.bgMode = "image";
      currentDraft.backgroundImage = theme.backgroundImage;
    } else {
      currentDraft.bgMode = "gradient";
      currentDraft.backgroundImage = "";
    }

    currentDraft.colors = {
      shadow: theme.shadow || "#FFFFFF",
      clockbg1: theme.clockbg1 || "#000000",
      clockbg2: theme.clockbg2 || "#000000",
      todobg1: theme.todobg1 || theme.clockbg1 || "#000000",
      todobg2: theme.todobg2 || theme.clockbg2 || "#000000",
      todoItemBg: theme.todoItemBg || "rgba(0, 0, 0, 0.25)",
      trainPillBg: theme.trainPillBg || "rgba(0, 0, 0, 0.25)",
      timerbg1: theme.timerbg1 || theme.clockbg1 || "#000000",
      timerbg2: theme.timerbg2 || theme.clockbg2 || "#000000",
      pagebg1: theme.pagebg1 || "#000000",
      pagebg2: theme.pagebg2 || "#000000",
      navbar: theme.navbar || "#000000",
      text: theme.text || "#FFFFFF",
      input: theme.input || "#FFFFFF",
      timerVisual: theme.timerVisual || theme.shadow || "#FFFFFF",
      navbarText: theme.navbarText || theme.text || "#FFFFFF",
    };

    syncControlsFromDraft();
    updateMockPreview();

    if (templateSelect) {
      templateSelect.value = themeKey;
    }
  }

  if (templateSelect) {
    templateSelect.addEventListener("change", function () {
      if (this.value) {
        loadThemeIntoStudio(this.value);
        showToast(`Loaded template: "${this.value}"`, "info");
      }
    });
  }

  // Floating Live Test Bar Elements
  const liveTestBar = document.getElementById("studio-live-test-bar");
  const liveTestThemeName = document.getElementById("live-test-theme-name");
  const btnLiveReopen = document.getElementById("btn-live-test-reopen");
  const btnLiveCopy = document.getElementById("btn-live-test-copy");
  const btnLiveSave = document.getElementById("btn-live-test-save");
  const btnLiveStop = document.getElementById("btn-live-test-stop");

  /********************************************************************************
   * Live Preview Feature (Option 1: Minimize to Floating Live Test Bar)
   ********************************************************************************/
  function applyDraftToLiveDOM() {
    const c = currentDraft.colors;
    if (c.shadow) document.documentElement.style.setProperty("--box-shadow-color", c.shadow);
    if (c.clockbg1) document.documentElement.style.setProperty("--clock-bg1", c.clockbg1);
    if (c.clockbg2) document.documentElement.style.setProperty("--clock-bg2", c.clockbg2);

    const todobg1 = c.todobg1 || c.clockbg1;
    if (todobg1) document.documentElement.style.setProperty("--todo-bg1", todobg1);

    const todobg2 = c.todobg2 || c.clockbg2;
    if (todobg2) document.documentElement.style.setProperty("--todo-bg2", todobg2);

    const todoItemBg = c.todoItemBg || "rgba(0, 0, 0, 0.25)";
    if (todoItemBg) document.documentElement.style.setProperty("--todo-item-bg", todoItemBg);

    const trainPillBg = c.trainPillBg || "rgba(0, 0, 0, 0.25)";
    if (trainPillBg) document.documentElement.style.setProperty("--train-pill-bg", trainPillBg);

    if (c.timerbg1) document.documentElement.style.setProperty("--timer-bg1", c.timerbg1);
    if (c.timerbg2) document.documentElement.style.setProperty("--timer-bg2", c.timerbg2);
    if (c.navbar) document.documentElement.style.setProperty("--navbar-bg", c.navbar);
    if (c.text) document.documentElement.style.setProperty("--text-color", c.text);

    const timerVisual = c.timerVisual || c.shadow;
    if (timerVisual) document.documentElement.style.setProperty("--timer-visual-color", timerVisual);

    const navbarText = c.navbarText || c.text;
    if (navbarText) document.documentElement.style.setProperty("--navbar-text-color", navbarText);

    if (currentDraft.backgroundImage && currentDraft.backgroundImage !== "none") {
      document.body.style.background = currentDraft.backgroundImage;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    } else {
      document.body.style.backgroundImage = "none";
      document.body.style.background = "#0b0f19";
    }
  }

  function startLivePreview() {
    isLivePreviewing = true;
    applyDraftToLiveDOM();

    // 1. Update theme name on floating test bar
    if (liveTestThemeName) {
      liveTestThemeName.textContent = currentDraft.name || "Draft Theme";
    }

    // 2. Hide Theme Studio modal so the user gets 100% full view of live WebClock
    if (studioModal) {
      studioModal.style.display = "none";
      studioModal.classList.remove("open");
      studioModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // 3. Show sleek floating test bar at the bottom
    if (liveTestBar) {
      liveTestBar.classList.add("active");
    }

    showToast("👁️ Live Test active: Now viewing your full dashboard live!", "info");
  }

  function stopLivePreview(suppressToast = false) {
    isLivePreviewing = false;

    // Hide floating test bar
    if (liveTestBar) {
      liveTestBar.classList.remove("active");
    }

    // Reapply saved active theme
    const activeKey = localStorage.getItem("webclock_theme_key") || "default";
    applyThemeByKey(activeKey, false);

    if (!suppressToast) {
      showToast("Live Test stopped: Restored previous theme", "info");
    }
  }

  if (btnPreviewLive) {
    btnPreviewLive.addEventListener("click", () => {
      startLivePreview();
    });
  }

  // Floating Live Test Bar Actions
  if (btnLiveReopen) {
    btnLiveReopen.addEventListener("click", () => {
      if (liveTestBar) liveTestBar.classList.remove("active");
      openStudio(null, true);
    });
  }

  if (btnLiveCopy) {
    btnLiveCopy.addEventListener("click", () => {
      const code = getSingleThemeSnippet();
      safeCopyToClipboard(code, "📋 Theme JavaScript copied to clipboard!", btnLiveCopy);
    });
  }

  if (btnLiveSave) {
    btnLiveSave.addEventListener("click", () => {
      if (liveTestBar) liveTestBar.classList.remove("active");
      isLivePreviewing = false;
      handleSaveTheme();
    });
  }

  if (btnLiveStop) {
    btnLiveStop.addEventListener("click", () => {
      stopLivePreview(false);
    });
  }

  /********************************************************************************
   * Save / Import Theme Action
   ********************************************************************************/
  function handleSaveTheme() {
    const name = themeNameInput ? themeNameInput.value.trim() : "";
    if (!name) {
      showToast("Please enter a name for the theme.", "error");
      if (themeNameInput) themeNameInput.focus();
      return;
    }

    let bgImage = "";
    if (currentDraft.bgMode === "image") {
      bgImage = currentDraft.backgroundImage || "";
    }

    const themeData = {
      ...currentDraft.colors,
      backgroundImage: bgImage,
    };

    const group = themeGroupSelect ? themeGroupSelect.value : (currentDraft.group || "groupA");

    const success = saveTheme(name, themeData, group, true);
    if (success) {
      if (isLivePreviewing) stopLivePreview(true);
      populateTemplateDropdown();
      showToast(`✨ Theme "${name}" imported and applied!`, "success");
      // Close studio after a brief moment so user sees the live WebClock updated
      setTimeout(() => {
        closeStudio();
      }, 400);
    } else {
      showToast("Could not save theme. Please check your inputs.", "error");
    }
  }

  if (btnSaveTheme) {
    btnSaveTheme.addEventListener("click", handleSaveTheme);
  }

  /********************************************************************************
   * Quick Copy Snippet
   ********************************************************************************/
  function getSingleThemeSnippet() {
    const name = themeNameInput ? themeNameInput.value.trim() || "My Custom Theme" : "My Custom Theme";
    const c = currentDraft.colors;

    const timerVisual = c.timerVisual || c.shadow || "#FFFFFF";
    const navbarText = c.navbarText || c.text || "#FFFFFF";

    let snippet = `// 1. Paste into 'const colorThemes = { ... }' in themes.js:\n`;
    snippet += `  "${name}": {\n`;
    snippet += `    shadow: "${c.shadow || '#FFFFFF'}",\n`;
    snippet += `    clockbg1: "${c.clockbg1 || '#000000'}",\n`;
    snippet += `    clockbg2: "${c.clockbg2 || '#000000'}",\n`;
    snippet += `    todobg1: "${c.todobg1 || c.clockbg1 || '#000000'}",\n`;
    snippet += `    todobg2: "${c.todobg2 || c.clockbg2 || '#000000'}",\n`;
    snippet += `    todoItemBg: "${c.todoItemBg || 'rgba(0, 0, 0, 0.25)'}",\n`;
    snippet += `    trainPillBg: "${c.trainPillBg || 'rgba(0, 0, 0, 0.25)'}",\n`;
    snippet += `    timerbg1: "${c.timerbg1 || c.clockbg1 || '#000000'}",\n`;
    snippet += `    timerbg2: "${c.timerbg2 || c.clockbg2 || '#000000'}",\n`;
    snippet += `    navbar: "${c.navbar || '#000000'}",\n`;
    snippet += `    text: "${c.text || '#FFFFFF'}",\n`;
    snippet += `    timerVisual: "${timerVisual}",\n`;
    snippet += `    navbarText: "${navbarText}",\n`;
    snippet += `  },\n\n`;

    if (currentDraft.bgMode === "image") {
      let bgUrl = currentDraft.exportedImagePath || "";
      if (!bgUrl) {
        const customVal = customImageUrlInput ? customImageUrlInput.value.trim() : "";
        if (customVal && !customVal.startsWith("data:")) {
          bgUrl = customVal;
        } else if (currentDraft.backgroundImage && !currentDraft.backgroundImage.includes("data:")) {
          bgUrl = currentDraft.backgroundImage;
        }
      }
      if (bgUrl) {
        const formattedUrl = bgUrl.startsWith("url") ? bgUrl : `url('${bgUrl}')`;
        snippet += `// 2. Paste into 'const bgThemes = { ... }' in themes.js:\n`;
        snippet += `  "${name}": {\n`;
        snippet += `    backgroundImage: "${formattedUrl}",\n`;
        snippet += `  },\n\n`;
      }
    }

    if (currentDraft.group === "groupB" || (themeGroupSelect && themeGroupSelect.value === "groupB")) {
      snippet += `// 3. Paste into 'const defaultManualGroupB = [ ... ]' in themes.js:\n`;
      snippet += `  "${name}",\n`;
    }

    return snippet;
  }

  if (btnQuickCopy) {
    btnQuickCopy.addEventListener("click", () => {
      const code = getSingleThemeSnippet();
      safeCopyToClipboard(code, "📋 Theme JS snippet copied to clipboard!", btnQuickCopy);
    });
  }

  if (btnResetStudio) {
    btnResetStudio.addEventListener("click", () => {
      const master = getMasterThemes();
      let targetKey = currentBaselineThemeKey;
      if (!targetKey || !master[targetKey]) {
        targetKey = (templateSelect && templateSelect.value) || localStorage.getItem("webclock_theme_key") || "default";
      }
      if (confirm(`Reset current draft back to "${targetKey}" theme baseline?`)) {
        loadThemeIntoStudio(targetKey);
        showToast(`Draft reset back to "${targetKey}" colors`, "info");
      }
    });
  }

  /********************************************************************************
   * TAB 2: Theme Library & Management
   ********************************************************************************/
  function renderThemeLibrary() {
    if (!libraryThemeGrid) return;
    const master = getMasterThemes();
    const activeKey = localStorage.getItem("webclock_theme_key") || "default";

    libraryThemeGrid.innerHTML = "";

    const keys = Object.keys(master).filter(k => {
      const theme = master[k];
      // Filter by category
      if (activeLibraryFilter === "groupA" && theme.group !== "groupA") return false;
      if (activeLibraryFilter === "groupB" && theme.group !== "groupB") return false;
      if (activeLibraryFilter === "custom" && !theme.isCustom) return false;

      // Filter by search query
      if (activeLibrarySearch && !k.toLowerCase().includes(activeLibrarySearch.toLowerCase())) {
        return false;
      }
      return true;
    });

    if (keys.length === 0) {
      libraryThemeGrid.innerHTML = `
        <div class="library-empty-state">
          <p>No themes found matching your filter.</p>
        </div>
      `;
      return;
    }

    keys.forEach(key => {
      const theme = master[key];
      const card = document.createElement("div");
      card.className = `library-card ${key === activeKey ? "active-theme-card" : ""}`;

      const groupLabel = theme.group === "groupB" ? "Field Theme" : "General Theme";
      const customTag = theme.isCustom ? '<span class="tag-custom">Custom</span>' : '<span class="tag-builtin">Built-in</span>';
      const activeTag = key === activeKey ? '<span class="tag-active">Active</span>' : "";

      // Background preview thumbnail style
      let bgStyle = "";
      if (theme.backgroundImage && theme.backgroundImage !== "none") {
        bgStyle = `background-image: ${theme.backgroundImage.startsWith("url") ? theme.backgroundImage : `url('${theme.backgroundImage}')`}; background-size: cover; background-position: center;`;
      } else {
        bgStyle = `background: linear-gradient(45deg, ${theme.pagebg1 || "#000"}, ${theme.pagebg2 || "#333"});`;
      }

      card.innerHTML = `
        <div class="card-top-preview" style="${bgStyle}">
          <div class="card-tags">
            <span class="tag-group">${groupLabel}</span>
            ${customTag}
            ${activeTag}
          </div>
          <div class="card-preview-clock" style="color: ${theme.text || "#fff"}; text-shadow: 0 0 8px ${theme.shadow || "#000"};">
            10:42
          </div>
        </div>
        <div class="card-content">
          <h4 class="card-title">${key}</h4>
          
          <div class="card-palette-strip" title="Palette: Shadow, Clock, Text, Timer, Button, Navbar">
            <span class="swatch" style="background: ${theme.shadow || "#000"};" title="Shadow"></span>
            <span class="swatch" style="background: ${theme.clockbg1 || "#000"};" title="Clock Bg"></span>
            <span class="swatch" style="background: ${theme.text || "#fff"};" title="Text"></span>
            <span class="swatch" style="background: ${theme.timerbg1 || "#000"};" title="Timer Bg"></span>
            <span class="swatch" style="background: ${theme.buttonbg1 || "#000"};" title="Button Bg"></span>
            <span class="swatch" style="background: ${theme.navbar || "#000"};" title="Navbar Bg"></span>
          </div>

          <div class="card-actions">
            <button type="button" class="btn-card-action btn-edit-theme" data-theme="${key}" title="Edit in Studio">
              ✎ Edit
            </button>
            <button type="button" class="btn-card-action btn-apply-theme" data-theme="${key}" title="Apply this theme">
              ✓ Apply
            </button>
            <button type="button" class="btn-card-action btn-duplicate-theme" data-theme="${key}" title="Duplicate / Clone">
              ⎘ Clone
            </button>
            <button type="button" class="btn-card-action btn-delete-theme" data-theme="${key}" title="Delete theme">
              🗑
            </button>
          </div>
        </div>
      `;

      libraryThemeGrid.appendChild(card);
    });

    // Attach card event listeners
    libraryThemeGrid.querySelectorAll(".btn-edit-theme").forEach(btn => {
      btn.addEventListener("click", () => {
        const themeKey = btn.getAttribute("data-theme");
        loadThemeIntoStudio(themeKey);
        switchTab("studio");
        showToast(`Loaded "${themeKey}" into Studio for editing`, "info");
      });
    });

    libraryThemeGrid.querySelectorAll(".btn-apply-theme").forEach(btn => {
      btn.addEventListener("click", () => {
        const themeKey = btn.getAttribute("data-theme");
        applyThemeByKey(themeKey, true);
        renderThemeLibrary();
        showToast(`✓ Applied theme: "${themeKey}"`, "success");
      });
    });

    libraryThemeGrid.querySelectorAll(".btn-duplicate-theme").forEach(btn => {
      btn.addEventListener("click", () => {
        const themeKey = btn.getAttribute("data-theme");
        loadThemeIntoStudio(themeKey);
        if (themeNameInput) {
          themeNameInput.value = `${themeKey} Copy`;
          currentDraft.name = `${themeKey} Copy`;
        }
        switchTab("studio");
        showToast(`Cloned "${themeKey}". Rename and save when ready.`, "info");
      });
    });

    libraryThemeGrid.querySelectorAll(".btn-delete-theme").forEach(btn => {
      btn.addEventListener("click", () => {
        const themeKey = btn.getAttribute("data-theme");
        if (confirm(`Are you sure you want to delete the theme "${themeKey}"?`)) {
          deleteTheme(themeKey);
          populateTemplateDropdown();
          renderThemeLibrary();
          showToast(`Deleted theme "${themeKey}"`, "info");
        }
      });
    });
  }

  // Filter Buttons in Library
  libraryFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      libraryFilterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeLibraryFilter = btn.getAttribute("data-filter");
      renderThemeLibrary();
    });
  });

  if (librarySearchInput) {
    librarySearchInput.addEventListener("input", function () {
      activeLibrarySearch = this.value.trim();
      renderThemeLibrary();
    });
  }

  if (btnLibraryNewTheme) {
    btnLibraryNewTheme.addEventListener("click", () => {
      loadThemeIntoStudio("default");
      if (themeNameInput) {
        themeNameInput.value = "New Theme";
        currentDraft.name = "New Theme";
      }
      switchTab("studio");
    });
  }

  if (btnResetDefaults) {
    btnResetDefaults.addEventListener("click", () => {
      if (confirm("Restore all original built-in themes and clear custom/deleted themes?")) {
        resetToDefaults();
        populateTemplateDropdown();
        renderThemeLibrary();
        showToast("Restored all built-in themes to default", "success");
      }
    });
  }

  /********************************************************************************
   * TAB 3: Export Code Generator
   ********************************************************************************/
  function renderExportCode() {
    if (!exportCodeDisplay) return;
    const code = generateThemesJsCode();
    exportCodeDisplay.textContent = code;
  }

  if (btnCopyFullCode) {
    btnCopyFullCode.addEventListener("click", () => {
      const code = generateThemesJsCode();
      safeCopyToClipboard(code, "📋 All themes JavaScript code copied to clipboard!", btnCopyFullCode);
    });
  }

  if (btnDownloadThemesJs) {
    btnDownloadThemesJs.addEventListener("click", () => {
      const code = generateThemesJsCode();
      const blob = new Blob([code], { type: "text/javascript;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "themes_generated.js";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("💾 themes_generated.js downloaded!", "success");
    });
  }
});
