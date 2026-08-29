/********************************************************************************
 * todo.js -- March 2025 -- Joe Paradiso (To-Do List Engine)
 * DETAILS:
 *  - Manages persistent To-Do list with interactive checkboxes and item removal.
 *  - Navbar launcher "+ Create To-Do" opens the widget on the dashboard.
 *  - Movable & Draggable across the screen with bounds clamping and localStorage persistence.
 *  - Resizable with corner handle and saved dimensions in localStorage.
 *  - Collapsible header for privacy, defaulting to collapsed state.
 *  - Dynamic row creation with "+" header button and Enter key shortcut.
 *  - Completed tasks show filled checkbox matching theme text color and strikethrough.
 *  - Persistent storage across reloads via localStorage.
 ********************************************************************************/

(function () {
  "use strict";

  const STORAGE_KEY = "webclock_todo_list";
  const STORAGE_COLLAPSED_KEY = "webclock_todo_collapsed";
  const STORAGE_VISIBLE_KEY = "webclock_todo_visible";
  const STORAGE_POS_KEY = "webclock_todo_pos";
  const STORAGE_SIZE_KEY = "webclock_todo_size";

  const DEFAULT_TOP = 75;
  const DEFAULT_LEFT = 24;
  const DEFAULT_WIDTH = 415;
  const MIN_WIDTH = 260;
  const MAX_WIDTH = 800;
  const MIN_LIST_HEIGHT = 80;
  const MAX_LIST_HEIGHT = 650;

  let todoItems = [];
  let isCollapsed = true;
  let isVisible = false;
  let isCustomPosition = false;
  let position = null;
  let customSize = { width: DEFAULT_WIDTH, listHeight: 380 };

  // Drag state
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  // Resize state
  let isResizing = false;
  let resizeStart = { x: 0, y: 0, width: DEFAULT_WIDTH, listHeight: 380 };

  // DOM Elements
  let todoContainer = null;
  let todoCard = null;
  let todoHeader = null;
  let todoList = null;
  let resizeHandle = null;
  let collapseBtn = null;
  let addBtn = null;
  let closeBtn = null;
  let openTodoNavBtn = null;
  let countBadge = null;

  /********************************************************************************
   * LocalStorage Operations
   ********************************************************************************/
  function loadTodos() {
    try {
      const itemsData = localStorage.getItem(STORAGE_KEY);
      if (itemsData) {
        todoItems = JSON.parse(itemsData);
        if (!Array.isArray(todoItems)) todoItems = [];
      } else {
        todoItems = [];
      }

      const collapsedData = localStorage.getItem(STORAGE_COLLAPSED_KEY);
      // Default to collapsed (true) if not previously saved
      isCollapsed = collapsedData !== null ? JSON.parse(collapsedData) : true;

      const visibleData = localStorage.getItem(STORAGE_VISIBLE_KEY);
      // Default to hidden (false) until "+ Create To-Do" is clicked
      isVisible = visibleData !== null ? JSON.parse(visibleData) : false;

      const posData = localStorage.getItem(STORAGE_POS_KEY);
      if (posData) {
        try {
          const parsed = JSON.parse(posData);
          if (parsed && typeof parsed.left === "number" && typeof parsed.top === "number") {
            position = parsed;
            isCustomPosition = true;
          } else {
            position = null;
            isCustomPosition = false;
          }
        } catch (_) {
          position = null;
          isCustomPosition = false;
        }
      } else {
        position = null;
        isCustomPosition = false;
      }

      const sizeData = localStorage.getItem(STORAGE_SIZE_KEY);
      if (sizeData) {
        const parsedSize = JSON.parse(sizeData);
        if (parsedSize && typeof parsedSize.width === "number") {
          customSize = parsedSize;
        }
      }
    } catch (e) {
      console.warn("Could not load To-Do data from localStorage:", e);
      todoItems = [];
      isCollapsed = true;
      isVisible = false;
      position = null;
      isCustomPosition = false;
      customSize = { width: DEFAULT_WIDTH, listHeight: 380 };
    }
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todoItems));
      localStorage.setItem(STORAGE_COLLAPSED_KEY, JSON.stringify(isCollapsed));
      localStorage.setItem(STORAGE_VISIBLE_KEY, JSON.stringify(isVisible));
      if (isCustomPosition && position) {
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(position));
      } else {
        localStorage.removeItem(STORAGE_POS_KEY);
      }
      localStorage.setItem(STORAGE_SIZE_KEY, JSON.stringify(customSize));
    } catch (e) {
      console.warn("Could not save To-Do items to localStorage:", e);
    }
  }

  /********************************************************************************
   * Position & Sizing
   ********************************************************************************/
  function clampPosition(left, top) {
    if (!todoContainer) return { left, top };
    const rect = todoContainer.getBoundingClientRect();
    const width = rect.width || customSize.width || DEFAULT_WIDTH;
    const height = rect.height || 50;

    const maxLeft = Math.max(10, window.innerWidth - width - 10);
    const maxTop = Math.max(50, window.innerHeight - height - 10);
    const minTop = 48; // keep below navbar

    return {
      left: Math.max(10, Math.min(left, maxLeft)),
      top: Math.max(minTop, Math.min(top, maxTop))
    };
  }

  function getDefaultPosition() {
    const clockEl = document.querySelector(".clock");
    const todoWidth = (todoContainer && todoContainer.offsetWidth) || customSize.width || DEFAULT_WIDTH;
    if (clockEl) {
      const clockRect = clockEl.getBoundingClientRect();
      const targetLeft = clockRect.left - todoWidth - 24;
      const targetTop = clockRect.top;
      return clampPosition(targetLeft, targetTop);
    }
    return clampPosition(DEFAULT_LEFT, DEFAULT_TOP);
  }

  function applyPosition() {
    if (!todoContainer) return;
    if (!isCustomPosition || !position || typeof position.left !== "number") {
      position = getDefaultPosition();
    }
    const clamped = clampPosition(position.left, position.top);
    if (isCustomPosition) {
      position = clamped;
    }
    todoContainer.style.left = `${clamped.left}px`;
    todoContainer.style.top = `${clamped.top}px`;
  }

  function applySize() {
    if (!todoContainer) return;
    const width = Math.max(MIN_WIDTH, Math.min(customSize.width, Math.min(MAX_WIDTH, window.innerWidth - 20)));
    todoContainer.style.width = `${width}px`;

    if (todoList && customSize.listHeight) {
      const listH = Math.max(MIN_LIST_HEIGHT, Math.min(customSize.listHeight, MAX_LIST_HEIGHT));
      todoList.style.maxHeight = `${listH}px`;
    }
  }

  function updateDefaultPosition() {
    if (!isCustomPosition && todoContainer) {
      const defPos = getDefaultPosition();
      todoContainer.style.left = `${defPos.left}px`;
      todoContainer.style.top = `${defPos.top}px`;
    }
  }

  function resetToDefaultPosition() {
    isCustomPosition = false;
    position = null;
    try {
      localStorage.removeItem(STORAGE_POS_KEY);
    } catch (_) {}
    customSize = { width: DEFAULT_WIDTH, listHeight: 380 };
    if (todoContainer) {
      todoContainer.classList.remove("is-dragging");
      todoContainer.classList.remove("is-resizing");
      todoContainer.style.transition = "";
    }
    applyPosition();
    applySize();
    saveTodos();
  }

  /********************************************************************************
   * Drag to Move Handlers
   ********************************************************************************/
  function initDragHandlers() {
    if (!todoHeader || !todoContainer) return;

    let lastClickTime = 0;

    todoHeader.addEventListener("pointerdown", function (e) {
      // Don't start drag if clicking buttons or inputs inside header
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea")) return;

      let isDragging = false;
      const pointerDownPos = { x: e.clientX, y: e.clientY };
      const rect = todoContainer.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      function onPointerMove(moveEvent) {
        const dist = Math.hypot(moveEvent.clientX - pointerDownPos.x, moveEvent.clientY - pointerDownPos.y);
        if (!isDragging && dist > 5) {
          isDragging = true;
          todoContainer.classList.add("is-dragging");
          todoContainer.style.transition = "none";
        }

        if (isDragging) {
          const rawLeft = moveEvent.clientX - dragOffset.x;
          const rawTop = moveEvent.clientY - dragOffset.y;
          const clamped = clampPosition(rawLeft, rawTop);

          position = clamped;
          todoContainer.style.left = `${clamped.left}px`;
          todoContainer.style.top = `${clamped.top}px`;
        }
      }

      function onPointerUp() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);

        if (isDragging) {
          isDragging = false;
          isCustomPosition = true;
          todoContainer.classList.remove("is-dragging");
          todoContainer.style.transition = "";
          saveTodos();
          lastClickTime = 0;
        } else {
          // Double-click/tap reset
          const now = Date.now();
          if (now - lastClickTime < 350) {
            resetToDefaultPosition();
            lastClickTime = 0;
          } else {
            lastClickTime = now;
          }
        }
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });

    // Native double-click event support
    todoHeader.addEventListener("dblclick", function (e) {
      if (e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea")) return;
      e.stopPropagation();
      resetToDefaultPosition();
    });
  }

  /********************************************************************************
   * Resize Handlers
   ********************************************************************************/
  function initResizeHandlers() {
    if (!resizeHandle || !todoContainer) return;

    resizeHandle.addEventListener("pointerdown", function (e) {
      isResizing = true;
      todoContainer.classList.add("is-resizing");
      todoContainer.style.transition = "none";

      const containerRect = todoContainer.getBoundingClientRect();
      const listRect = todoList ? todoList.getBoundingClientRect() : { height: 380 };

      resizeStart = {
        x: e.clientX,
        y: e.clientY,
        width: containerRect.width,
        listHeight: listRect.height || 380
      };

      e.preventDefault();
      e.stopPropagation();

      function onResizeMove(moveEvent) {
        if (!isResizing) return;
        const deltaX = moveEvent.clientX - resizeStart.x;
        const deltaY = moveEvent.clientY - resizeStart.y;

        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + deltaX));
        const newListHeight = Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, resizeStart.listHeight + deltaY));

        customSize.width = newWidth;
        customSize.listHeight = newListHeight;

        todoContainer.style.width = `${newWidth}px`;
        if (todoList) {
          todoList.style.maxHeight = `${newListHeight}px`;
        }
      }

      function onResizeUp() {
        window.removeEventListener("pointermove", onResizeMove);
        window.removeEventListener("pointerup", onResizeUp);
        window.removeEventListener("pointercancel", onResizeUp);

        if (isResizing) {
          isResizing = false;
          todoContainer.classList.remove("is-resizing");
          todoContainer.style.transition = "";
          saveTodos();
        }
      }

      window.addEventListener("pointermove", onResizeMove);
      window.addEventListener("pointerup", onResizeUp);
      window.addEventListener("pointercancel", onResizeUp);
    });
  }

  /********************************************************************************
   * UI State Updaters
   ********************************************************************************/
  function updateCountBadge() {
    if (!countBadge) return;
    if (todoItems.length === 0) {
      countBadge.style.display = "none";
    } else {
      const completedCount = todoItems.filter(i => i.completed).length;
      countBadge.textContent = `${completedCount}/${todoItems.length}`;
      countBadge.style.display = "inline-flex";
    }
  }

  function setCollapsed(collapsed) {
    isCollapsed = Boolean(collapsed);
    if (!todoContainer) return;

    if (isCollapsed) {
      todoContainer.classList.add("collapsed");
      if (collapseBtn) {
        collapseBtn.innerHTML = "▶";
        collapseBtn.setAttribute("aria-expanded", "false");
        collapseBtn.setAttribute("title", "Expand To-Do List");
      }
    } else {
      todoContainer.classList.remove("collapsed");
      if (collapseBtn) {
        collapseBtn.innerHTML = "▼";
        collapseBtn.setAttribute("aria-expanded", "true");
        collapseBtn.setAttribute("title", "Collapse To-Do List");
      }
      applySize();
    }
    saveTodos();
  }

  function toggleCollapsed() {
    setCollapsed(!isCollapsed);
  }

  function showContainer(autoExpand = false) {
    if (!todoContainer) return;
    isVisible = true;
    todoContainer.style.display = "block";
    applyPosition();
    applySize();
    
    // Trigger pop-up entrance animation
    todoContainer.classList.remove("todo-popup-active");
    void todoContainer.offsetWidth; // force reflow for animation restart
    todoContainer.classList.add("todo-popup-active");

    if (autoExpand) {
      setCollapsed(false);
    }
    saveTodos();
  }

  function hideContainer() {
    if (!todoContainer) return;
    isVisible = false;
    todoContainer.style.display = "none";
    todoContainer.classList.remove("todo-popup-active");
    saveTodos();
  }

  /********************************************************************************
   * Item Operations: Add, Remove, Toggle Complete, Edit
   ********************************************************************************/
  function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.max(22, textarea.scrollHeight) + "px";
  }

  function createItemElement(item) {
    const li = document.createElement("li");
    li.className = `todo-item ${item.completed ? "completed" : ""}`;
    li.setAttribute("data-id", item.id);

    // Left checkbox button
    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = `todo-checkbox ${item.completed ? "checked" : ""}`;
    checkbox.setAttribute("aria-label", item.completed ? "Mark as incomplete" : "Mark as complete");
    checkbox.setAttribute("title", item.completed ? "Mark as incomplete" : "Mark as complete");
    checkbox.innerHTML = item.completed ? '<span class="checkmark">✓</span>' : "";

    checkbox.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleItemCompleted(item.id);
    });

    // Middle multi-line auto-wrapping text area
    const input = document.createElement("textarea");
    input.className = "todo-text-input";
    input.rows = 1;
    input.value = item.text || "";
    input.placeholder = "Enter task...";
    input.maxLength = 300;
    input.setAttribute("aria-label", "To-Do task text");

    // Auto-adjust height initially
    requestAnimationFrame(() => autoResizeTextarea(input));

    input.addEventListener("input", function () {
      item.text = this.value;
      autoResizeTextarea(this);
      saveTodos();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addItem("", false, true);
      }
    });

    // Right 'X' remove button
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "todo-item-remove-btn";
    removeBtn.setAttribute("aria-label", "Remove task");
    removeBtn.setAttribute("title", "Remove task");
    removeBtn.innerHTML = "✕";

    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeItem(item.id);
    });

    li.appendChild(checkbox);
    li.appendChild(input);
    li.appendChild(removeBtn);

    return { li, input };
  }

  function addItem(text = "", completed = false, focus = true) {
    // If collapsed, expand when adding a new item
    if (isCollapsed) {
      setCollapsed(false);
    }

    const newItem = {
      id: "todo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      text: text,
      completed: completed
    };

    todoItems.push(newItem);
    saveTodos();
    updateCountBadge();

    if (todoList) {
      const { li, input } = createItemElement(newItem);
      todoList.appendChild(li);
      if (focus) {
        setTimeout(() => input.focus(), 30);
      }
    }
  }

  function removeItem(id) {
    const index = todoItems.findIndex(i => i.id === id);
    if (index !== -1) {
      todoItems.splice(index, 1);
      saveTodos();
      updateCountBadge();
    }

    if (todoList) {
      const itemEl = todoList.querySelector(`[data-id="${id}"]`);
      if (itemEl) {
        itemEl.style.transition = "all 0.2s ease";
        itemEl.style.opacity = "0";
        itemEl.style.transform = "translateX(-15px)";
        setTimeout(() => {
          if (itemEl.parentNode) {
            itemEl.parentNode.removeChild(itemEl);
          }
        }, 200);
      }
    }
  }

  function toggleItemCompleted(id) {
    const item = todoItems.find(i => i.id === id);
    if (!item) return;

    item.completed = !item.completed;
    saveTodos();
    updateCountBadge();

    if (todoList) {
      const itemEl = todoList.querySelector(`[data-id="${id}"]`);
      if (itemEl) {
        const checkbox = itemEl.querySelector(".todo-checkbox");
        if (item.completed) {
          itemEl.classList.add("completed");
          if (checkbox) {
            checkbox.classList.add("checked");
            checkbox.innerHTML = '<span class="checkmark">✓</span>';
            checkbox.setAttribute("aria-label", "Mark as incomplete");
            checkbox.setAttribute("title", "Mark as incomplete");
          }
        } else {
          itemEl.classList.remove("completed");
          if (checkbox) {
            checkbox.classList.remove("checked");
            checkbox.innerHTML = "";
            checkbox.setAttribute("aria-label", "Mark as complete");
            checkbox.setAttribute("title", "Mark as complete");
          }
        }
      }
    }
  }

  function renderList() {
    if (!todoList) return;
    todoList.innerHTML = "";

    todoItems.forEach(item => {
      const { li } = createItemElement(item);
      todoList.appendChild(li);
    });

    updateCountBadge();
  }

  /********************************************************************************
   * DOM Initialization
   ********************************************************************************/
  function init() {
    todoContainer = document.getElementById("todo-container");
    todoCard = document.getElementById("todo-card");
    todoHeader = document.getElementById("todo-header");
    todoList = document.getElementById("todo-list");
    resizeHandle = document.getElementById("todo-resize-handle");
    collapseBtn = document.getElementById("todo-collapse-btn");
    addBtn = document.getElementById("todo-add-btn");
    closeBtn = document.getElementById("todo-close-btn");
    openTodoNavBtn = document.getElementById("open-todo-btn");
    countBadge = document.getElementById("todo-count-badge");

    loadTodos();

    // Set initial container position, size and visibility
    if (todoContainer) {
      applyPosition();
      applySize();

      if (isVisible) {
        todoContainer.style.display = "block";
      } else {
        todoContainer.style.display = "none";
      }
      setCollapsed(isCollapsed);
    }

    renderList();

    // Init Drag & Resize interactions
    initDragHandlers();
    initResizeHandlers();

    // Keep widget within bounds on browser resize
    window.addEventListener("resize", function () {
      applyPosition();
      applySize();
    });

    // Event listeners
    if (openTodoNavBtn) {
      openTodoNavBtn.addEventListener("click", function () {
        if (!isVisible || todoContainer.style.display === "none") {
          showContainer(false);
        } else {
          showContainer(false);
        }
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleCollapsed();
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        addItem("", false, true);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        hideContainer();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose API on window for external usage or debugging
  window.WebClockTodo = {
    addItem,
    removeItem,
    toggleItemCompleted,
    setCollapsed,
    showContainer,
    hideContainer,
    resetToDefaultPosition,
    updateDefaultPosition,
    getItems: () => todoItems
  };
})();
