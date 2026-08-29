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

  // Active timers state & editing tracking
  let activeTimers = [];
  let editingTimerId = null;

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
  const TIMER_GAP = 14;

  function calculateDefaultTimerPositions(unmovedTimers) {
    const clockEl = document.querySelector(".clock");
    const positions = [];
    let currentTop = 75;
    let left = 24;

    if (clockEl) {
      const clockRect = clockEl.getBoundingClientRect();
      left = Math.max(10, Math.min(clockRect.right + 24, window.innerWidth - TIMER_DEFAULT_WIDTH - 10));
      currentTop = clockRect.top;
    }

    unmovedTimers.forEach(timer => {
      const isCollapsed = !!timer.collapsed;
      // Header-only collapsed height is 44px; full card height is ~146px
      const cardHeight = isCollapsed ? 44 : 146;
      positions.push({ left, top: currentTop });
      currentTop += cardHeight + TIMER_GAP;
    });

    return positions;
  }

  /********************************************************************************
   * Renders the complete timer shelf in the DOM with Drag-to-Move and Collapse support
   ********************************************************************************/
  function renderTimers() {
    if (!timersGrid) return;

    if (activeTimers.length === 0) {
      timersGrid.innerHTML = "";
      return;
    }

    const now = Date.now();
    const unmovedTimers = activeTimers.filter(t => !t.position || typeof t.position.left !== "number");
    const defaultPositions = calculateDefaultTimerPositions(unmovedTimers);
    let unmovedIndex = 0;

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
      const isCollapsed = !!timer.collapsed;
      const fullHeaderTitle = `${escapeHtml(timer.label)}: ${targetText}`;
      const displayTitle = isCollapsed ? escapeHtml(timer.label) : fullHeaderTitle;
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
            <span class="timer-card-title" title="${fullHeaderTitle} (double-click to reset position)">${displayTitle}</span>
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
              <svg class="progress-ring" viewBox="0 0 70 70">
                <circle class="progress-ring-bg" cx="35" cy="35" r="28" />
                <circle class="progress-ring-fill" cx="35" cy="35" r="28" style="stroke-dashoffset: ${strokeOffset};" />
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
          timer.collapsed = !timer.collapsed;
          saveTimers();
          renderTimers();
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

              const clampedLeft = Math.max(10, Math.min(rawLeft, maxLeft));
              const clampedTop = Math.max(minTop, Math.min(rawTop, maxTop));

              card.style.left = `${clampedLeft}px`;
              card.style.top = `${clampedTop}px`;
            }
          }

          function onTimerUp() {
            window.removeEventListener("pointermove", onTimerMove);
            window.removeEventListener("pointerup", onTimerUp);
            window.removeEventListener("pointercancel", onTimerUp);

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

      const targetTime = timer.targetTimestamp;
      const initialDuration = timer.initialDurationMs || Math.max(1, targetTime - timer.createdAt);
      const remainingMs = targetTime - now;
      const isOverdue = remainingMs <= 0;
      const remainingSec = Math.floor(remainingMs / 1000);

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
  function addTimer(label, targetDate, note) {
    const now = Date.now();
    const targetTimestamp = targetDate.getTime();
    const duration = Math.max(1000, targetTimestamp - now);

    const newTimer = {
      id: "timer_" + now + "_" + Math.random().toString(36).substr(2, 4),
      label: label.trim() || "Countdown Timer",
      note: note ? note.trim() : "",
      targetTimestamp: targetTimestamp,
      createdAt: now,
      initialDurationMs: duration,
      alarmTriggered: false,
      alarmSilenced: false
    };

    activeTimers.push(newTimer);
    saveTimers();
    renderTimers();
  }

  /********************************************************************************
   * Updates an existing timer in the system
   ********************************************************************************/
  function updateTimer(id, label, targetDate, note) {
    const timer = activeTimers.find(t => t.id === id);
    if (!timer) return;

    const newTarget = targetDate.getTime();
    const now = Date.now();

    timer.label = label.trim() || "Countdown Timer";
    timer.note = note ? note.trim() : "";

    if (newTarget !== timer.targetTimestamp) {
      timer.targetTimestamp = newTarget;
      timer.initialDurationMs = Math.max(1000, newTarget - now);
      timer.alarmTriggered = false;
      timer.alarmSilenced = false;
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
    activeTimers = activeTimers.filter(t => t.id !== id);
    saveTimers();

    // If no remaining timers are overdue, silence the alarm
    const hasRemainingOverdue = activeTimers.some(t => t.targetTimestamp <= Date.now() && !t.alarmSilenced);
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
   * Modal Management (Creation & Editing)
   ********************************************************************************/
  function openCreateModal() {
    if (!modalOverlay) return;

    editingTimerId = null;
    if (modalTitle) modalTitle.textContent = "Create Countdown Timer";
    if (submitTimerBtn) submitTimerBtn.textContent = "Start Timer";

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
    if (modalTitle) modalTitle.textContent = "Edit Countdown Timer";
    if (submitTimerBtn) submitTimerBtn.textContent = "Save Changes";

    if (timerLabelInput) timerLabelInput.value = timer.label || "";
    if (timerNoteInput) timerNoteInput.value = timer.note || "";

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

  // Handle Form Submission (Create or Edit)
  if (createTimerForm) {
    createTimerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const label = timerLabelInput ? timerLabelInput.value : "";
      const note = timerNoteInput ? timerNoteInput.value : "";
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

      if (editingTimerId) {
        updateTimer(editingTimerId, label, targetDate, note);
      } else {
        addTimer(label, targetDate, note);
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
          const clamped = clampClockPos(rawLeft, rawTop);

          mainClockCard.style.left = `${clamped.left}px`;
          mainClockCard.style.top = `${clamped.top}px`;
          updateDefaultWidgetPositions();
        }
      }

      function onClockPointerUp() {
        window.removeEventListener("pointermove", onClockPointerMove);
        window.removeEventListener("pointerup", onClockPointerUp);
        window.removeEventListener("pointercancel", onClockPointerUp);

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
  });

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

