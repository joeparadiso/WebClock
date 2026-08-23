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

  // SVG Gauge Math (r = 28 -> Circumference = 2 * PI * 28 ≈ 175.93)
  const CIRCUMFERENCE = 175.93;
  const STORAGE_KEY = "webclock_multi_timers";

  // Alarm sound setup
  const alarmSound = new Audio("alarm.mp3");
  alarmSound.loop = true;

  // Active timers state array
  let activeTimers = [];

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
      return `Target: Today, ${timeStr}`;
    }

    const monthShort = MONTH_NAMES[targetDate.getMonth()].slice(0, 3);
    return `Target: ${monthShort} ${targetDate.getDate()}, ${timeStr}`;
  }

  /********************************************************************************
   * Formats relative status text (e.g. "Due in 18 minutes", "⚠️ 2m overdue")
   ********************************************************************************/
  function formatRelativeStatus(totalSeconds, isOverdue) {
    const abs = Math.abs(totalSeconds);
    const minutes = Math.floor(abs / 60);
    const hours = Math.floor(abs / 3600);
    const days = Math.floor(abs / 86400);

    if (isOverdue) {
      if (abs < 60) return `⚠️ Overdue by ${abs}s`;
      if (minutes < 60) return `⚠️ Overdue by ${minutes}m ${abs % 60}s`;
      return `⚠️ Overdue by ${hours}h ${minutes % 60}m`;
    }

    if (days > 0) return `Due in ${days}d ${hours % 24}h`;
    if (hours > 0) return `Due in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `Due in ${minutes} min`;
    return `Due in ${abs}s`;
  }

  /********************************************************************************
   * Renders the complete timer shelf in the DOM
   ********************************************************************************/
  function renderTimers() {
    if (!timersGrid) return;

    if (activeTimers.length === 0) {
      timersGrid.innerHTML = "";
      return;
    }

    const now = Date.now();

    timersGrid.innerHTML = activeTimers.map(timer => {
      const targetTime = timer.targetTimestamp;
      const initialDuration = timer.initialDurationMs || Math.max(1, targetTime - timer.createdAt);
      const remainingMs = targetTime - now;
      const isOverdue = remainingMs <= 0;
      const remainingSec = Math.floor(remainingMs / 1000);

      // Percentage of time remaining (from 100% down to 0%)
      const fraction = isOverdue ? 0 : Math.max(0, Math.min(1, remainingMs / initialDuration));
      const percent = Math.round(fraction * 100);
      const strokeOffset = CIRCUMFERENCE * (1 - fraction);

      const targetDate = new Date(targetTime);
      const targetText = formatTargetTime(targetDate);
      const relativeText = formatRelativeStatus(remainingSec, isOverdue);
      const digitsText = formatDigits(remainingSec, isOverdue);

      return `
        <div class="timer-card ${isOverdue ? "overdue" : ""}" data-id="${timer.id}">
          <div class="timer-card-header">
            <span class="timer-card-title" title="${escapeHtml(timer.label)}">${escapeHtml(timer.label)}</span>
            <button type="button" class="timer-delete-btn" data-id="${timer.id}" aria-label="${isOverdue ? "Dismiss timer" : "Delete timer"}">
              ${isOverdue ? "✕ Dismiss" : "✕"}
            </button>
          </div>
          <div class="timer-card-body">
            <div class="timer-gauge-container">
              <svg class="progress-ring" viewBox="0 0 70 70">
                <circle class="progress-ring-bg" cx="35" cy="35" r="28" />
                <circle class="progress-ring-fill" cx="35" cy="35" r="28" style="stroke-dashoffset: ${strokeOffset};" />
              </svg>
              <span class="gauge-percent-text">${isOverdue ? "!" : percent + "%"}</span>
            </div>
            <div class="timer-readout-container">
              <div class="timer-digits">${digitsText}</div>
              <div class="timer-subtext">
                <span class="timer-target-time">${targetText}</span>
                <span class="timer-status-badge">${relativeText}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Attach delete/dismiss click handlers
    const deleteBtns = timersGrid.querySelectorAll(".timer-delete-btn");
    deleteBtns.forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        deleteTimer(id);
      });
    });
  }

  /********************************************************************************
   * Updates all active timers every second without full DOM redraw
   ********************************************************************************/
  function updateAllTimers(nowDate) {
    if (activeTimers.length === 0) return;

    const now = nowDate.getTime();
    let shouldCheckAlarm = false;
    let anyOverdue = false;

    activeTimers.forEach(timer => {
      const card = timersGrid ? timersGrid.querySelector(`.timer-card[data-id="${timer.id}"]`) : null;
      if (!card) return;

      const targetTime = timer.targetTimestamp;
      const initialDuration = timer.initialDurationMs || Math.max(1, targetTime - timer.createdAt);
      const remainingMs = targetTime - now;
      const isOverdue = remainingMs <= 0;
      const remainingSec = Math.floor(remainingMs / 1000);

      if (isOverdue) anyOverdue = true;

      // Handle transition to overdue (trigger alarm)
      if (isOverdue && !timer.alarmTriggered) {
        timer.alarmTriggered = true;
        shouldCheckAlarm = true;
        card.classList.add("overdue");

        const deleteBtn = card.querySelector(".timer-delete-btn");
        if (deleteBtn) {
          deleteBtn.textContent = "✕ Dismiss";
          deleteBtn.setAttribute("aria-label", "Dismiss timer");
        }
      }

      // Update digits
      const digitsEl = card.querySelector(".timer-digits");
      if (digitsEl) {
        digitsEl.textContent = formatDigits(remainingSec, isOverdue);
      }

      // Update relative status
      const statusEl = card.querySelector(".timer-status-badge");
      if (statusEl) {
        statusEl.textContent = formatRelativeStatus(remainingSec, isOverdue);
      }

      // Update circular SVG gauge
      const fraction = isOverdue ? 0 : Math.max(0, Math.min(1, remainingMs / initialDuration));
      const percent = Math.round(fraction * 100);
      const strokeOffset = CIRCUMFERENCE * (1 - fraction);

      const fillCircle = card.querySelector(".progress-ring-fill");
      if (fillCircle) {
        fillCircle.style.strokeDashoffset = strokeOffset;
      }

      const percentText = card.querySelector(".gauge-percent-text");
      if (percentText) {
        percentText.textContent = isOverdue ? "!" : `${percent}%`;
      }
    });

    if (shouldCheckAlarm && anyOverdue) {
      alarmSound.play().catch(err => {
        console.warn("Audio playback prevented by browser policy:", err);
      });
    }

    if (!anyOverdue) {
      stopAlarm();
    }
  }

  /********************************************************************************
   * Adds a new timer to the system
   ********************************************************************************/
  function addTimer(label, targetDate) {
    const now = Date.now();
    const targetTimestamp = targetDate.getTime();
    const duration = Math.max(1000, targetTimestamp - now);

    const newTimer = {
      id: "timer_" + now + "_" + Math.random().toString(36).substr(2, 4),
      label: label.trim() || "Countdown Timer",
      targetTimestamp: targetTimestamp,
      createdAt: now,
      initialDurationMs: duration,
      alarmTriggered: false
    };

    activeTimers.push(newTimer);
    saveTimers();
    renderTimers();
  }

  /********************************************************************************
   * Deletes / Dismisses a timer by ID
   ********************************************************************************/
  function deleteTimer(id) {
    activeTimers = activeTimers.filter(t => t.id !== id);
    saveTimers();

    // If no remaining timers are overdue, silence the alarm
    const hasRemainingOverdue = activeTimers.some(t => t.targetTimestamp <= Date.now());
    if (!hasRemainingOverdue) {
      stopAlarm();
    }

    renderTimers();
  }

  /********************************************************************************
   * Stops and resets the alarm sound
   ********************************************************************************/
  function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
  }

  /********************************************************************************
   * Modal Management & Date Defaults
   ********************************************************************************/
  function openModal() {
    if (!modalOverlay) return;

    // Default Date input to today (YYYY-MM-DD)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    if (timerDateInput) timerDateInput.value = `${year}-${month}-${day}`;

    // Default Time input to now + 15 minutes rounded to next minute
    const defaultTime = new Date(today.getTime() + 15 * 60 * 1000);
    const defHours = String(defaultTime.getHours()).padStart(2, "0");
    const defMinutes = String(defaultTime.getMinutes()).padStart(2, "0");
    if (timerTimeInput) timerTimeInput.value = `${defHours}:${defMinutes}`;

    if (timerLabelInput) {
      timerLabelInput.value = "";
    }

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
  }

  // Attach Modal event listeners
  if (openModalBtn) openModalBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

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
      const target = new Date(Date.now() + minutesToAdd * 60 * 1000);

      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, "0");
      const day = String(target.getDate()).padStart(2, "0");
      const hours = String(target.getHours()).padStart(2, "0");
      const mins = String(target.getMinutes()).padStart(2, "0");

      if (timerDateInput) timerDateInput.value = `${year}-${month}-${day}`;
      if (timerTimeInput) timerTimeInput.value = `${hours}:${mins}`;
    });
  });

  // Handle Form Submission
  if (createTimerForm) {
    createTimerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const label = timerLabelInput ? timerLabelInput.value : "";
      const dateVal = timerDateInput ? timerDateInput.value : "";
      const timeVal = timerTimeInput ? timerTimeInput.value : "";

      if (!dateVal || !timeVal) {
        alert("Please enter both a date and time for the timer.");
        return;
      }

      const targetDate = new Date(`${dateVal}T${timeVal}:00`);
      const now = new Date();

      if (isNaN(targetDate.getTime())) {
        alert("Invalid date or time entered. Please try again.");
        return;
      }

      if (targetDate <= now) {
        alert("Please choose a future date and time for your countdown.");
        return;
      }

      addTimer(label, targetDate);
      closeModal();
    });
  }

  // Load existing timers and render them
  loadTimers();
  renderTimers();

  // Initialize clock immediately on load and tick every 1000ms
  updateClock();
  setInterval(updateClock, 1000);
});

