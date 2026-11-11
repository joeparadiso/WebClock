/********************************************************************************
 * clock.js -- March 2025 -- Joe Paradiso (Multi-Timer Engine)
 * DETAILS:
 *  - Manages real-time 12-hour digital clock and date display.
 *  - Provides a dynamic Multi-Timer system supporting simultaneous countdowns.
 *  - Features Option 3 Modern Hybrid cards with SVG circular progress ring,
 *    live target time, relative status, and overdue count-up alarms.
 *  - Full modal creation lifecycle with quick +15m/+30m/+45m/+1h presets.
 *  - Persistent storage across reloads via localStorage.
 ********************************************************************************/

document.addEventListener("DOMContentLoaded", function () {
  // Main Clock DOM Elements
  const dateEl = document.getElementById("Date");
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  // Multi-Timer DOM Elements
  const timersGrid = document.getElementById("timers-grid");
  const openModalBtn = document.getElementById("open-timer-modal");
  const closeModalBtn = document.getElementById("close-timer-modal");
  const cancelModalBtn = document.getElementById("cancel-timer-btn");
  const modalOverlay = document.getElementById("timer-modal-overlay");
  const createTimerForm = document.getElementById("create-timer-form");
  const timerLabelInput = document.getElementById("timer-label");
  const timerNoteInput = document.getElementById("timer-note");
  const timerStartDateInput = document.getElementById("timer-start-date");
  const timerStartTimeInput = document.getElementById("timer-start-time");
  const timerStartNowBtn = document.getElementById("timer-start-now-btn");
  const timerDateInput = document.getElementById("timer-date");
  const timerTimeInput = document.getElementById("timer-time");
  const presetButtons = document.querySelectorAll(".preset-btn");

  // Constant lookup arrays
  const DAY_NAMES = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // 3-Ring Orbital SVG Geometry (viewBox 0 0 320 320, center = 160, 160)
  // 1. Outer Ring (1-Minute / 60s cycle): r = 143
  // 2. Middle Ring (10-Minute cycle): r = 123
  // 3. Inner Ring (60-Minute cycle): r = 104
  // 4. Center Frosted Core: r = 88 (houses the % remaining readout)
  const ALARM_CENTER = 160;
  const ALARM_R_OUTER = 143;
  const ALARM_R_MIDDLE = 123;
  const ALARM_R_INNER = 104;
  const ALARM_R_CORE = 88;
  const ALARM_R_CARDINAL_OUTER = 133;
  const ALARM_R_CARDINAL_INNER = 113.5;
  const ALARM_CIRC_OUTER = 2 * Math.PI * ALARM_R_OUTER;   // ~898.50
  const ALARM_CIRC_MIDDLE = 2 * Math.PI * ALARM_R_MIDDLE; // ~772.83
  const ALARM_CIRC_INNER = 2 * Math.PI * ALARM_R_INNER;   // ~653.45
  const STORAGE_KEY = "webclock_multi_timers";

  // Alarm sound setup
  const alarmSound = new Audio("alarm.mp3");
  alarmSound.loop = true;

  // Active timers state & editing tracking
  let activeTimers = [];
  let editingTimerId = null;
  let alarmRafId = null;

  const modalTitle = document.getElementById("modal-title");
  const submitTimerBtn = document.getElementById("submit-timer-btn");

  /********************************************************************************
   * Escapes HTML to prevent XSS injection in timer labels
   ********************************************************************************/
  function escapeHtml(str) {
    if (!str) return "Timer";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /********************************************************************************
   * LocalStorage Operations
   ********************************************************************************/
  function loadTimers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        activeTimers = JSON.parse(data);
      }
    } catch (e) {
      console.warn("Could not load timers from localStorage:", e);
      activeTimers = [];
    }
  }

  function saveTimers() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTimers));
    } catch (e) {
      console.warn("Could not save timers to localStorage:", e);
    }
  }

  /********************************************************************************
   * Updates the digital clock display (HH:MM:SS) and Date
   ********************************************************************************/
  function updateClock() {
    const now = new Date();

    if (dateEl) {
      dateEl.textContent = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }

    const rawHours = now.getHours() % 12 || 12;
    const hours = String(rawHours).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    if (hoursEl) hoursEl.textContent = hours;
    if (minutesEl) minutesEl.textContent = minutes;
    if (secondsEl) secondsEl.textContent = seconds;

    // Advance and update active countdown timers
    updateAllTimers(now);
  }

  /********************************************************************************
   * Formats remaining or overdue time into readable digits
   ********************************************************************************/
  function formatDigits(totalSeconds, isOverdue) {
    const absSeconds = Math.abs(totalSeconds);
    const days = Math.floor(absSeconds / 86400);
    const hours = Math.floor((absSeconds % 86400) / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;

    const pad = n => String(n).padStart(2, "0");
    const prefix = isOverdue ? "+ " : "";

    if (days > 0) {
      return `${prefix}${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${prefix}${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
  }

  /********************************************************************************
   * Formats the target timestamp into a user-friendly label (e.g., "Today, 3:30 PM")
   ********************************************************************************/
  function formatTargetTime(targetDate) {
    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    let hours = targetDate.getHours();
    const minutes = String(targetDate.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const monthShort = MONTH_NAMES[targetDate.getMonth()].slice(0, 3);
    return `${monthShort} ${targetDate.getDate()}, ${timeStr}`;
  }

  const TIMER_DEFAULT_WIDTH = 415;
  const TIMER_GAP = 20;

  function setAlarmPositionFromLayout(id, left, top) {
    const timer = activeTimers.find(t => t.id === id);
    if (!timer) return;
    timer.position = { left: Math.round(left), top: Math.round(top) };
    saveTimers();
  }

  function calculateDefaultTimerPositions(unmovedTimers) {
    const clockEl = document.querySelector(".clock");
    const positions = [];
    let currentTop = 75;
    let left = 24;

    if (clockEl) {
      const clockRect = clockEl.getBoundingClientRect();
      left = Math.max(16, Math.min(clockRect.right + TIMER_GAP, window.innerWidth - TIMER_DEFAULT_WIDTH - 16));
      currentTop = clockRect.top;
    }

    unmovedTimers.forEach(timer => {
      const isCollapsed = !!timer.collapsed;
      // Header-only collapsed height is 44px; full card height with 148px 3-ring gauge is ~208px
      const cardHeight = isCollapsed ? 44 : 208;
      positions.push({ left: Math.round(left), top: Math.round(currentTop) });
      currentTop += cardHeight + TIMER_GAP;
    });

    return positions;
  }

  /********************************************************************************
   * Computes 3-Ring Orbital State (Outer 1m, Middle 10m, Inner 60m + % Core)
   ********************************************************************************/
  function computeAlarmRingState(timer, now = Date.now()) {
    const targetTime = timer.targetTimestamp;
    const startTime = timer.startTimestamp || timer.createdAt || targetTime;
    const initialDuration = timer.initialDurationMs || Math.max(1, targetTime - startTime);
    const remainingMs = targetTime - now;
    const isOverdue = remainingMs <= 0;
    const remainingSec = Math.floor(remainingMs / 1000);

    // Overall percentage of time remaining (from 100% down to 0%)
    const fraction = isOverdue ? 0 : Math.max(0, Math.min(1, remainingMs / initialDuration));
    const percent = Math.round(fraction * 100);

    // 3 Concentric Rings:
    //  1. Outer Ring: 1-minute (60,000 ms) cycle
    //  2. Middle Ring: 10-minute (600,000 ms) cycle
    //  3. Inner Ring: 60-minute (3,600,000 ms) cycle
    let outerFraction, middleFraction, innerFraction;

    if (!isOverdue) {
      const outerMod = remainingMs % 60000;
      outerFraction = outerMod === 0 ? 1 : outerMod / 60000;

      const middleMod = remainingMs % 600000;
      middleFraction = middleMod === 0 ? 1 : middleMod / 600000;

      const innerMod = remainingMs % 3600000;
      innerFraction = innerMod === 0 ? 1 : innerMod / 3600000;
    } else {
      const overdueMs = Math.abs(remainingMs);
      outerFraction = (overdueMs % 60000) / 60000;
      middleFraction = overdueMs > 0 ? (overdueMs % 600000) / 600000 : 0;
      innerFraction = overdueMs > 0 ? (overdueMs % 3600000) / 3600000 : 0;
    }

    const outerOffset = ALARM_CIRC_OUTER * (1 - outerFraction);
    const outerAngle = outerFraction * 2 * Math.PI - Math.PI / 2;
    const cometX = (ALARM_CENTER + ALARM_R_OUTER * Math.cos(outerAngle)).toFixed(2);
    const cometY = (ALARM_CENTER + ALARM_R_OUTER * Math.sin(outerAngle)).toFixed(2);

    const middleOffset = ALARM_CIRC_MIDDLE * (1 - middleFraction);
    const middleAngle = middleFraction * 2 * Math.PI - Math.PI / 2;
    const middleCapX = (ALARM_CENTER + ALARM_R_MIDDLE * Math.cos(middleAngle)).toFixed(2);
    const middleCapY = (ALARM_CENTER + ALARM_R_MIDDLE * Math.sin(middleAngle)).toFixed(2);

    const innerOffset = ALARM_CIRC_INNER * (1 - innerFraction);
    const innerAngle = innerFraction * 2 * Math.PI - Math.PI / 2;
    const innerCapX = (ALARM_CENTER + ALARM_R_INNER * Math.cos(innerAngle)).toFixed(2);
    const innerCapY = (ALARM_CENTER + ALARM_R_INNER * Math.sin(innerAngle)).toFixed(2);

    return {
      targetTime,
      startTime,
      initialDuration,
      remainingMs,
      isOverdue,
      remainingSec,
      fraction,
      percent,
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
      innerCapY
    };
  }

  function updateCardRingDOM(card, state) {
    const outerArc = card.querySelector(".alarm-ring-outer-fill");
    if (outerArc) outerArc.style.strokeDashoffset = state.outerOffset;

    const middleArc = card.querySelector(".alarm-ring-middle-fill");
    if (middleArc) middleArc.style.strokeDashoffset = state.middleOffset;

    const innerArc = card.querySelector(".alarm-ring-inner-fill");
    if (innerArc) innerArc.style.strokeDashoffset = state.innerOffset;

    const cometGroup = card.querySelector(".alarm-comet-group");
    if (cometGroup) {
      cometGroup.setAttribute("transform", `translate(${state.cometX}, ${state.cometY})`);
    }

    const middleCap = card.querySelector(".alarm-middle-cap-dot");
    if (middleCap) {
      middleCap.setAttribute("cx", state.middleCapX);
      middleCap.setAttribute("cy", state.middleCapY);
    }

    const innerCap = card.querySelector(".alarm-inner-cap-dot");
    if (innerCap) {
      innerCap.setAttribute("cx", state.innerCapX);
      innerCap.setAttribute("cy", state.innerCapY);
    }

    const percentText = card.querySelector(".gauge-percent-text");
    if (percentText) {
      const nextText = state.isOverdue ? "!" : `${state.percent}%`;
      if (percentText.textContent !== nextText) {
        percentText.textContent = nextText;
      }
    }
  }

  function updateAlarmRingsFrame() {
    if (!timersGrid || activeTimers.length === 0) {
      alarmRafId = null;
      return;
    }

    const now = Date.now();
    let anyExpanded = false;

    activeTimers.forEach(timer => {
      if (timer.collapsed) return;
      const card = timersGrid.querySelector(`.timer-card[data-id="${timer.id}"]`);
      if (!card) return;
      anyExpanded = true;
      const state = computeAlarmRingState(timer, now);
      updateCardRingDOM(card, state);
    });

    if (anyExpanded) {
      alarmRafId = requestAnimationFrame(updateAlarmRingsFrame);
    } else {
      alarmRafId = null;
    }
  }

  function ensureAlarmAnimationLoop() {
    const anyExpanded = activeTimers.some(t => !t.collapsed);
    if (anyExpanded && !alarmRafId) {
      alarmRafId = requestAnimationFrame(updateAlarmRingsFrame);
    } else if (!anyExpanded && alarmRafId) {
      cancelAnimationFrame(alarmRafId);
      alarmRafId = null;
    }
  }

  /********************************************************************************
   * Renders the complete timer shelf in the DOM with Drag-to-Move and Collapse support
   ********************************************************************************/
  function renderTimers() {
    if (!timersGrid) return;

    if (activeTimers.length === 0) {
      timersGrid.innerHTML = "";
      ensureAlarmAnimationLoop();
      return;
    }

    const now = Date.now();
    const unmovedTimers = activeTimers.filter(t => !t.position || typeof t.position.left !== "number");
    const defaultPositions = calculateDefaultTimerPositions(unmovedTimers);
    let unmovedIndex = 0;

    timersGrid.innerHTML = activeTimers.map(timer => {
      const state = computeAlarmRingState(timer, now);
      const {
        targetTime,
        startTime,
        isOverdue,
        remainingSec,
        percent
      } = state;

      const startDate = new Date(startTime);
      const startText = formatTargetTime(startDate);
      const targetDate = new Date(targetTime);
      const targetText = formatTargetTime(targetDate);
      const isCollapsed = !!timer.collapsed;
      const fullHeaderTitle = `${escapeHtml(timer.label)}: ${targetText}`;
      const displayTitle = isCollapsed ? escapeHtml(timer.label) : fullHeaderTitle;
      const tooltipTitle = `${escapeHtml(timer.label)} (Started: ${startText} • Target: ${targetText})`;
      const digitsText = formatDigits(remainingSec, isOverdue);

      const isCustomMoved = timer.position && typeof timer.position.left === "number";
      let posLeft, posTop;
      if (isCustomMoved) {
        posLeft = timer.position.left;
        posTop = timer.position.top;
      } else {
        const defPos = defaultPositions[unmovedIndex] || { left: 24, top: 75 };
        posLeft = defPos.left;
        posTop = defPos.top;
        unmovedIndex++;
      }

      const posStyle = `style="position: fixed; left: ${posLeft}px; top: ${posTop}px; margin: 0; z-index: 850;"`;

      return `
        <div class="timer-card ${isOverdue ? "overdue" : ""} ${isCustomMoved ? "is-moved" : ""} ${isCollapsed ? "collapsed" : ""}" data-id="${timer.id}" ${posStyle}>
          <div class="timer-card-header" title="Drag to move timer (double-click title to reset position)">
            <span class="timer-drag-handle" aria-hidden="true" title="Drag to move">⠿</span>
            <span class="timer-card-title" title="${tooltipTitle} (double-click to reset position)">${displayTitle}</span>
            <div class="timer-card-actions">
              <button type="button" class="timer-collapse-btn" data-id="${timer.id}" aria-expanded="${!isCollapsed}" title="${isCollapsed ? "Expand timer details" : "Collapse timer details"}">
                ${isCollapsed ? "▶" : "▼"}
              </button>
              <button type="button" class="timer-edit-btn" data-id="${timer.id}" aria-label="Edit timer" title="Edit timer">✎</button>
              <button type="button" class="timer-delete-btn" data-id="${timer.id}" aria-label="${isOverdue ? "Dismiss timer" : "Delete timer"}" title="${isOverdue ? "Dismiss timer" : "Delete timer"}">
                ${isOverdue ? "✕ Dismiss" : "✕"}
              </button>
            </div>
          </div>
          <div class="timer-card-body">
            <div class="timer-gauge-container">
              <svg class="alarm-orbital-svg" viewBox="0 0 320 320" aria-hidden="true">
                <defs>
                  <filter id="alarm-comet-glow-${timer.id}" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="4.5" result="blur1" />
                    <feGaussianBlur stdDeviation="9" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="alarm-ribbon-glow-${timer.id}" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <!-- Subtle Ambient Outer Halo -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="155" class="alarm-ambient-halo" />

                <!-- 1. Outer Recessed Dark-Glass Groove (1-Minute / 60s Ring, r = 143) -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_OUTER}" class="alarm-groove-outer" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_OUTER + 6.5}" class="alarm-groove-rim" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_OUTER - 6.5}" class="alarm-groove-rim" />

                <!-- 4 Subtle Cardinal Micro-Dots Between Outer & Middle Grooves -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER - ALARM_R_CARDINAL_OUTER}" r="2.2" class="alarm-cardinal-dot" />
                <circle cx="${ALARM_CENTER + ALARM_R_CARDINAL_OUTER}" cy="${ALARM_CENTER}" r="2.2" class="alarm-cardinal-dot" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER + ALARM_R_CARDINAL_OUTER}" r="2.2" class="alarm-cardinal-dot" />
                <circle cx="${ALARM_CENTER - ALARM_R_CARDINAL_OUTER}" cy="${ALARM_CENTER}" r="2.2" class="alarm-cardinal-dot" />

                <!-- 2. Middle Recessed Dark-Glass Groove (10-Minute Ring, r = 123) -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_MIDDLE}" class="alarm-groove-middle" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_MIDDLE + 5.2}" class="alarm-groove-rim" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_MIDDLE - 5.2}" class="alarm-groove-rim" />

                <!-- 4 Subtle Cardinal Micro-Dots Between Middle & Inner Grooves -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER - ALARM_R_CARDINAL_INNER}" r="1.9" class="alarm-cardinal-dot" />
                <circle cx="${ALARM_CENTER + ALARM_R_CARDINAL_INNER}" cy="${ALARM_CENTER}" r="1.9" class="alarm-cardinal-dot" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER + ALARM_R_CARDINAL_INNER}" r="1.9" class="alarm-cardinal-dot" />
                <circle cx="${ALARM_CENTER - ALARM_R_CARDINAL_INNER}" cy="${ALARM_CENTER}" r="1.9" class="alarm-cardinal-dot" />

                <!-- 3. Inner Recessed Dark-Glass Groove (60-Minute Ring, r = 104) -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_INNER}" class="alarm-groove-inner" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_INNER + 4.5}" class="alarm-groove-rim" />
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_INNER - 4.5}" class="alarm-groove-rim" />

                <!-- Outer 1m (60s) Smooth Ribbon Progress Arc -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_OUTER}"
                  class="alarm-ring-outer-fill"
                  stroke-dasharray="${ALARM_CIRC_OUTER}"
                  style="stroke-dashoffset: ${state.outerOffset};"
                  transform="rotate(-90 ${ALARM_CENTER} ${ALARM_CENTER})"
                  filter="url(#alarm-ribbon-glow-${timer.id})" />

                <!-- Middle 10m Smooth Ribbon Progress Arc -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_MIDDLE}"
                  class="alarm-ring-middle-fill"
                  stroke-dasharray="${ALARM_CIRC_MIDDLE}"
                  style="stroke-dashoffset: ${state.middleOffset};"
                  transform="rotate(-90 ${ALARM_CENTER} ${ALARM_CENTER})"
                  filter="url(#alarm-ribbon-glow-${timer.id})" />

                <!-- Inner 60m Smooth Ribbon Progress Arc -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_INNER}"
                  class="alarm-ring-inner-fill"
                  stroke-dasharray="${ALARM_CIRC_INNER}"
                  style="stroke-dashoffset: ${state.innerOffset};"
                  transform="rotate(-90 ${ALARM_CENTER} ${ALARM_CENTER})"
                  filter="url(#alarm-ribbon-glow-${timer.id})" />

                <!-- Middle 10m Ring Leading Micro-Cap Dot -->
                <circle cx="${state.middleCapX}" cy="${state.middleCapY}" r="3.8"
                  class="alarm-middle-cap-dot" />

                <!-- Inner 60m Ring Leading Micro-Cap Dot -->
                <circle cx="${state.innerCapX}" cy="${state.innerCapY}" r="3.4"
                  class="alarm-inner-cap-dot" />

                <!-- Outer 1m Ring Glowing Comet Orb -->
                <g class="alarm-comet-group" transform="translate(${state.cometX}, ${state.cometY})" filter="url(#alarm-comet-glow-${timer.id})">
                  <circle cx="0" cy="0" r="10.5" class="alarm-comet-aura" />
                  <circle cx="0" cy="0" r="5.8" class="alarm-comet-core" />
                </g>

                <!-- Frosted Glass Center Disc (r = 88) -->
                <circle cx="${ALARM_CENTER}" cy="${ALARM_CENTER}" r="${ALARM_R_CORE}" class="alarm-frosted-core" />
              </svg>
              <span class="gauge-percent-text">${isOverdue ? "!" : percent + "%"}</span>
            </div>
            <div class="timer-readout-container">
              <div class="timer-digits">${digitsText}</div>
              <div class="timer-subtext">
                ${isOverdue ? `<span class="timer-status-badge">⚠️ Overdue</span>` : ""}
                ${timer.note ? `<span class="timer-note-text" title="${escapeHtml(timer.note)}">${escapeHtml(timer.note)}</span>` : ""}
              </div>
            </div>
          </div>
          <button type="button" class="timer-stop-alarm-btn ${timer.alarmSilenced ? "silenced" : ""}" data-id="${timer.id}" title="${timer.alarmSilenced ? "Alarm sound stopped" : "Stop alarm sound"}" aria-label="Stop alarm sound">
            ${timer.alarmSilenced ? "🔕 Silenced" : "🔔 Stop Alarm"}
          </button>
        </div>
      `;
    }).join("");

    // Attach Collapse click handlers
    const collapseBtns = timersGrid.querySelectorAll(".timer-collapse-btn");
    collapseBtns.forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        const timer = activeTimers.find(t => t.id === id);
        if (timer) {
          const oldCard = timersGrid.querySelector(`.timer-card[data-id="${id}"]`);
          const prevRect = oldCard ? oldCard.getBoundingClientRect() : null;

          timer.collapsed = !timer.collapsed;
          saveTimers();
          renderTimers();

          const newCard = timersGrid.querySelector(`.timer-card[data-id="${id}"]`);
          if (newCard && window.WebClockSnapLayout && typeof window.WebClockSnapLayout.onCardGeometryChanged === "function") {
            window.WebClockSnapLayout.onCardGeometryChanged(
              newCard,
              prevRect ? { left: prevRect.left, top: prevRect.top, width: prevRect.width, height: prevRect.height } : null
            );
          }
        }
      });
    });

    // Attach Edit click handlers
    const editBtns = timersGrid.querySelectorAll(".timer-edit-btn");
    editBtns.forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        openEditModal(id);
      });
    });

    // Attach delete/dismiss click handlers
    const deleteBtns = timersGrid.querySelectorAll(".timer-delete-btn");
    deleteBtns.forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        deleteTimer(id);
      });
    });

    // Attach Stop Alarm click handlers
    const stopAlarmBtns = timersGrid.querySelectorAll(".timer-stop-alarm-btn");
    stopAlarmBtns.forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        silenceTimerAlarm(id);
      });
    });

    // Attach Drag to Move handlers for each timer card
    const timerCards = timersGrid.querySelectorAll(".timer-card");
    timerCards.forEach(card => {
      const id = card.getAttribute("data-id");
      const header = card.querySelector(".timer-card-header");

      if (header) {
        let lastTimerClickTime = 0;

        header.addEventListener("pointerdown", function (e) {
          if (e.target.closest("button") || e.target.closest("input")) return;

          let isDragging = false;
          const startPointer = { x: e.clientX, y: e.clientY };
          const rect = card.getBoundingClientRect();
          const startCardPos = { left: rect.left, top: rect.top };
          const dragContext = { slotOrigin: { left: rect.left, top: rect.top } };

          function onTimerMove(moveEvent) {
            const dist = Math.hypot(moveEvent.clientX - startPointer.x, moveEvent.clientY - startPointer.y);
            if (!isDragging && dist > 5) {
              isDragging = true;
              card.classList.add("is-dragging");
              card.style.transition = "none";

              // Convert to position: fixed if not already
              card.style.position = "fixed";
              card.style.left = `${startCardPos.left}px`;
              card.style.top = `${startCardPos.top}px`;
              card.style.margin = "0";
              card.style.zIndex = "880";
            }

            if (isDragging) {
              const deltaX = moveEvent.clientX - startPointer.x;
              const deltaY = moveEvent.clientY - startPointer.y;

              const cardRect = card.getBoundingClientRect();
              const maxLeft = Math.max(10, window.innerWidth - cardRect.width - 10);
              const maxTop = Math.max(50, window.innerHeight - cardRect.height - 10);
              const minTop = 48;

              const rawLeft = startCardPos.left + deltaX;
              const rawTop = startCardPos.top + deltaY;

              let resolved = {
                left: Math.max(10, Math.min(rawLeft, maxLeft)),
                top: Math.max(minTop, Math.min(rawTop, maxTop))
              };

              if (window.WebClockSnapLayout && typeof window.WebClockSnapLayout.resolveDragPosition === "function") {
                resolved = window.WebClockSnapLayout.resolveDragPosition(card, rawLeft, rawTop, dragContext);
              }

              card.style.left = `${resolved.left}px`;
              card.style.top = `${resolved.top}px`;
            }
          }

          function onTimerUp() {
            window.removeEventListener("pointermove", onTimerMove);
            window.removeEventListener("pointerup", onTimerUp);
            window.removeEventListener("pointercancel", onTimerUp);

            if (window.WebClockSnapLayout && typeof window.WebClockSnapLayout.clearSnapGuides === "function") {
              window.WebClockSnapLayout.clearSnapGuides();
            }

            if (isDragging) {
              isDragging = false;
              card.classList.remove("is-dragging");
              card.style.transition = "";

              const timer = activeTimers.find(t => t.id === id);
              if (timer) {
                const cardRect = card.getBoundingClientRect();
                timer.position = { left: Math.round(cardRect.left), top: Math.round(cardRect.top) };
                saveTimers();
              }
              lastTimerClickTime = 0;
            } else {
              const now = Date.now();
              if (now - lastTimerClickTime < 350) {
                const timer = activeTimers.find(t => t.id === id);
                if (timer) {
                  delete timer.position;
                  saveTimers();
                  renderTimers();
                }
                lastTimerClickTime = 0;
              } else {
                lastTimerClickTime = now;
              }
            }
          }

          window.addEventListener("pointermove", onTimerMove);
          window.addEventListener("pointerup", onTimerUp);
          window.addEventListener("pointercancel", onTimerUp);
        });

        // Native double-click reset
        header.addEventListener("dblclick", function (e) {
          if (e.target.closest("button") || e.target.closest("input")) return;
          e.stopPropagation();
          const timer = activeTimers.find(t => t.id === id);
          if (timer) {
            delete timer.position;
            saveTimers();
            renderTimers();
          }
        });
      }
    });

    ensureAlarmAnimationLoop();
  }

  /********************************************************************************
   * Updates all active timers every second without full DOM redraw
   ********************************************************************************/
  function updateAllTimers(nowDate) {
    if (activeTimers.length === 0) return;

    const now = nowDate.getTime();

    activeTimers.forEach(timer => {
      const card = timersGrid ? timersGrid.querySelector(`.timer-card[data-id="${timer.id}"]`) : null;
      if (!card) return;

      const state = computeAlarmRingState(timer, now);
      const { isOverdue, remainingSec } = state;

      // Handle transition to overdue (trigger alarm)
      if (isOverdue && !timer.alarmTriggered) {
        timer.alarmTriggered = true;
        timer.alarmSilenced = false;
        card.classList.add("overdue");

        const deleteBtn = card.querySelector(".timer-delete-btn");
        if (deleteBtn) {
          deleteBtn.textContent = "✕ Dismiss";
          deleteBtn.setAttribute("aria-label", "Dismiss timer");
          deleteBtn.setAttribute("title", "Dismiss timer");
        }

        const subtextEl = card.querySelector(".timer-subtext");
        if (subtextEl && !subtextEl.querySelector(".timer-status-badge")) {
          const badge = document.createElement("span");
          badge.className = "timer-status-badge";
          badge.textContent = "⚠️ Overdue";
          subtextEl.insertBefore(badge, subtextEl.firstChild);
        }

        const stopBtn = card.querySelector(".timer-stop-alarm-btn");
        if (stopBtn) {
          stopBtn.classList.remove("silenced");
          stopBtn.textContent = "🔔 Stop Alarm";
          stopBtn.setAttribute("title", "Stop alarm sound");
        }
      }

      // Update digits
      const digitsEl = card.querySelector(".timer-digits");
      if (digitsEl) {
        digitsEl.textContent = formatDigits(remainingSec, isOverdue);
      }

      // Update 3-ring circular SVG gauge & center percentage
      updateCardRingDOM(card, state);
    });

    ensureAlarmAnimationLoop();

    const hasUnsilencedOverdue = activeTimers.some(t => t.targetTimestamp <= now && !t.alarmSilenced);
    if (hasUnsilencedOverdue) {
      if (alarmSound.paused) {
        alarmSound.play().catch(err => {
          console.warn("Audio playback prevented by browser policy:", err);
        });
      }
    } else {
      stopAlarm();
    }
  }

  /********************************************************************************
   * Adds a new timer to the system
   ********************************************************************************/
  function addTimer(label, targetDate, note, startDate) {
    const now = Date.now();
    const startTimestamp = startDate ? startDate.getTime() : now;
    const targetTimestamp = targetDate.getTime();
    const duration = Math.max(1000, targetTimestamp - startTimestamp);

    let initialPos = null;
    if (window.WebClockSnapLayout && typeof window.WebClockSnapLayout.findAvailableSlot === "function") {
      initialPos = window.WebClockSnapLayout.findAvailableSlot(null, "right", TIMER_DEFAULT_WIDTH, 208);
    }

    const newTimer = {
      id: "timer_" + now + "_" + Math.random().toString(36).substr(2, 4),
      label: label.trim() || "Countdown Timer",
      note: note ? note.trim() : "",
      startTimestamp: startTimestamp,
      targetTimestamp: targetTimestamp,
      createdAt: now,
      initialDurationMs: duration,
      alarmTriggered: false,
      alarmSilenced: false
    };

    if (initialPos) {
      newTimer.position = { left: initialPos.left, top: initialPos.top };
    }

    activeTimers.push(newTimer);
    saveTimers();
    renderTimers();
  }

  /********************************************************************************
   * Updates an existing timer in the system
   ********************************************************************************/
  function updateTimer(id, label, targetDate, note, startDate) {
    const timer = activeTimers.find(t => t.id === id);
    if (!timer) return;

    const newTarget = targetDate.getTime();
    const newStart = startDate ? startDate.getTime() : (timer.startTimestamp || timer.createdAt || Date.now());

    timer.label = label.trim() || "Countdown Timer";
    timer.note = note ? note.trim() : "";

    if (newTarget !== timer.targetTimestamp || newStart !== timer.startTimestamp) {
      timer.startTimestamp = newStart;
      timer.targetTimestamp = newTarget;
      timer.initialDurationMs = Math.max(1000, newTarget - newStart);
      if (newTarget > Date.now()) {
        timer.alarmTriggered = false;
        timer.alarmSilenced = false;
      }
    }

    saveTimers();

    // Check if alarm should be silenced after editing
    const hasRemainingOverdue = activeTimers.some(t => t.targetTimestamp <= Date.now() && !t.alarmSilenced);
    if (!hasRemainingOverdue) {
      stopAlarm();
    }

    renderTimers();
  }

  /********************************************************************************
   * Silences the alarm for a specific timer without deleting it
   ********************************************************************************/
  function silenceTimerAlarm(id) {
    const timer = activeTimers.find(t => t.id === id);
    if (!timer) return;

    timer.alarmSilenced = true;
    saveTimers();

    // If no unsilenced overdue timers remain, stop the sound
    const hasUnsilencedOverdue = activeTimers.some(t => t.targetTimestamp <= Date.now() && !t.alarmSilenced);
    if (!hasUnsilencedOverdue) {
      stopAlarm();
    }

    const card = timersGrid ? timersGrid.querySelector(`.timer-card[data-id="${id}"]`) : null;
    if (card) {
      const btn = card.querySelector(".timer-stop-alarm-btn");
      if (btn) {
        btn.classList.add("silenced");
        btn.textContent = "🔕 Silenced";
        btn.setAttribute("title", "Alarm sound stopped");
      }
    }
  }

  /********************************************************************************
   * Deletes / Dismisses a timer by ID
   ********************************************************************************/
  function deleteTimer(id) {
    const oldCard = timersGrid ? timersGrid.querySelector(`.timer-card[data-id="${id}"]`) : null;
    const closedRect = oldCard ? oldCard.getBoundingClientRect() : null;

    activeTimers = activeTimers.filter(t => t.id !== id);
    saveTimers();

    // If no remaining timers are overdue, silence the alarm
    const hasRemainingOverdue = activeTimers.some(t => t.targetTimestamp <= Date.now() && !t.alarmSilenced);
    if (!hasRemainingOverdue) {
      stopAlarm();
    }

    renderTimers();

    if (closedRect && window.WebClockSnapLayout && typeof window.WebClockSnapLayout.onCardClosed === "function") {
      window.WebClockSnapLayout.onCardClosed({
        left: closedRect.left,
        top: closedRect.top,
        width: closedRect.width,
        height: closedRect.height
      });
    }
  }

  /********************************************************************************
   * Stops and resets the alarm sound
   ********************************************************************************/
  function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
  }

  /********************************************************************************
   * Modal Management (Creation & Editing)
   ********************************************************************************/
  function openCreateModal() {
    if (!modalOverlay) return;

    editingTimerId = null;
    if (modalTitle) modalTitle.textContent = "Create Alarm";
    if (submitTimerBtn) submitTimerBtn.textContent = "Set Alarm";

    // Default Start Date to today (YYYY-MM-DD)
    const today = new Date();
    const startYear = today.getFullYear();
    const startMonth = String(today.getMonth() + 1).padStart(2, "0");
    const startDay = String(today.getDate()).padStart(2, "0");
    const startHours = String(today.getHours()).padStart(2, "0");
    const startMins = String(today.getMinutes()).padStart(2, "0");

    if (timerStartDateInput) timerStartDateInput.value = `${startYear}-${startMonth}-${startDay}`;
    if (timerStartTimeInput) timerStartTimeInput.value = `${startHours}:${startMins}`;

    // Default End Date to today (YYYY-MM-DD)
    if (timerDateInput) timerDateInput.value = `${startYear}-${startMonth}-${startDay}`;

    // Default End Time to now + 15 minutes rounded to next minute
    const defaultTime = new Date(today.getTime() + 15 * 60 * 1000);
    const defHours = String(defaultTime.getHours()).padStart(2, "0");
    const defMinutes = String(defaultTime.getMinutes()).padStart(2, "0");
    if (timerTimeInput) timerTimeInput.value = `${defHours}:${defMinutes}`;

    if (timerLabelInput) timerLabelInput.value = "";
    if (timerNoteInput) timerNoteInput.value = "";

    modalOverlay.classList.add("modal-open");
    modalOverlay.setAttribute("aria-hidden", "false");

    if (timerLabelInput) {
      setTimeout(() => timerLabelInput.focus(), 50);
    }
  }

  function openEditModal(timerId) {
    const timer = activeTimers.find(t => t.id === timerId);
    if (!timer || !modalOverlay) return;

    editingTimerId = timerId;
    if (modalTitle) modalTitle.textContent = "Edit Alarm";
    if (submitTimerBtn) submitTimerBtn.textContent = "Save Changes";

    if (timerLabelInput) timerLabelInput.value = timer.label || "";
    if (timerNoteInput) timerNoteInput.value = timer.note || "";

    // Start Date & Time
    const startTimeVal = timer.startTimestamp || timer.createdAt || Date.now();
    const startDate = new Date(startTimeVal);
    const startYear = startDate.getFullYear();
    const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
    const startDay = String(startDate.getDate()).padStart(2, "0");
    const startHours = String(startDate.getHours()).padStart(2, "0");
    const startMins = String(startDate.getMinutes()).padStart(2, "0");

    if (timerStartDateInput) timerStartDateInput.value = `${startYear}-${startMonth}-${startDay}`;
    if (timerStartTimeInput) timerStartTimeInput.value = `${startHours}:${startMins}`;

    // End Date & Time
    const targetDate = new Date(timer.targetTimestamp);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const hours = String(targetDate.getHours()).padStart(2, "0");
    const mins = String(targetDate.getMinutes()).padStart(2, "0");

    if (timerDateInput) timerDateInput.value = `${year}-${month}-${day}`;
    if (timerTimeInput) timerTimeInput.value = `${hours}:${mins}`;

    modalOverlay.classList.add("modal-open");
    modalOverlay.setAttribute("aria-hidden", "false");

    if (timerLabelInput) {
      setTimeout(() => timerLabelInput.focus(), 50);
    }
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("modal-open");
    modalOverlay.setAttribute("aria-hidden", "true");
    editingTimerId = null;
  }

  // Attach Modal event listeners
  if (openModalBtn) openModalBtn.addEventListener("click", openCreateModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

  // Set Start Time to Now button
  if (timerStartNowBtn) {
    timerStartNowBtn.addEventListener("click", function () {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");

      if (timerStartDateInput) timerStartDateInput.value = `${year}-${month}-${day}`;
      if (timerStartTimeInput) timerStartTimeInput.value = `${hours}:${mins}`;
    });
  }

  // Close modal when clicking on backdrop outside card
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOverlay && modalOverlay.classList.contains("modal-open")) {
      closeModal();
    }
  });

  // Quick preset buttons (+15m, +30m, +45m, +1h)
  presetButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      const minutesToAdd = parseInt(this.getAttribute("data-minutes"), 10) || 15;
      let baseTime = Date.now();
      const startDateVal = timerStartDateInput ? timerStartDateInput.value : "";
      const startTimeVal = timerStartTimeInput ? timerStartTimeInput.value : "";
      if (startDateVal && startTimeVal) {
        const parsedStart = new Date(`${startDateVal}T${startTimeVal}:00`).getTime();
        if (!isNaN(parsedStart) && parsedStart > baseTime) {
          baseTime = parsedStart;
        }
      }

      const target = new Date(baseTime + minutesToAdd * 60 * 1000);

      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, "0");
      const day = String(target.getDate()).padStart(2, "0");
      const hours = String(target.getHours()).padStart(2, "0");
      const mins = String(target.getMinutes()).padStart(2, "0");

      if (timerDateInput) timerDateInput.value = `${year}-${month}-${day}`;
      if (timerTimeInput) timerTimeInput.value = `${hours}:${mins}`;
    });
  });

  // Handle Form Submission (Create or Edit)
  if (createTimerForm) {
    createTimerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const label = timerLabelInput ? timerLabelInput.value : "";
      const note = timerNoteInput ? timerNoteInput.value : "";
      const startDateVal = timerStartDateInput ? timerStartDateInput.value : "";
      const startTimeVal = timerStartTimeInput ? timerStartTimeInput.value : "";
      const dateVal = timerDateInput ? timerDateInput.value : "";
      const timeVal = timerTimeInput ? timerTimeInput.value : "";

      if (!startDateVal || !startTimeVal) {
        alert("Please enter both a start date and start time for the timer.");
        return;
      }

      if (!dateVal || !timeVal) {
        alert("Please enter both an end date and time for the timer.");
        return;
      }

      const startDate = new Date(`${startDateVal}T${startTimeVal}:00`);
      const targetDate = new Date(`${dateVal}T${timeVal}:00`);
      const now = new Date();

      if (isNaN(startDate.getTime())) {
        alert("Invalid start date or time entered. Please try again.");
        return;
      }

      if (isNaN(targetDate.getTime())) {
        alert("Invalid end date or time entered. Please try again.");
        return;
      }

      if (targetDate <= startDate) {
        alert("The end time must be after the start time.");
        return;
      }

      if (targetDate <= now) {
        alert("Please choose a future date and time for your countdown.");
        return;
      }

      if (editingTimerId) {
        updateTimer(editingTimerId, label, targetDate, note, startDate);
      } else {
        addTimer(label, targetDate, note, startDate);
      }

      closeModal();
    });
  }

  /********************************************************************************
   * Main Clock Drag-to-Move & Position Persistence
   ********************************************************************************/
  const CLOCK_POS_KEY = "webclock_main_clock_pos";
  const CLOCK_COLLAPSED_KEY = "webclock_main_clock_collapsed";
  const mainClockCard = document.querySelector(".clock");
  const clockHeaderHandle = document.getElementById("clockSunContainer") || mainClockCard;
  const clockCornerHandle = document.getElementById("clock-drag-handle");
  const clockCollapseBtn = document.getElementById("clock-collapse-btn");
  const dateResetHandle = document.getElementById("Date");
  const clockDisplayEl = document.querySelector(".clock-display");
  let isClockCollapsed = false;

  function setClockCollapsed(collapsed) {
    const prevRect = mainClockCard ? mainClockCard.getBoundingClientRect() : null;
    isClockCollapsed = Boolean(collapsed);
    if (!mainClockCard) return;

    if (isClockCollapsed) {
      mainClockCard.classList.add("collapsed");
      if (clockCollapseBtn) {
        clockCollapseBtn.innerHTML = "▶";
        clockCollapseBtn.setAttribute("aria-expanded", "false");
        clockCollapseBtn.setAttribute("title", "Exit Focus Mode (Expand Clock Details)");
      }
    } else {
      mainClockCard.classList.remove("collapsed");
      if (clockCollapseBtn) {
        clockCollapseBtn.innerHTML = "▼";
        clockCollapseBtn.setAttribute("aria-expanded", "true");
        clockCollapseBtn.setAttribute("title", "Focus Mode (Collapse Clock to Time Only)");
      }
    }

    try {
      localStorage.setItem(CLOCK_COLLAPSED_KEY, JSON.stringify(isClockCollapsed));
    } catch (_) {}

    updateDefaultWidgetPositions();
    if (window.WebClockSnapLayout && typeof window.WebClockSnapLayout.onCardGeometryChanged === "function") {
      window.WebClockSnapLayout.onCardGeometryChanged(
        mainClockCard,
        prevRect ? { left: prevRect.left, top: prevRect.top, width: prevRect.width, height: prevRect.height } : null
      );
    }
  }

  function loadClockCollapsed() {
    try {
      const saved = localStorage.getItem(CLOCK_COLLAPSED_KEY);
      if (saved !== null) {
        setClockCollapsed(JSON.parse(saved));
      } else {
        setClockCollapsed(false); // default to expanded
      }
    } catch (_) {
      setClockCollapsed(false);
    }
  }

  function clampClockPos(left, top) {
    if (!mainClockCard) return { left, top };
    const rect = mainClockCard.getBoundingClientRect();
    const width = rect.width || 850;
    const height = rect.height || 300;
    const maxLeft = Math.max(10, window.innerWidth - width - 10);
    const maxTop = Math.max(50, window.innerHeight - height - 10);
    const minTop = 48;

    return {
      left: Math.max(10, Math.min(left, maxLeft)),
      top: Math.max(minTop, Math.min(top, maxTop))
    };
  }

  function loadClockPosition() {
    if (!mainClockCard) return;
    try {
      const saved = localStorage.getItem(CLOCK_POS_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        if (pos && typeof pos.left === "number" && typeof pos.top === "number") {
          const clamped = clampClockPos(pos.left, pos.top);
          mainClockCard.style.position = "fixed";
          mainClockCard.style.left = `${clamped.left}px`;
          mainClockCard.style.top = `${clamped.top}px`;
          mainClockCard.style.margin = "0";
          mainClockCard.style.zIndex = "800";
        }
      }
    } catch (e) {
      console.warn("Could not load clock position:", e);
    }
  }

  function resetClockPosition() {
    if (!mainClockCard) return;
    try {
      localStorage.removeItem(CLOCK_POS_KEY);
    } catch (_) {}
    mainClockCard.classList.remove("is-dragging");
    mainClockCard.classList.remove("is-moved");
    mainClockCard.style.position = "";
    mainClockCard.style.left = "";
    mainClockCard.style.top = "";
    mainClockCard.style.margin = "";
    mainClockCard.style.zIndex = "";
    mainClockCard.style.transition = "";
    updateDefaultWidgetPositions();
  }

  function updateDefaultWidgetPositions() {
    if (activeTimers && timersGrid) {
      const unmovedTimers = activeTimers.filter(t => !t.position || typeof t.position.left !== "number");
      const defaultPositions = calculateDefaultTimerPositions(unmovedTimers);
      let unmovedIdx = 0;
      activeTimers.forEach(timer => {
        if (!timer.position || typeof timer.position.left !== "number") {
          const card = timersGrid.querySelector(`.timer-card[data-id="${timer.id}"]`);
          if (card) {
            const defPos = defaultPositions[unmovedIdx];
            if (defPos) {
              card.style.left = `${defPos.left}px`;
              card.style.top = `${defPos.top}px`;
            }
            unmovedIdx++;
          }
        }
      });
    }

    if (window.WebClockTodo && typeof window.WebClockTodo.updateDefaultPosition === "function") {
      window.WebClockTodo.updateDefaultPosition();
    }
    if (window.WebClockStopwatch && typeof window.WebClockStopwatch.updateDefaultPositions === "function") {
      window.WebClockStopwatch.updateDefaultPositions();
    }
  }

  function initClockDrag() {
    if (!mainClockCard) return;

    let lastClockClickTime = 0;

    function onClockPointerDown(e) {
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;

      let isClockDragging = false;
      const startPointer = { x: e.clientX, y: e.clientY };
      const rect = mainClockCard.getBoundingClientRect();
      const startClockPos = { left: rect.left, top: rect.top };
      const dragContext = { slotOrigin: { left: rect.left, top: rect.top } };

      function onClockPointerMove(moveEvent) {
        const dist = Math.hypot(moveEvent.clientX - startPointer.x, moveEvent.clientY - startPointer.y);
        if (!isClockDragging && dist > 5) {
          isClockDragging = true;
          mainClockCard.classList.add("is-dragging");
          mainClockCard.style.transition = "none";

          mainClockCard.style.position = "fixed";
          mainClockCard.style.left = `${startClockPos.left}px`;
          mainClockCard.style.top = `${startClockPos.top}px`;
          mainClockCard.style.margin = "0";
          mainClockCard.style.zIndex = "820";
        }

        if (isClockDragging) {
          const deltaX = moveEvent.clientX - startPointer.x;
          const deltaY = moveEvent.clientY - startPointer.y;

          const rawLeft = startClockPos.left + deltaX;
          const rawTop = startClockPos.top + deltaY;
          let resolved = clampClockPos(rawLeft, rawTop);

          if (window.WebClockSnapLayout && typeof window.WebClockSnapLayout.resolveDragPosition === "function") {
            resolved = window.WebClockSnapLayout.resolveDragPosition(mainClockCard, rawLeft, rawTop, dragContext);
          }

          mainClockCard.style.left = `${resolved.left}px`;
          mainClockCard.style.top = `${resolved.top}px`;
          updateDefaultWidgetPositions();
        }
      }

      function onClockPointerUp() {
        window.removeEventListener("pointermove", onClockPointerMove);
        window.removeEventListener("pointerup", onClockPointerUp);
        window.removeEventListener("pointercancel", onClockPointerUp);

        if (window.WebClockSnapLayout && typeof window.WebClockSnapLayout.clearSnapGuides === "function") {
          window.WebClockSnapLayout.clearSnapGuides();
        }

        if (isClockDragging) {
          isClockDragging = false;
          mainClockCard.classList.remove("is-dragging");
          mainClockCard.style.transition = "";

          const rectNow = mainClockCard.getBoundingClientRect();
          const pos = { left: Math.round(rectNow.left), top: Math.round(rectNow.top) };
          try {
            localStorage.setItem(CLOCK_POS_KEY, JSON.stringify(pos));
          } catch (_) {}
          updateDefaultWidgetPositions();
          lastClockClickTime = 0;
        } else {
          const now = Date.now();
          if (now - lastClockClickTime < 350) {
            resetClockPosition();
            lastClockClickTime = 0;
          } else {
            lastClockClickTime = now;
          }
        }
      }

      window.addEventListener("pointermove", onClockPointerMove);
      window.addEventListener("pointerup", onClockPointerUp);
      window.addEventListener("pointercancel", onClockPointerUp);
    }

    const handles = [clockHeaderHandle, clockCornerHandle, dateResetHandle, clockDisplayEl].filter(Boolean);
    handles.forEach(h => {
      h.addEventListener("pointerdown", onClockPointerDown);

      // Native double-click event support
      h.addEventListener("dblclick", function (e) {
        if (e.target.closest("button") || e.target.closest("input") || e.target.closest("a")) return;
        e.stopPropagation();
        resetClockPosition();
      });
    });

    if (clockCollapseBtn) {
      clockCollapseBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        setClockCollapsed(!isClockCollapsed);
      });
    }
  }

  // Handle window resizing to keep moved cards within bounds and sync default positions
  window.addEventListener("resize", function () {
    if (mainClockCard && mainClockCard.style.position === "fixed") {
      const rect = mainClockCard.getBoundingClientRect();
      const clamped = clampClockPos(rect.left, rect.top);
      mainClockCard.style.left = `${clamped.left}px`;
      mainClockCard.style.top = `${clamped.top}px`;
    }

    if (activeTimers && timersGrid) {
      const unmovedTimers = activeTimers.filter(t => !t.position || typeof t.position.left !== "number");
      const defaultPositions = calculateDefaultTimerPositions(unmovedTimers);
      let unmovedIdx = 0;
      let changed = false;

      activeTimers.forEach(timer => {
        const card = timersGrid.querySelector(`.timer-card[data-id="${timer.id}"]`);
        if (!card) return;

        if (timer.position && typeof timer.position.left === "number") {
          const rect = card.getBoundingClientRect();
          const maxLeft = Math.max(10, window.innerWidth - rect.width - 10);
          const maxTop = Math.max(50, window.innerHeight - rect.height - 10);
          const clampedL = Math.max(10, Math.min(timer.position.left, maxLeft));
          const clampedT = Math.max(48, Math.min(timer.position.top, maxTop));
          if (clampedL !== timer.position.left || clampedT !== timer.position.top) {
            timer.position.left = clampedL;
            timer.position.top = clampedT;
            card.style.left = `${clampedL}px`;
            card.style.top = `${clampedT}px`;
            changed = true;
          }
        } else {
          const defPos = defaultPositions[unmovedIdx];
          if (defPos) {
            card.style.left = `${defPos.left}px`;
            card.style.top = `${defPos.top}px`;
          }
          unmovedIdx++;
        }
      });
      if (changed) saveTimers();
    }

    if (window.WebClockTodo && typeof window.WebClockTodo.updateDefaultPosition === "function") {
      window.WebClockTodo.updateDefaultPosition();
    }
    if (window.WebClockStopwatch && typeof window.WebClockStopwatch.updateDefaultPositions === "function") {
      window.WebClockStopwatch.updateDefaultPositions();
    }
  });

  // Expose Alarms API for layout engine synchronization
  window.WebClockAlarms = {
    setAlarmPositionFromLayout,
    getAlarms: () => activeTimers
  };

  // Load existing timers, clock position, collapsed state, and render
  loadTimers();
  renderTimers();
  loadClockPosition();
  loadClockCollapsed();
  initClockDrag();
  setTimeout(updateDefaultWidgetPositions, 100);

  // Initialize clock immediately on load and tick every 1000ms
  updateClock();
  setInterval(updateClock, 1000);
});
