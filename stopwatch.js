/********************************************************************************
 * stopwatch.js -- WebClock Circular Stopwatch Timer Engine (Variation 1A)
 * DETAILS:
 *  - Implements the "Create Timer" circular stopwatch card (Variation 1A:
 *    Liquid-Glass Smooth Ribbon Rings with zero radial tick marks).
 *  - Features two concentric smooth ribbon rings inside recessed dark-glass
 *    grooves:
 *      1. Outer 60-second sweep ribbon with an orbiting glowing comet orb.
 *      2. Inner 60-minute continuous progress ribbon with a leading micro-dot cap.
 *  - High-precision timestamp delta math (Date.now() + requestAnimationFrame)
 *    ensures 60 FPS smooth ring animation and accurate timekeeping across
 *    tab switches and page reloads.
 *  - Lap timer badge and lap splits list remain hidden by default and only
 *    appear once the user clicks the "Lap" button at least once.
 *  - Inherits colors automatically from the active theme and supports custom
 *    overrides via Theme Studio.
 ********************************************************************************/

(function () {
  "use strict";

  const STORAGE_KEY = "webclock_stopwatch_timers";

  // Enlarged SVG 3-Ring Geometry (viewBox 0 0 320 320, center = 160, 160)
  // 1. Outer Ring (1-Minute / 60s): r = 143
  // 2. Middle Ring (10-Minute): r = 123
  // 3. Inner Ring (60-Minute): r = 104
  // 4. Center Frosted Core: r = 88 (176px diameter) keeps all text well inside!
  const CENTER = 160;
  const R_OUTER = 143;
  const R_MIDDLE = 123;
  const R_INNER = 104;
  const R_CORE = 88;
  const R_CARDINAL_OUTER = 133;
  const R_CARDINAL_INNER = 113.5;
  const CIRC_OUTER = 2 * Math.PI * R_OUTER;   // ~898.50
  const CIRC_MIDDLE = 2 * Math.PI * R_MIDDLE; // ~772.83
  const CIRC_INNER = 2 * Math.PI * R_INNER;   // ~653.45

  const CARD_DEFAULT_WIDTH = 450;
  const CARD_GAP = 16;

  let stopwatches = [];
  let rafId = null;
  let editingTitleId = null;

  // DOM Elements
  let stopwatchGrid = null;
  let openStopwatchBtn = null;

  /********************************************************************************
   * HTML Escaping Helper
   ********************************************************************************/
  function escapeHtml(str) {
    if (!str) return "Stopwatch";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /********************************************************************************
   * LocalStorage Persistence
   ********************************************************************************/
  function loadStopwatches() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          stopwatches = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load stopwatches from localStorage:", e);
      stopwatches = [];
    }
  }

  function saveStopwatches() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stopwatches));
    } catch (e) {
      console.warn("Could not save stopwatches to localStorage:", e);
    }
  }

  /********************************************************************************
   * Time Calculation & Formatting
   ********************************************************************************/
  function getElapsedMs(sw, now = Date.now()) {
    if (!sw) return 0;
    const base = sw.accumulatedMs || 0;
    if (sw.isRunning && sw.lastStartTimestamp) {
      return base + Math.max(0, now - sw.lastStartTimestamp);
    }
    return base;
  }

  function formatMainReadout(ms) {
    const totalCs = Math.floor(Math.max(0, ms) / 10);
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const sec = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const min = totalMin % 60;
    const hrs = Math.floor(totalMin / 60);

    const pad = n => String(n).padStart(2, "0");
    const main = hrs > 0 ? `${pad(hrs)}:${pad(min)}:${pad(sec)}` : `${pad(min)}:${pad(sec)}`;
    return {
      main,
      cs: `.${pad(cs)}`,
      isHours: hrs > 0
    };
  }

  function formatLapDuration(ms) {
    const { main, cs } = formatMainReadout(ms);
    return `${main}${cs}`;
  }

  /********************************************************************************
   * Default Positioning (Left/Right of Main Clock)
   ********************************************************************************/
  function calculateDefaultPositions(unmovedList) {
    const clockEl = document.querySelector(".clock");
    const positions = [];
    let currentTop = 75;
    let left = 24;

    if (clockEl) {
      const clockRect = clockEl.getBoundingClientRect();
      // Place on the left side below To-Do if visible, or to the right of the clock
      const rightCandidate = clockRect.right + 24;
      const leftCandidate = clockRect.left - CARD_DEFAULT_WIDTH - 24;

      if (leftCandidate >= 10) {
        left = leftCandidate;
        const todoEl = document.getElementById("todo-container");
        if (todoEl && todoEl.style.display !== "none") {
          const todoRect = todoEl.getBoundingClientRect();
          currentTop = Math.max(clockRect.top, todoRect.bottom + CARD_GAP);
        } else {
          currentTop = clockRect.top;
        }
      } else {
        left = Math.max(10, Math.min(rightCandidate, window.innerWidth - CARD_DEFAULT_WIDTH - 10));
        currentTop = clockRect.top;
      }
    }

    unmovedList.forEach(sw => {
      const hasLaps = Array.isArray(sw.laps) && sw.laps.length > 0;
      const h = sw.collapsed ? 48 : (hasLaps ? 490 : 400);
      const clampedTop = Math.max(52, Math.min(currentTop, Math.max(52, window.innerHeight - h - 12)));
      positions.push({ left, top: clampedTop });
      currentTop += h + CARD_GAP;
    });

    return positions;
  }

  function updateDefaultPositions() {
    if (!stopwatchGrid || stopwatches.length === 0) return;
    const unmoved = stopwatches.filter(s => !s.position || typeof s.position.left !== "number");
    const defaultPositions = calculateDefaultPositions(unmoved);
    let idx = 0;

    stopwatches.forEach(sw => {
      const card = stopwatchGrid.querySelector(`.stopwatch-card[data-id="${sw.id}"]`);
      if (!card) return;

      if (sw.position && typeof sw.position.left === "number") {
        const rect = card.getBoundingClientRect();
        const maxLeft = Math.max(10, window.innerWidth - (rect.width || CARD_DEFAULT_WIDTH) - 10);
        const maxTop = Math.max(50, window.innerHeight - (rect.height || 60) - 10);
        sw.position.left = Math.max(10, Math.min(sw.position.left, maxLeft));
        sw.position.top = Math.max(48, Math.min(sw.position.top, maxTop));
        card.style.left = `${sw.position.left}px`;
        card.style.top = `${sw.position.top}px`;
      } else {
        const pos = defaultPositions[idx];
        if (pos) {
          card.style.left = `${pos.left}px`;
          card.style.top = `${pos.top}px`;
        }
        idx++;
      }
    });
  }

  /********************************************************************************
   * Ring & Comet Math Updater (60 FPS for Running Stopwatches)
   ********************************************************************************/
  function computeRingState(sw, now = Date.now()) {
    const totalMs = getElapsedMs(sw, now);
    const readouts = formatMainReadout(totalMs);

    // 1. Outer Ring: 1-minute (60-second) continuous smooth sweep (0 to 1 every 60,000 ms)
    const outerFraction = (totalMs % 60000) / 60000;
    const outerOffset = CIRC_OUTER * (1 - outerFraction);

    // Comet Head coordinates on Outer Ring (angle -90deg at top)
    const outerAngle = outerFraction * 2 * Math.PI - Math.PI / 2;
    const cometX = (CENTER + R_OUTER * Math.cos(outerAngle)).toFixed(2);
    const cometY = (CENTER + R_OUTER * Math.sin(outerAngle)).toFixed(2);

    // 2. Middle Ring: 10-minute continuous smooth sweep (0 to 1 every 600,000 ms = 10 mins)
    const middleFraction = totalMs > 0 ? (totalMs % 600000) / 600000 : 0;
    const middleOffset = CIRC_MIDDLE * (1 - middleFraction);
    const middleAngle = middleFraction * 2 * Math.PI - Math.PI / 2;
    const middleCapX = (CENTER + R_MIDDLE * Math.cos(middleAngle)).toFixed(2);
    const middleCapY = (CENTER + R_MIDDLE * Math.sin(middleAngle)).toFixed(2);

    // 3. Inner Ring: 60-minute continuous smooth sweep (0 to 1 every 3,600,000 ms = 60 mins)
    const innerFraction = totalMs > 0 ? (totalMs % 3600000) / 3600000 : 0;
    const innerOffset = CIRC_INNER * (1 - innerFraction);
    const innerAngle = innerFraction * 2 * Math.PI - Math.PI / 2;
    const innerCapX = (CENTER + R_INNER * Math.cos(innerAngle)).toFixed(2);
    const innerCapY = (CENTER + R_INNER * Math.sin(innerAngle)).toFixed(2);

    // 4. Lap State (Only shown if at least 1 lap has been recorded)
    const laps = Array.isArray(sw.laps) ? sw.laps : [];
    const hasLaps = laps.length > 0;
    const lastLapTotalMs = hasLaps ? laps[0].totalMs : 0;
    const currentLapMs = Math.max(0, totalMs - lastLapTotalMs);
    const currentLapNumber = laps.length + 1;
    const currentLapText = `LAP ${currentLapNumber} • +${formatLapDuration(currentLapMs)}`;

    return {
      totalMs,
      readouts,
      outerFraction,
      outerOffset,
      cometX,
      cometY,
      middleFraction,
      middleOffset,
      middleCapX,
      middleCapY,
      innerFraction,
      innerOffset,
      innerCapX,
      innerCapY,
      hasLaps,
      currentLapText
    };
  }

  function updateRunningCardsFrame() {
    if (!stopwatchGrid) return;
    const now = Date.now();
    let anyRunning = false;

    stopwatches.forEach(sw => {
      if (!sw.isRunning) return;
      anyRunning = true;

      const card = stopwatchGrid.querySelector(`.stopwatch-card[data-id="${sw.id}"]`);
      if (!card) return;

      const state = computeRingState(sw, now);

      if (sw.collapsed) {
        const collapsedEl = card.querySelector(".sw-collapsed-readout");
        if (collapsedEl) {
          collapsedEl.textContent = `${state.readouts.main}${state.readouts.cs}`;
        }
        return;
      }

      const mainEl = card.querySelector(".sw-digits-main");
      const csEl = card.querySelector(".sw-digits-cs");
      if (mainEl) {
        mainEl.textContent = state.readouts.main;
        mainEl.classList.toggle("is-hours", state.readouts.isHours);
      }
      if (csEl) csEl.textContent = state.readouts.cs;

      if (state.hasLaps) {
        const lapPillEl = card.querySelector(".sw-lap-delta-pill");
        if (lapPillEl) lapPillEl.textContent = state.currentLapText;
      }

      const outerArc = card.querySelector(".sw-ring-outer-fill");
      if (outerArc) outerArc.style.strokeDashoffset = state.outerOffset;

      const middleArc = card.querySelector(".sw-ring-middle-fill");
      if (middleArc) middleArc.style.strokeDashoffset = state.middleOffset;

      const innerArc = card.querySelector(".sw-ring-inner-fill");
      if (innerArc) innerArc.style.strokeDashoffset = state.innerOffset;

      const cometGroup = card.querySelector(".sw-comet-group");
      if (cometGroup) {
        cometGroup.setAttribute("transform", `translate(${state.cometX}, ${state.cometY})`);
        cometGroup.style.opacity = state.totalMs > 0 ? "1" : "0.65";
      }

      const middleCap = card.querySelector(".sw-middle-cap-dot");
      if (middleCap) {
        middleCap.setAttribute("cx", state.middleCapX);
        middleCap.setAttribute("cy", state.middleCapY);
        middleCap.style.opacity = state.totalMs > 0 ? "1" : "0";
      }

      const innerCap = card.querySelector(".sw-inner-cap-dot");
      if (innerCap) {
        innerCap.setAttribute("cx", state.innerCapX);
        innerCap.setAttribute("cy", state.innerCapY);
        innerCap.style.opacity = state.totalMs > 0 ? "1" : "0";
      }
    });

    if (anyRunning) {
      rafId = requestAnimationFrame(updateRunningCardsFrame);
    } else {
      rafId = null;
    }
  }

  function ensureAnimationLoop() {
    const anyRunning = stopwatches.some(s => s.isRunning);
    if (anyRunning && !rafId) {
      rafId = requestAnimationFrame(updateRunningCardsFrame);
    } else if (!anyRunning && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /********************************************************************************
   * Render Stopwatches to DOM
   ********************************************************************************/
  function renderStopwatches() {
    if (!stopwatchGrid) return;

    if (stopwatches.length === 0) {
      stopwatchGrid.innerHTML = "";
      ensureAnimationLoop();
      return;
    }

    const now = Date.now();
    const unmoved = stopwatches.filter(s => !s.position || typeof s.position.left !== "number");
    const defaultPositions = calculateDefaultPositions(unmoved);
    let unmovedIdx = 0;

    stopwatchGrid.innerHTML = stopwatches.map(sw => {
      const state = computeRingState(sw, now);
      const isCollapsed = !!sw.collapsed;
      const isRunning = !!sw.isRunning;
      const hasStarted = state.totalMs > 0;
      const statusText = isRunning ? "RUNNING" : (hasStarted ? "PAUSED" : "READY");
      const statusClass = isRunning ? "running" : (hasStarted ? "paused" : "ready");

      // Determine position
      let posLeft = 24;
      let posTop = 75;
      if (sw.position && typeof sw.position.left === "number") {
        posLeft = sw.position.left;
        posTop = sw.position.top;
      } else {
        const def = defaultPositions[unmovedIdx] || { left: 24, top: 75 };
        posLeft = def.left;
        posTop = def.top;
        unmovedIdx++;
      }

      // Compute fastest/slowest lap IDs if 2+ laps
      const laps = Array.isArray(sw.laps) ? sw.laps : [];
      const hasLaps = laps.length > 0;
      let fastestLapNum = null;
      let slowestLapNum = null;
      if (laps.length >= 2) {
        let minSplit = Infinity;
        let maxSplit = -Infinity;
        laps.forEach(l => {
          if (l.splitMs < minSplit) {
            minSplit = l.splitMs;
            fastestLapNum = l.number;
          }
          if (l.splitMs > maxSplit) {
            maxSplit = l.splitMs;
            slowestLapNum = l.number;
          }
        });
      }

      const lapsSectionHtml = hasLaps
        ? `
          <div class="sw-laps-box" aria-label="Recorded Lap Splits">
            ${laps.map(l => {
              const isFastest = l.number === fastestLapNum;
              const isSlowest = l.number === slowestLapNum && fastestLapNum !== slowestLapNum;
              const badge = isFastest ? " ⚡" : (isSlowest ? " 🐢" : "");
              const rowClass = isFastest ? "fastest-lap" : (isSlowest ? "slowest-lap" : "");
              return `
                <div class="sw-lap-row ${rowClass}">
                  <span class="sw-lap-num">Lap ${l.number}${badge}</span>
                  <span class="sw-lap-split">+${formatLapDuration(l.splitMs)}</span>
                  <span class="sw-lap-total">${formatLapDuration(l.totalMs)}</span>
                </div>
              `;
            }).join("")}
          </div>
        `
        : "";

      const centerLapPillHtml = hasLaps
        ? `<span class="sw-lap-delta-pill">${state.currentLapText}</span>`
        : "";

      const isEditingTitle = editingTitleId === sw.id;
      const titleMarkup = isEditingTitle
        ? `<input type="text" class="sw-title-input" data-id="${sw.id}" value="${escapeHtml(sw.label)}" maxlength="32" aria-label="Stopwatch title" />`
        : `<span class="stopwatch-card-title" data-id="${sw.id}" title="Double-click header to reset position, or click ✎ to rename">${escapeHtml(sw.label)}</span>`;

      const collapsedSummary = isCollapsed
        ? `<span class="sw-collapsed-readout">${state.readouts.main}${state.readouts.cs}</span>`
        : "";

      return `
        <div class="stopwatch-card ${isCollapsed ? "collapsed" : ""} ${isRunning ? "is-running" : ""}" data-id="${sw.id}" style="position: fixed; left: ${posLeft}px; top: ${posTop}px; z-index: 860;">
          <header class="stopwatch-card-header" title="Drag to move timer (double-click to reset position)">
            <div class="stopwatch-header-left">
              <span class="stopwatch-drag-handle" aria-hidden="true" title="Drag to move">⠿</span>
              ${titleMarkup}
              ${collapsedSummary}
            </div>
            <div class="stopwatch-card-actions">
              <button type="button" class="sw-header-btn sw-edit-title-btn" data-id="${sw.id}" title="Rename timer" aria-label="Rename timer">✎</button>
              <button type="button" class="sw-header-btn sw-collapse-btn" data-id="${sw.id}" aria-expanded="${!isCollapsed}" title="${isCollapsed ? "Expand timer" : "Collapse timer"}">
                ${isCollapsed ? "▶" : "▼"}
              </button>
              <button type="button" class="sw-header-btn sw-delete-btn" data-id="${sw.id}" title="Close timer" aria-label="Close timer">✕</button>
            </div>
          </header>

          <div class="stopwatch-card-body">
            <!-- Variation 1A: Liquid-Glass Smooth Ribbon Rings (3 Concentric Circles: 1m, 10m, 60m) -->
            <div class="sw-orbital-stage">
              <svg class="sw-orbital-svg" viewBox="0 0 320 320" aria-hidden="true">
                <defs>
                  <filter id="sw-comet-glow-${sw.id}" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="4.5" result="blur1" />
                    <feGaussianBlur stdDeviation="9" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="sw-ribbon-glow-${sw.id}" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <!-- Subtle Ambient Outer Halo -->
                <circle cx="${CENTER}" cy="${CENTER}" r="155" class="sw-ambient-halo" />

                <!-- 1. Outer Recessed Dark-Glass Groove (1-Minute / 60s Ring, r = 143) -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_OUTER}" class="sw-groove-outer" />
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_OUTER + 6.5}" class="sw-groove-rim" />
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_OUTER - 6.5}" class="sw-groove-rim" />

                <!-- 4 Subtle Cardinal Micro-Dots Between Outer & Middle Grooves -->
                <circle cx="${CENTER}" cy="${CENTER - R_CARDINAL_OUTER}" r="1.8" class="sw-cardinal-dot" />
                <circle cx="${CENTER + R_CARDINAL_OUTER}" cy="${CENTER}" r="1.8" class="sw-cardinal-dot" />
                <circle cx="${CENTER}" cy="${CENTER + R_CARDINAL_OUTER}" r="1.8" class="sw-cardinal-dot" />
                <circle cx="${CENTER - R_CARDINAL_OUTER}" cy="${CENTER}" r="1.8" class="sw-cardinal-dot" />

                <!-- 2. Middle Recessed Dark-Glass Groove (10-Minute Ring, r = 123) -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_MIDDLE}" class="sw-groove-middle" />
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_MIDDLE + 5.2}" class="sw-groove-rim" />
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_MIDDLE - 5.2}" class="sw-groove-rim" />

                <!-- 4 Subtle Cardinal Micro-Dots Between Middle & Inner Grooves -->
                <circle cx="${CENTER}" cy="${CENTER - R_CARDINAL_INNER}" r="1.5" class="sw-cardinal-dot" />
                <circle cx="${CENTER + R_CARDINAL_INNER}" cy="${CENTER}" r="1.5" class="sw-cardinal-dot" />
                <circle cx="${CENTER}" cy="${CENTER + R_CARDINAL_INNER}" r="1.5" class="sw-cardinal-dot" />
                <circle cx="${CENTER - R_CARDINAL_INNER}" cy="${CENTER}" r="1.5" class="sw-cardinal-dot" />

                <!-- 3. Inner Recessed Dark-Glass Groove (60-Minute Ring, r = 104) -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_INNER}" class="sw-groove-inner" />
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_INNER + 4.5}" class="sw-groove-rim" />
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_INNER - 4.5}" class="sw-groove-rim" />

                <!-- Outer 1m (60s) Smooth Ribbon Progress Arc -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_OUTER}"
                  class="sw-ring-outer-fill"
                  stroke-dasharray="${CIRC_OUTER}"
                  stroke-dashoffset="${state.outerOffset}"
                  transform="rotate(-90 ${CENTER} ${CENTER})"
                  filter="url(#sw-ribbon-glow-${sw.id})" />

                <!-- Middle 10m Smooth Ribbon Progress Arc -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_MIDDLE}"
                  class="sw-ring-middle-fill"
                  stroke-dasharray="${CIRC_MIDDLE}"
                  stroke-dashoffset="${state.middleOffset}"
                  transform="rotate(-90 ${CENTER} ${CENTER})"
                  filter="url(#sw-ribbon-glow-${sw.id})" />

                <!-- Inner 60m Smooth Ribbon Progress Arc -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_INNER}"
                  class="sw-ring-inner-fill"
                  stroke-dasharray="${CIRC_INNER}"
                  stroke-dashoffset="${state.innerOffset}"
                  transform="rotate(-90 ${CENTER} ${CENTER})"
                  filter="url(#sw-ribbon-glow-${sw.id})" />

                <!-- Middle 10m Ring Leading Micro-Cap Dot -->
                <circle cx="${state.middleCapX}" cy="${state.middleCapY}" r="3.6"
                  class="sw-middle-cap-dot"
                  style="opacity: ${hasStarted ? 1 : 0};" />

                <!-- Inner 60m Ring Leading Micro-Cap Dot -->
                <circle cx="${state.innerCapX}" cy="${state.innerCapY}" r="3.2"
                  class="sw-inner-cap-dot"
                  style="opacity: ${hasStarted ? 1 : 0};" />

                <!-- Outer 1m Ring Glowing Comet Orb -->
                <g class="sw-comet-group" transform="translate(${state.cometX}, ${state.cometY})" filter="url(#sw-comet-glow-${sw.id})" style="opacity: ${hasStarted ? 1 : 0.65};">
                  <circle cx="0" cy="0" r="10" class="sw-comet-aura" />
                  <circle cx="0" cy="0" r="5.5" class="sw-comet-core" />
                </g>

                <!-- Frosted Glass Center Disc (r = 88, 176px diameter) -->
                <circle cx="${CENTER}" cy="${CENTER}" r="${R_CORE}" class="sw-frosted-core" />
              </svg>

              <!-- Center Digital Hub Overlay -->
              <div class="sw-center-readout">
                <span class="sw-status-pill ${statusClass}">
                  <span class="sw-status-dot"></span>
                  <span class="sw-status-text">${statusText}</span>
                </span>
                <div class="sw-digits-row">
                  <span class="sw-digits-main ${state.readouts.isHours ? "is-hours" : ""}">${state.readouts.main}</span><span class="sw-digits-cs">${state.readouts.cs}</span>
                </div>
                ${centerLapPillHtml}
              </div>
            </div>

            <!-- Controls & Conditional Lap Splits Section -->
            <div class="sw-controls-panel">
              <div class="sw-action-buttons">
                <button type="button" class="sw-btn sw-btn-primary ${isRunning ? "is-pause" : "is-start"}" data-action="toggle" data-id="${sw.id}">
                  ${isRunning ? "⏸ Pause" : (hasStarted ? "▶ Resume" : "▶ Start")}
                </button>
                <button type="button" class="sw-btn sw-btn-secondary" data-action="lap" data-id="${sw.id}" ${!isRunning ? "disabled" : ""}>
                  🏁 Lap
                </button>
                <button type="button" class="sw-btn sw-btn-secondary" data-action="reset" data-id="${sw.id}" ${!hasStarted && !hasLaps ? "disabled" : ""}>
                  ↺ Reset
                </button>
              </div>

              ${lapsSectionHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");

    attachCardListeners();
    ensureAnimationLoop();
  }

  /********************************************************************************
   * Interactive Event Handlers (Start/Pause, Lap, Reset, Edit, Collapse, Drag)
   ********************************************************************************/
  function attachCardListeners() {
    if (!stopwatchGrid) return;

    // 1. Toggle Start / Pause
    stopwatchGrid.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        toggleStopwatch(id);
      });
    });

    // 2. Record Lap
    stopwatchGrid.querySelectorAll('[data-action="lap"]').forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        recordLap(id);
      });
    });

    // 3. Reset Stopwatch
    stopwatchGrid.querySelectorAll('[data-action="reset"]').forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        resetStopwatch(id);
      });
    });

    // 4. Rename Title Button & Input
    stopwatchGrid.querySelectorAll(".sw-edit-title-btn").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        editingTitleId = id;
        renderStopwatches();
        const input = stopwatchGrid.querySelector(`.sw-title-input[data-id="${id}"]`);
        if (input) {
          input.focus();
          input.select();
        }
      });
    });

    stopwatchGrid.querySelectorAll(".sw-title-input").forEach(input => {
      function commitTitle() {
        const id = input.getAttribute("data-id");
        const sw = stopwatches.find(s => s.id === id);
        if (sw) {
          sw.label = input.value.trim() || "Stopwatch";
          saveStopwatches();
        }
        if (editingTitleId === id) {
          editingTitleId = null;
          renderStopwatches();
        }
      }

      input.addEventListener("blur", commitTitle);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          commitTitle();
        } else if (e.key === "Escape") {
          editingTitleId = null;
          renderStopwatches();
        }
      });
    });

    // 5. Collapse / Expand
    stopwatchGrid.querySelectorAll(".sw-collapse-btn").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        const sw = stopwatches.find(s => s.id === id);
        if (sw) {
          sw.collapsed = !sw.collapsed;
          saveStopwatches();
          renderStopwatches();
        }
      });
    });

    // 6. Close / Delete
    stopwatchGrid.querySelectorAll(".sw-delete-btn").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        deleteStopwatch(id);
      });
    });

    // 7. Drag-to-Move & Double-Click Position Reset
    stopwatchGrid.querySelectorAll(".stopwatch-card").forEach(card => {
      const id = card.getAttribute("data-id");
      const header = card.querySelector(".stopwatch-card-header");
      if (!header) return;

      let lastClickTime = 0;

      header.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button") || e.target.closest("input")) return;

        let isDragging = false;
        const startPointer = { x: e.clientX, y: e.clientY };
        const rect = card.getBoundingClientRect();
        const startCardPos = { left: rect.left, top: rect.top };

        function onMove(moveEvent) {
          const dist = Math.hypot(moveEvent.clientX - startPointer.x, moveEvent.clientY - startPointer.y);
          if (!isDragging && dist > 5) {
            isDragging = true;
            card.classList.add("is-dragging");
            card.style.transition = "none";
            card.style.zIndex = "890";
          }

          if (isDragging) {
            const deltaX = moveEvent.clientX - startPointer.x;
            const deltaY = moveEvent.clientY - startPointer.y;
            const cardRect = card.getBoundingClientRect();
            const maxLeft = Math.max(10, window.innerWidth - cardRect.width - 10);
            const maxTop = Math.max(50, window.innerHeight - cardRect.height - 10);

            const clampedLeft = Math.max(10, Math.min(startCardPos.left + deltaX, maxLeft));
            const clampedTop = Math.max(48, Math.min(startCardPos.top + deltaY, maxTop));

            card.style.left = `${clampedLeft}px`;
            card.style.top = `${clampedTop}px`;
          }
        }

        function onUp() {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);

          if (isDragging) {
            isDragging = false;
            card.classList.remove("is-dragging");
            card.style.transition = "";
            card.style.zIndex = "860";

            const sw = stopwatches.find(s => s.id === id);
            if (sw) {
              const finalRect = card.getBoundingClientRect();
              sw.position = { left: Math.round(finalRect.left), top: Math.round(finalRect.top) };
              saveStopwatches();
            }
            lastClickTime = 0;
          } else {
            const now = Date.now();
            if (now - lastClickTime < 350) {
              const sw = stopwatches.find(s => s.id === id);
              if (sw) {
                delete sw.position;
                saveStopwatches();
                renderStopwatches();
              }
              lastClickTime = 0;
            } else {
              lastClickTime = now;
            }
          }
        }

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      });

      header.addEventListener("dblclick", function (e) {
        if (e.target.closest("button") || e.target.closest("input")) return;
        e.stopPropagation();
        const sw = stopwatches.find(s => s.id === id);
        if (sw) {
          delete sw.position;
          saveStopwatches();
          renderStopwatches();
        }
      });
    });
  }

  /********************************************************************************
   * Stopwatch State Actions
   ********************************************************************************/
  function createStopwatch(customLabel) {
    const now = Date.now();
    const index = stopwatches.length + 1;
    const defaultLabel = index === 1 ? "Stopwatch" : `Stopwatch ${index}`;

    const newSw = {
      id: "sw_" + now + "_" + Math.random().toString(36).substr(2, 4),
      label: customLabel || defaultLabel,
      isRunning: false,
      accumulatedMs: 0,
      lastStartTimestamp: null,
      laps: [],
      collapsed: false
    };

    stopwatches.push(newSw);
    saveStopwatches();
    renderStopwatches();

    // Animate newly created card
    if (stopwatchGrid) {
      const newCard = stopwatchGrid.querySelector(`.stopwatch-card[data-id="${newSw.id}"]`);
      if (newCard) {
        newCard.classList.add("sw-pop-in");
      }
    }
  }

  function toggleStopwatch(id) {
    const sw = stopwatches.find(s => s.id === id);
    if (!sw) return;

    const now = Date.now();
    if (sw.isRunning) {
      sw.accumulatedMs = getElapsedMs(sw, now);
      sw.isRunning = false;
      sw.lastStartTimestamp = null;
    } else {
      sw.isRunning = true;
      sw.lastStartTimestamp = now;
    }

    saveStopwatches();
    renderStopwatches();
  }

  function recordLap(id) {
    const sw = stopwatches.find(s => s.id === id);
    if (!sw || !sw.isRunning) return;

    const now = Date.now();
    const totalMs = getElapsedMs(sw, now);
    if (!Array.isArray(sw.laps)) sw.laps = [];

    const prevTotalMs = sw.laps.length > 0 ? sw.laps[0].totalMs : 0;
    const splitMs = Math.max(10, totalMs - prevTotalMs);
    const lapNumber = sw.laps.length + 1;

    sw.laps.unshift({
      number: lapNumber,
      splitMs,
      totalMs
    });

    saveStopwatches();
    renderStopwatches();
  }

  function resetStopwatch(id) {
    const sw = stopwatches.find(s => s.id === id);
    if (!sw) return;

    sw.isRunning = false;
    sw.accumulatedMs = 0;
    sw.lastStartTimestamp = null;
    sw.laps = [];

    saveStopwatches();
    renderStopwatches();
  }

  function deleteStopwatch(id) {
    stopwatches = stopwatches.filter(s => s.id !== id);
    saveStopwatches();
    renderStopwatches();
  }

  /********************************************************************************
   * Initialization
   ********************************************************************************/
  function init() {
    stopwatchGrid = document.getElementById("stopwatch-grid");
    openStopwatchBtn = document.getElementById("open-stopwatch-btn");

    loadStopwatches();
    renderStopwatches();

    if (openStopwatchBtn) {
      openStopwatchBtn.addEventListener("click", function () {
        createStopwatch();
      });
    }

    window.addEventListener("resize", updateDefaultPositions);
    setTimeout(updateDefaultPositions, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.WebClockStopwatch = {
    createStopwatch,
    toggleStopwatch,
    recordLap,
    resetStopwatch,
    deleteStopwatch,
    updateDefaultPositions,
    getStopwatches: () => stopwatches
  };
})();
