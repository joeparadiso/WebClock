/********************************************************************************
 * snapLayout.js -- WebClock Dashboard Snap-To, Buffer & Smart Reflow Engine
 * DETAILS:
 *  - Provides a unified 20px invisible buffer zone around all dashboard cards
 *    (.clock, #todo-container, .stopwatch-card, .timer-card).
 *  - Magnetic edge, center, and 20px buffer gap snapping while dragging with
 *    subtle glowing alignment guides and buffer zone highlights.
 *  - Hard buffer + Push/Swap physics:
 *      * Main Clock (.clock) is an immovable anchor when other cards interact
 *        with it: widgets cannot push or swap the Main Clock and instead scoot
 *        smoothly along its 20px buffer perimeter.
 *      * Movable widgets snap/stop at the 20px buffer on light contact, and
 *        swap or push neighbor widgets out of the way when pushed past the
 *        buffer threshold.
 *  - Smart non-overlapping slot placement when opening/creating widgets.
 *  - Automatic vertical column reflow (pushing stacked cards down when a card
 *    expands/grows, and compacting stacked cards upward when a card collapses
 *    or closes).
 *  - "Tidy Layout" action to cleanly re-balance and snap all visible cards.
 ********************************************************************************/

(function () {
  "use strict";

  const BUFFER_GAP = 20;
  const VIEWPORT_MARGIN = 16;
  const MIN_TOP = 54;
  const SNAP_THRESHOLD = 14;
  const PUSH_PENETRATION_THRESHOLD = 28;
  const SWAP_COOLDOWN_MS = 260;

  let guideOverlay = null;
  let lastSwapTime = 0;

  /********************************************************************************
   * Overlay DOM Management for Visual Snap Guides & Buffer Highlights
   ********************************************************************************/
  function ensureGuideOverlay() {
    if (guideOverlay && document.body.contains(guideOverlay)) {
      return guideOverlay;
    }
    guideOverlay = document.getElementById("snap-guides-overlay");
    if (!guideOverlay) {
      guideOverlay = document.createElement("div");
      guideOverlay.id = "snap-guides-overlay";
      guideOverlay.className = "snap-guides-overlay";
      guideOverlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(guideOverlay);
    }
    return guideOverlay;
  }

  function clearSnapGuides() {
    if (!guideOverlay) return;
    guideOverlay.innerHTML = "";
  }

  function renderSnapGuides(guides, bufferHighlights) {
    const overlay = ensureGuideOverlay();
    let html = "";

    if (Array.isArray(bufferHighlights)) {
      bufferHighlights.forEach(zone => {
        if (zone.width > 0 && zone.height > 0) {
          html += `<div class="snap-buffer-pill" style="left:${Math.round(zone.left)}px;top:${Math.round(zone.top)}px;width:${Math.round(zone.width)}px;height:${Math.round(zone.height)}px;"></div>`;
        }
      });
    }

    if (Array.isArray(guides)) {
      guides.forEach(g => {
        if (g.type === "vertical") {
          const top = Math.round(Math.min(g.y1, g.y2));
          const height = Math.round(Math.max(12, Math.abs(g.y2 - g.y1)));
          html += `<div class="snap-guide-line vertical" style="left:${Math.round(g.x)}px;top:${top}px;height:${height}px;"></div>`;
        } else if (g.type === "horizontal") {
          const left = Math.round(Math.min(g.x1, g.x2));
          const width = Math.round(Math.max(12, Math.abs(g.x2 - g.x1)));
          html += `<div class="snap-guide-line horizontal" style="left:${left}px;top:${Math.round(g.y)}px;width:${width}px;"></div>`;
        }
      });
    }

    overlay.innerHTML = html;
  }

  /********************************************************************************
   * Card Discovery & Geometry Helpers
   ********************************************************************************/
  function isElementVisible(el) {
    if (!el || !document.body.contains(el)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getCardDescriptor(el) {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const styleLeft = parseFloat(el.style.left);
    const styleTop = parseFloat(el.style.top);
    const left = !isNaN(styleLeft) && el.style.position === "fixed" ? styleLeft : rect.left;
    const top = !isNaN(styleTop) && el.style.position === "fixed" ? styleTop : rect.top;
    const width = rect.width || el.offsetWidth || 450;
    const height = rect.height || el.offsetHeight || 140;

    let type = "widget";
    let id = el.getAttribute("data-id") || el.id || "";
    let isAnchor = false;

    if (el.classList.contains("clock")) {
      type = "clock";
      id = "main-clock";
      isAnchor = true;
    } else if (el.id === "todo-container") {
      type = "todo";
      id = "todo-container";
    } else if (el.classList.contains("stopwatch-card")) {
      type = "stopwatch";
    } else if (el.classList.contains("timer-card")) {
      type = "alarm";
    }

    return {
      el,
      type,
      id,
      isAnchor,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      centerX: left + width / 2,
      centerY: top + height / 2
    };
  }

  function getVisibleCards(excludeEl = null) {
    const cards = [];

    const clockEl = document.querySelector(".clock");
    if (clockEl && clockEl !== excludeEl && isElementVisible(clockEl)) {
      cards.push(getCardDescriptor(clockEl));
    }

    const todoEl = document.getElementById("todo-container");
    if (todoEl && todoEl !== excludeEl && isElementVisible(todoEl)) {
      cards.push(getCardDescriptor(todoEl));
    }

    document.querySelectorAll(".stopwatch-card").forEach(swEl => {
      if (swEl !== excludeEl && isElementVisible(swEl)) {
        cards.push(getCardDescriptor(swEl));
      }
    });

    document.querySelectorAll(".timer-card").forEach(timerEl => {
      if (timerEl !== excludeEl && isElementVisible(timerEl)) {
        cards.push(getCardDescriptor(timerEl));
      }
    });

    return cards;
  }

  function clampToViewport(left, top, width, height) {
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    const maxTop = Math.max(MIN_TOP, window.innerHeight - height - VIEWPORT_MARGIN);
    return {
      left: Math.round(Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft))),
      top: Math.round(Math.max(MIN_TOP, Math.min(top, maxTop)))
    };
  }

  function animateCardTo(el, left, top) {
    if (!el) return;
    el.classList.add("is-layout-animating");
    el.style.position = "fixed";
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
    el.style.margin = "0";

    if (el._layoutAnimTimer) {
      clearTimeout(el._layoutAnimTimer);
    }
    el._layoutAnimTimer = setTimeout(() => {
      el.classList.remove("is-layout-animating");
      el._layoutAnimTimer = null;
    }, 300);
  }

  function persistCardPosition(cardDesc, left, top, animate = true) {
    if (!cardDesc || !cardDesc.el) return;
    const clamped = clampToViewport(left, top, cardDesc.width, cardDesc.height);
    cardDesc.left = clamped.left;
    cardDesc.top = clamped.top;
    cardDesc.right = clamped.left + cardDesc.width;
    cardDesc.bottom = clamped.top + cardDesc.height;
    cardDesc.centerX = clamped.left + cardDesc.width / 2;
    cardDesc.centerY = clamped.top + cardDesc.height / 2;

    if (animate) {
      animateCardTo(cardDesc.el, clamped.left, clamped.top);
    } else {
      cardDesc.el.style.position = "fixed";
      cardDesc.el.style.left = `${clamped.left}px`;
      cardDesc.el.style.top = `${clamped.top}px`;
      cardDesc.el.style.margin = "0";
    }

    if (cardDesc.type === "todo" && window.WebClockTodo && typeof window.WebClockTodo.setPositionFromLayout === "function") {
      window.WebClockTodo.setPositionFromLayout(clamped.left, clamped.top);
    } else if (cardDesc.type === "stopwatch" && window.WebClockStopwatch && typeof window.WebClockStopwatch.setCardPositionFromLayout === "function") {
      window.WebClockStopwatch.setCardPositionFromLayout(cardDesc.id, clamped.left, clamped.top);
    } else if (cardDesc.type === "alarm" && window.WebClockAlarms && typeof window.WebClockAlarms.setAlarmPositionFromLayout === "function") {
      window.WebClockAlarms.setAlarmPositionFromLayout(cardDesc.id, clamped.left, clamped.top);
    }
  }

  /********************************************************************************
   * Rectangle Overlap & Buffer Math
   ********************************************************************************/
  function getBufferedOverlap(a, b, gap = BUFFER_GAP) {
    const overlapX = Math.min(a.left + a.width + gap, b.left + b.width) - Math.max(a.left, b.left);
    const overlapY = Math.min(a.top + a.height + gap, b.top + b.height) - Math.max(a.top, b.top);
    // Exact symmetric check: expand b by gap on all sides
    const bExpLeft = b.left - gap;
    const bExpRight = b.left + b.width + gap;
    const bExpTop = b.top - gap;
    const bExpBottom = b.top + b.height + gap;

    const penLeft = (a.left + a.width) - bExpLeft;   // how far a's right edge is past b's left buffer
    const penRight = bExpRight - a.left;             // how far a's left edge is past b's right buffer
    const penTop = (a.top + a.height) - bExpTop;     // how far a's bottom edge is past b's top buffer
    const penBottom = bExpBottom - a.top;            // how far a's top edge is past b's bottom buffer

    if (penLeft <= 0 || penRight <= 0 || penTop <= 0 || penBottom <= 0) {
      return null;
    }

    const minX = Math.min(penLeft, penRight);
    const minY = Math.min(penTop, penBottom);

    return {
      penLeft,
      penRight,
      penTop,
      penBottom,
      minX,
      minY,
      penetration: Math.min(minX, minY)
    };
  }

  function buildBufferHighlightBetween(a, b) {
    const horizOverlapLeft = Math.max(a.left, b.left);
    const horizOverlapRight = Math.min(a.left + a.width, b.left + b.width);
    const vertOverlapTop = Math.max(a.top, b.top);
    const vertOverlapBottom = Math.min(a.top + a.height, b.top + b.height);

    // Side-by-side buffer highlight
    if (vertOverlapBottom - vertOverlapTop > 20) {
      const gapRightToLeft = b.left - (a.left + a.width);
      if (Math.abs(gapRightToLeft - BUFFER_GAP) <= 2) {
        return {
          left: a.left + a.width,
          top: vertOverlapTop,
          width: BUFFER_GAP,
          height: vertOverlapBottom - vertOverlapTop
        };
      }
      const gapLeftToRight = a.left - (b.left + b.width);
      if (Math.abs(gapLeftToRight - BUFFER_GAP) <= 2) {
        return {
          left: b.left + b.width,
          top: vertOverlapTop,
          width: BUFFER_GAP,
          height: vertOverlapBottom - vertOverlapTop
        };
      }
    }

    // Stacked vertical buffer highlight
    if (horizOverlapRight - horizOverlapLeft > 20) {
      const gapBottomToTop = b.top - (a.top + a.height);
      if (Math.abs(gapBottomToTop - BUFFER_GAP) <= 2) {
        return {
          left: horizOverlapLeft,
          top: a.top + a.height,
          width: horizOverlapRight - horizOverlapLeft,
          height: BUFFER_GAP
        };
      }
      const gapTopToBottom = a.top - (b.top + b.height);
      if (Math.abs(gapTopToBottom - BUFFER_GAP) <= 2) {
        return {
          left: horizOverlapLeft,
          top: b.top + b.height,
          width: horizOverlapRight - horizOverlapLeft,
          height: BUFFER_GAP
        };
      }
    }

    return null;
  }

  /********************************************************************************
   * Magnetic Edge, Center, and 20px Buffer Gap Snapping
   ********************************************************************************/
  function computeMagneticSnap(rawLeft, rawTop, width, height, otherCards) {
    let bestSnapX = { dist: SNAP_THRESHOLD + 1, left: rawLeft, guide: null };
    let bestSnapY = { dist: SNAP_THRESHOLD + 1, top: rawTop, guide: null };

    const right = rawLeft + width;
    const bottom = rawTop + height;
    const centerX = rawLeft + width / 2;
    const centerY = rawTop + height / 2;

    // 1. Viewport horizontal center snap
    const vpCenterX = window.innerWidth / 2;
    const distVpCenter = Math.abs(centerX - vpCenterX);
    if (distVpCenter <= SNAP_THRESHOLD && distVpCenter < bestSnapX.dist) {
      bestSnapX = {
        dist: distVpCenter,
        left: vpCenterX - width / 2,
        guide: {
          type: "vertical",
          x: vpCenterX,
          y1: MIN_TOP,
          y2: window.innerHeight - VIEWPORT_MARGIN
        }
      };
    }

    // 2. Compare against every visible card
    otherCards.forEach(other => {
      const spanY1 = Math.min(rawTop, other.top) - 8;
      const spanY2 = Math.max(bottom, other.bottom) + 8;
      const spanX1 = Math.min(rawLeft, other.left) - 8;
      const spanX2 = Math.max(right, other.right) + 8;

      // X-axis candidates:
      const xCandidates = [
        // Buffer gap to left of other card (dragged.right = other.left - BUFFER_GAP)
        {
          targetLeft: other.left - width - BUFFER_GAP,
          guideX: other.left - BUFFER_GAP / 2,
          isBufferSnap: true
        },
        // Buffer gap to right of other card (dragged.left = other.right + BUFFER_GAP)
        {
          targetLeft: other.right + BUFFER_GAP,
          guideX: other.right + BUFFER_GAP / 2,
          isBufferSnap: true
        },
        // Left-to-Left edge alignment
        {
          targetLeft: other.left,
          guideX: other.left
        },
        // Right-to-Right edge alignment
        {
          targetLeft: other.right - width,
          guideX: other.right
        },
        // CenterX-to-CenterX alignment
        {
          targetLeft: other.centerX - width / 2,
          guideX: other.centerX
        }
      ];

      xCandidates.forEach(cand => {
        const d = Math.abs(rawLeft - cand.targetLeft);
        if (d <= SNAP_THRESHOLD && d < bestSnapX.dist) {
          bestSnapX = {
            dist: d,
            left: cand.targetLeft,
            guide: {
              type: "vertical",
              x: cand.guideX,
              y1: spanY1,
              y2: spanY2
            }
          };
        }
      });

      // Y-axis candidates:
      const yCandidates = [
        // Buffer gap above other card (dragged.bottom = other.top - BUFFER_GAP)
        {
          targetTop: other.top - height - BUFFER_GAP,
          guideY: other.top - BUFFER_GAP / 2,
          isBufferSnap: true
        },
        // Buffer gap below other card (dragged.top = other.bottom + BUFFER_GAP)
        {
          targetTop: other.bottom + BUFFER_GAP,
          guideY: other.bottom + BUFFER_GAP / 2,
          isBufferSnap: true
        },
        // Top-to-Top edge alignment
        {
          targetTop: other.top,
          guideY: other.top
        },
        // Bottom-to-Bottom edge alignment
        {
          targetTop: other.bottom - height,
          guideY: other.bottom
        },
        // CenterY-to-CenterY alignment
        {
          targetTop: other.centerY - height / 2,
          guideY: other.centerY
        }
      ];

      yCandidates.forEach(cand => {
        const d = Math.abs(rawTop - cand.targetTop);
        if (d <= SNAP_THRESHOLD && d < bestSnapY.dist) {
          bestSnapY = {
            dist: d,
            top: cand.targetTop,
            guide: {
              type: "horizontal",
              y: cand.guideY,
              x1: spanX1,
              x2: spanX2
            }
          };
        }
      });
    });

    const activeGuides = [];
    if (bestSnapX.guide) activeGuides.push(bestSnapX.guide);
    if (bestSnapY.guide) activeGuides.push(bestSnapY.guide);

    return {
      left: bestSnapX.left,
      top: bestSnapY.top,
      guides: activeGuides
    };
  }

  /********************************************************************************
   * Main Clock Immovable Hard Buffer Clamp
   * Ensures nothing can push, overlap, or swap the Main Clock card (.clock).
   * Dragged widgets smoothly scoot along the Main Clock's 20px buffer perimeter.
   ********************************************************************************/
  function clampOutsideAnchorBuffer(proposed, anchorCard, gap = BUFFER_GAP) {
    const overlap = getBufferedOverlap(proposed, anchorCard, gap);
    if (!overlap) return proposed;

    let { left, top, width, height } = proposed;
    const minPen = Math.min(overlap.penLeft, overlap.penRight, overlap.penTop, overlap.penBottom);

    if (minPen === overlap.penLeft) {
      left = anchorCard.left - width - gap;
    } else if (minPen === overlap.penRight) {
      left = anchorCard.right + gap;
    } else if (minPen === overlap.penTop) {
      top = anchorCard.top - height - gap;
    } else {
      top = anchorCard.bottom + gap;
    }

    const clamped = clampToViewport(left, top, width, height);
    // Verify clamping to viewport didn't push it back into the anchor on a narrow screen
    const recheck = getBufferedOverlap(
      { left: clamped.left, top: clamped.top, width, height },
      anchorCard,
      gap
    );
    if (recheck) {
      // Secondary axis escape (e.g., if left/right of clock is narrower than card, slide above/below clock)
      if (minPen === overlap.penLeft || minPen === overlap.penRight) {
        if (overlap.penTop < overlap.penBottom && anchorCard.top - height - gap >= MIN_TOP) {
          top = anchorCard.top - height - gap;
        } else {
          top = anchorCard.bottom + gap;
        }
      } else {
        if (overlap.penLeft < overlap.penRight && anchorCard.left - width - gap >= VIEWPORT_MARGIN) {
          left = anchorCard.left - width - gap;
        } else {
          left = anchorCard.right + gap;
        }
      }
      return clampToViewport(left, top, width, height);
    }

    return clamped;
  }

  /********************************************************************************
   * Helper: Can a movable card fit at (targetLeft, targetTop) without hitting
   * the Main Clock or going out of viewport bounds?
   ********************************************************************************/
  function isValidWidgetPlacement(targetLeft, targetTop, width, height, anchorClock) {
    if (
      targetLeft < VIEWPORT_MARGIN - 2 ||
      targetLeft + width > window.innerWidth - VIEWPORT_MARGIN + 2 ||
      targetTop < MIN_TOP - 2 ||
      targetTop + height > window.innerHeight - VIEWPORT_MARGIN + 2
    ) {
      return false;
    }
    if (anchorClock) {
      const ov = getBufferedOverlap(
        { left: targetLeft, top: targetTop, width, height },
        anchorClock,
        BUFFER_GAP - 1
      );
      if (ov) return false;
    }
    return true;
  }

  /********************************************************************************
   * Drag Resolution Pipeline for Dashboard Widgets & Main Clock
   ********************************************************************************/
  function resolveDragPosition(draggedEl, rawLeft, rawTop, dragContext = {}) {
    if (!draggedEl) return { left: rawLeft, top: rawTop };

    const draggedRect = draggedEl.getBoundingClientRect();
    const width = draggedRect.width || draggedEl.offsetWidth || 450;
    const height = draggedRect.height || draggedEl.offsetHeight || 140;
    const isClock = draggedEl.classList.contains("clock");

    if (!dragContext.slotOrigin) {
      dragContext.slotOrigin = { left: rawLeft, top: rawTop };
    }

    const otherCards = getVisibleCards(draggedEl);
    const anchorClock = isClock ? null : otherCards.find(c => c.isAnchor);
    const movableOthers = otherCards.filter(c => !c.isAnchor);

    // Step 1: Clamp raw coordinates to viewport
    const rawClamped = clampToViewport(rawLeft, rawTop, width, height);

    // Step 2: Compute magnetic edge/center/buffer snap
    const snapped = computeMagneticSnap(rawClamped.left, rawClamped.top, width, height, otherCards);
    let candidate = clampToViewport(snapped.left, snapped.top, width, height);

    // If dragging the Main Clock itself:
    if (isClock) {
      const clockBox = { left: candidate.left, top: candidate.top, width, height };
      const bufferHighlights = [];

      // Main Clock pushes movable widgets out of its 20px buffer zone
      movableOthers.forEach(widget => {
        const ov = getBufferedOverlap(clockBox, widget, BUFFER_GAP);
        if (ov) {
          let newWLeft = widget.left;
          let newWTop = widget.top;
          const minPen = Math.min(ov.penLeft, ov.penRight, ov.penTop, ov.penBottom);

          if (minPen === ov.penLeft) {
            newWLeft = clockBox.left + clockBox.width + BUFFER_GAP;
          } else if (minPen === ov.penRight) {
            newWLeft = clockBox.left - widget.width - BUFFER_GAP;
          } else if (minPen === ov.penTop) {
            newWTop = clockBox.top + clockBox.height + BUFFER_GAP;
          } else {
            newWTop = clockBox.top - widget.height - BUFFER_GAP;
          }

          persistCardPosition(widget, newWLeft, newWTop, false);
        }
        const hl = buildBufferHighlightBetween(clockBox, widget);
        if (hl) bufferHighlights.push(hl);
      });

      renderSnapGuides(snapped.guides, bufferHighlights);
      return candidate;
    }

    // Step 3: Enforce Immovable Main Clock 20px Buffer Barrier
    if (anchorClock) {
      candidate = clampOutsideAnchorBuffer(
        { left: candidate.left, top: candidate.top, width, height },
        anchorClock,
        BUFFER_GAP
      );
    }

    // Step 4: Resolve collisions against other movable widgets (Hard Buffer vs. Push/Swap)
    const now = Date.now();
    for (let i = 0; i < movableOthers.length; i++) {
      const neighbor = movableOthers[i];
      const proposedBox = { left: candidate.left, top: candidate.top, width, height };
      const rawBox = { left: rawClamped.left, top: rawClamped.top, width, height };

      const bufferedOv = getBufferedOverlap(proposedBox, neighbor, BUFFER_GAP);
      if (!bufferedOv) continue;

      const rawOv = getBufferedOverlap(rawBox, neighbor, BUFFER_GAP);
      const rawPenetration = rawOv ? rawOv.penetration : bufferedOv.penetration;

      // Check horizontal overlap ratio to see if cards are in the same vertical column
      const horizOverlap = Math.min(proposedBox.left + width, neighbor.right) - Math.max(proposedBox.left, neighbor.left);
      const minCardWidth = Math.min(width, neighbor.width);
      const inSameColumn = horizOverlap > minCardWidth * 0.45;

      // If we recently swapped with this neighbor, keep the neighbor as a firm 20px barrier
      // until the user's cursor either enters the new slot or reverses direction by >= 24px
      if (dragContext.swapLock && dragContext.swapLock.neighborId === neighbor.id) {
        const lock = dragContext.swapLock;
        if (lock.direction === "down") {
          if (rawClamped.top >= neighbor.bottom + BUFFER_GAP - 4) {
            dragContext.swapLock = null;
          } else if (rawClamped.top > lock.triggerRawTop - 24) {
            candidate = { left: candidate.left, top: Math.max(candidate.top, neighbor.bottom + BUFFER_GAP) };
            continue;
          } else {
            dragContext.swapLock = null;
          }
        } else if (lock.direction === "up") {
          if (rawClamped.top + height <= neighbor.top - BUFFER_GAP + 4) {
            dragContext.swapLock = null;
          } else if (rawClamped.top < lock.triggerRawTop + 24) {
            candidate = { left: candidate.left, top: Math.min(candidate.top, neighbor.top - height - BUFFER_GAP) };
            continue;
          } else {
            dragContext.swapLock = null;
          }
        }
      }

      // Zone 1: Hard Buffer Stop (light/normal contact < PUSH_PENETRATION_THRESHOLD)
      if (rawPenetration < PUSH_PENETRATION_THRESHOLD) {
        const clampedToNeighbor = clampOutsideAnchorBuffer(proposedBox, neighbor, BUFFER_GAP);
        if (!anchorClock || !getBufferedOverlap({ ...clampedToNeighbor, width, height }, anchorClock, BUFFER_GAP - 1)) {
          candidate = { left: clampedToNeighbor.left, top: clampedToNeighbor.top };
        }
        continue;
      }

      // Zone 2: Intentional Push / Swap (deep penetration >= PUSH_PENETRATION_THRESHOLD)
      let handledBySwapOrPush = false;

      // 2A: Vertical Stack Swap when in the same column
      if (inSameColumn && now - lastSwapTime > SWAP_COOLDOWN_MS) {
        const originTop = dragContext.slotOrigin.top;
        const movingDown = rawClamped.top > originTop;
        let swapNeighborTop = originTop;
        let newOriginTop = neighbor.top;

        if (movingDown && neighbor.top > originTop - 10) {
          swapNeighborTop = originTop;
          newOriginTop = originTop + neighbor.height + BUFFER_GAP;
        } else if (!movingDown && neighbor.top < originTop + 10) {
          swapNeighborTop = originTop + height - neighbor.height;
          newOriginTop = neighbor.top;
        }

        const swapNeighborLeft = neighbor.left;
        if (isValidWidgetPlacement(swapNeighborLeft, swapNeighborTop, neighbor.width, neighbor.height, anchorClock)) {
          persistCardPosition(neighbor, swapNeighborLeft, swapNeighborTop, true);
          dragContext.slotOrigin = { left: neighbor.left, top: newOriginTop };
          dragContext.swapLock = {
            neighborId: neighbor.id,
            direction: movingDown ? "down" : "up",
            triggerRawTop: rawClamped.top
          };
          lastSwapTime = now;

          // Snap dragged card cleanly to the newly vacated slot
          const snappedAfterSwap = clampOutsideAnchorBuffer(
            { left: candidate.left, top: newOriginTop, width, height },
            neighbor,
            BUFFER_GAP
          );
          if (isValidWidgetPlacement(snappedAfterSwap.left, snappedAfterSwap.top, width, height, anchorClock)) {
            candidate = { left: snappedAfterSwap.left, top: snappedAfterSwap.top };
          }
          handledBySwapOrPush = true;
        }
      }

      // 2B: Directional Push if not swapped
      if (!handledBySwapOrPush) {
        const minPen = Math.min(bufferedOv.penLeft, bufferedOv.penRight, bufferedOv.penTop, bufferedOv.penBottom);
        let pushLeft = neighbor.left;
        let pushTop = neighbor.top;

        if (minPen === bufferedOv.penTop) {
          // Dragged card pushing neighbor downward
          pushTop = proposedBox.top + height + BUFFER_GAP;
        } else if (minPen === bufferedOv.penBottom) {
          // Dragged card pushing neighbor upward
          pushTop = proposedBox.top - neighbor.height - BUFFER_GAP;
        } else if (minPen === bufferedOv.penLeft) {
          // Dragged card pushing neighbor to the right
          pushLeft = proposedBox.left + width + BUFFER_GAP;
        } else {
          // Dragged card pushing neighbor to the left
          pushLeft = proposedBox.left - neighbor.width - BUFFER_GAP;
        }

        if (isValidWidgetPlacement(pushLeft, pushTop, neighbor.width, neighbor.height, anchorClock)) {
          persistCardPosition(neighbor, pushLeft, pushTop, true);
          dragContext.slotOrigin = { left: candidate.left, top: candidate.top };
          cascadePushFrom(neighbor, [draggedEl, neighbor.el], anchorClock);
          handledBySwapOrPush = true;
        } else {
          // If neighbor is blocked by viewport or Main Clock, try swapping neighbor to the trailing side of dragged card
          let oppositeLeft = neighbor.left;
          let oppositeTop = neighbor.top;
          if (minPen === bufferedOv.penTop) {
            oppositeTop = proposedBox.top - neighbor.height - BUFFER_GAP;
          } else if (minPen === bufferedOv.penBottom) {
            oppositeTop = proposedBox.top + height + BUFFER_GAP;
          } else if (minPen === bufferedOv.penLeft) {
            oppositeLeft = proposedBox.left - neighbor.width - BUFFER_GAP;
          } else {
            oppositeLeft = proposedBox.left + width + BUFFER_GAP;
          }

          if (
            now - lastSwapTime > SWAP_COOLDOWN_MS &&
            isValidWidgetPlacement(oppositeLeft, oppositeTop, neighbor.width, neighbor.height, anchorClock)
          ) {
            persistCardPosition(neighbor, oppositeLeft, oppositeTop, true);
            dragContext.slotOrigin = { left: candidate.left, top: candidate.top };
            lastSwapTime = now;
            handledBySwapOrPush = true;
          } else {
            // Hard-stop against neighbor so cards never overlap
            const stopped = clampOutsideAnchorBuffer(proposedBox, neighbor, BUFFER_GAP);
            candidate = { left: stopped.left, top: stopped.top };
          }
        }
      }
    }

    // Final safety check against Main Clock buffer
    if (anchorClock) {
      candidate = clampOutsideAnchorBuffer(
        { left: candidate.left, top: candidate.top, width, height },
        anchorClock,
        BUFFER_GAP
      );
    }

    // Collect buffer highlights for any card resting at BUFFER_GAP (20px) from the dragged card
    const finalBox = { left: candidate.left, top: candidate.top, width, height };
    const bufferHighlights = [];
    otherCards.forEach(other => {
      const hl = buildBufferHighlightBetween(finalBox, other);
      if (hl) bufferHighlights.push(hl);
    });

    renderSnapGuides(snapped.guides, bufferHighlights);
    return candidate;
  }

  function cascadePushFrom(pusherDesc, visitedEls, anchorClock) {
    const others = getVisibleCards().filter(c => !c.isAnchor && !visitedEls.includes(c.el));
    others.forEach(other => {
      const ov = getBufferedOverlap(pusherDesc, other, BUFFER_GAP);
      if (!ov) return;

      let nextLeft = other.left;
      let nextTop = other.top;
      if (ov.minY <= ov.minX) {
        if (pusherDesc.centerY <= other.centerY) {
          nextTop = pusherDesc.bottom + BUFFER_GAP;
        } else {
          nextTop = pusherDesc.top - other.height - BUFFER_GAP;
        }
      } else {
        if (pusherDesc.centerX <= other.centerX) {
          nextLeft = pusherDesc.right + BUFFER_GAP;
        } else {
          nextLeft = pusherDesc.left - other.width - BUFFER_GAP;
        }
      }

      if (isValidWidgetPlacement(nextLeft, nextTop, other.width, other.height, anchorClock)) {
        persistCardPosition(other, nextLeft, nextTop, true);
        visitedEls.push(other.el);
        cascadePushFrom(other, visitedEls, anchorClock);
      }
    });
  }

  /********************************************************************************
   * Non-Overlapping Slot Finder (For Opening/Spawning Cards & Default Positions)
   ********************************************************************************/
  function findAvailableSlot(cardEl, preferredSide = "left", fallbackWidth = 450, fallbackHeight = 160, existingCardsOverride = null) {
    const rect = cardEl ? cardEl.getBoundingClientRect() : { width: 0, height: 0 };
    const width = rect.width || (cardEl && cardEl.offsetWidth) || fallbackWidth;
    const height = rect.height || (cardEl && cardEl.offsetHeight) || fallbackHeight;

    const obstacles = existingCardsOverride || getVisibleCards(cardEl);
    const clockEl = document.querySelector(".clock");
    const clockRect = clockEl ? clockEl.getBoundingClientRect() : { left: 535, right: 1385, top: 80, bottom: 450 };

    const leftColX = Math.max(VIEWPORT_MARGIN, clockRect.left - width - BUFFER_GAP);
    const rightColX = Math.min(window.innerWidth - width - VIEWPORT_MARGIN, clockRect.right + BUFFER_GAP);
    const startTop = Math.max(MIN_TOP, Math.round(clockRect.top));

    const columnsToTry = preferredSide === "right"
      ? [rightColX, leftColX]
      : [leftColX, rightColX];

    function collidesWithAny(testLeft, testTop) {
      const box = { left: testLeft, top: testTop, width, height };
      for (let i = 0; i < obstacles.length; i++) {
        if (getBufferedOverlap(box, obstacles[i], BUFFER_GAP - 1)) {
          return obstacles[i];
        }
      }
      return null;
    }

    // Try preferred column, then opposite column
    for (let c = 0; c < columnsToTry.length; c++) {
      const colLeft = Math.round(columnsToTry[c]);
      let candidateTop = startTop;
      let safety = 0;

      while (candidateTop + height <= window.innerHeight - VIEWPORT_MARGIN && safety < 30) {
        const blocker = collidesWithAny(colLeft, candidateTop);
        if (!blocker) {
          return clampToViewport(colLeft, candidateTop, width, height);
        }
        candidateTop = Math.round(blocker.bottom + BUFFER_GAP);
        safety++;
      }
    }

    // Fallback: try placing below the Main Clock
    const belowClockTop = Math.round(clockRect.bottom + BUFFER_GAP);
    const belowCandidatesX = [
      Math.round(clockRect.left),
      Math.round(clockRect.right - width),
      leftColX,
      rightColX
    ];
    for (let i = 0; i < belowCandidatesX.length; i++) {
      const x = belowCandidatesX[i];
      if (!collidesWithAny(x, belowClockTop)) {
        return clampToViewport(x, belowClockTop, width, height);
      }
    }

    // Final fallback: stack at bottom of preferred column clamped to viewport
    return clampToViewport(columnsToTry[0], startTop, width, height);
  }

  /********************************************************************************
   * Smart Column Reflow:
   *  1. onCardGeometryChanged(changedEl, prevRect):
   *     - If card grew taller (expand, add item, first lap, resize): pushes
   *       cards stacked below it downward to maintain BUFFER_GAP (20px).
   *     - If card shrank (collapse, remove item, reset laps): pulls cards
   *       stacked below it upward to maintain BUFFER_GAP (20px).
   *  2. onCardClosed(closedRect):
   *     - When a card is closed/dismissed, slides any cards stacked below it
   *       in the same column upward so remaining cards don't look stranded.
   ********************************************************************************/
  function areHorizontallyAligned(rectA, rectB) {
    const overlap = Math.min(rectA.left + rectA.width, rectB.left + rectB.width) - Math.max(rectA.left, rectB.left);
    const minW = Math.min(rectA.width, rectB.width);
    return overlap > minW * 0.4;
  }

  function onCardGeometryChanged(changedEl, prevRect = null) {
    if (!changedEl || !isElementVisible(changedEl)) return;

    const currentDesc = getCardDescriptor(changedEl);
    const allCards = getVisibleCards(changedEl);
    const anchorClock = allCards.find(c => c.isAnchor);
    const movableCards = allCards
      .filter(c => !c.isAnchor)
      .sort((a, b) => a.top - b.top);

    // 1. If card was shrunk (e.g. collapsed) and we have its previous rect, compact cards that were directly below it
    if (prevRect && prevRect.height > currentDesc.height + 4) {
      let prevBottomCursor = prevRect.top + prevRect.height;
      let newBottomCursor = currentDesc.bottom;

      movableCards.forEach(card => {
        if (!areHorizontallyAligned(currentDesc, card)) return;
        const gapFromPrev = card.top - prevBottomCursor;
        if (gapFromPrev >= -10 && gapFromPrev <= BUFFER_GAP * 2.5) {
          const targetTop = newBottomCursor + BUFFER_GAP;
          if (isValidWidgetPlacement(card.left, targetTop, card.width, card.height, anchorClock)) {
            prevBottomCursor = card.bottom;
            persistCardPosition(card, card.left, targetTop, true);
            newBottomCursor = card.bottom;
          }
        }
      });
    }

    // 2. Sequential column pass for cards aligned with changedEl below its top edge
    let columnBottomCursor = currentDesc.bottom;
    movableCards.forEach(card => {
      if (!areHorizontallyAligned(currentDesc, card)) return;
      if (card.bottom <= currentDesc.top + 4) return;

      const minAllowedTop = columnBottomCursor + BUFFER_GAP;
      if (card.top < minAllowedTop) {
        if (isValidWidgetPlacement(card.left, minAllowedTop, card.width, card.height, anchorClock)) {
          persistCardPosition(card, card.left, minAllowedTop, true);
        } else {
          // Even if viewport is short, clamp to viewport bottom or move to an available slot so it never overlaps
          const clamped = clampToViewport(card.left, minAllowedTop, card.width, card.height);
          if (!getBufferedOverlap({ left: clamped.left, top: clamped.top, width: card.width, height: card.height }, currentDesc, BUFFER_GAP - 2)) {
            persistCardPosition(card, clamped.left, clamped.top, true);
          } else {
            const altSlot = findAvailableSlot(card.el, currentDesc.centerX < window.innerWidth / 2 ? "right" : "left", card.width, card.height);
            persistCardPosition(card, altSlot.left, altSlot.top, true);
          }
        }
      }
      if (areHorizontallyAligned(currentDesc, card)) {
        columnBottomCursor = Math.max(columnBottomCursor, card.bottom);
      }
    });

    // 3. Handle any horizontal overlap when widening a card (e.g. resizing To-Do width)
    movableCards.forEach(card => {
      const ov = getBufferedOverlap(currentDesc, card, BUFFER_GAP);
      if (ov && !areHorizontallyAligned(currentDesc, card)) {
        const targetLeft = currentDesc.centerX <= card.centerX
          ? currentDesc.right + BUFFER_GAP
          : currentDesc.left - card.width - BUFFER_GAP;
        if (isValidWidgetPlacement(targetLeft, card.top, card.width, card.height, anchorClock)) {
          persistCardPosition(card, targetLeft, card.top, true);
          cascadePushFrom(card, [changedEl, card.el], anchorClock);
        }
      }
    });
  }

  function onCardClosed(closedRect) {
    if (!closedRect || typeof closedRect.top !== "number") return;

    const allCards = getVisibleCards();
    const anchorClock = allCards.find(c => c.isAnchor);
    const clockTop = anchorClock ? anchorClock.top : 80;

    // Find all movable cards in the same vertical column that were below the closed card
    const columnCards = allCards
      .filter(c => !c.isAnchor && areHorizontallyAligned(closedRect, c))
      .sort((a, b) => a.top - b.top);

    if (columnCards.length === 0) return;

    // Determine the top anchor for the compacted stack in this column
    const cardsAbove = columnCards.filter(c => c.bottom <= closedRect.top + 8);
    const cardsBelow = columnCards.filter(c => c.top >= closedRect.top - 8);

    if (cardsBelow.length === 0) return;

    let currentTopCursor = cardsAbove.length > 0
      ? cardsAbove[cardsAbove.length - 1].bottom + BUFFER_GAP
      : Math.max(MIN_TOP, Math.min(closedRect.top, clockTop));

    cardsBelow.forEach(card => {
      if (card.top > currentTopCursor + 2) {
        if (isValidWidgetPlacement(card.left, currentTopCursor, card.width, card.height, anchorClock)) {
          persistCardPosition(card, card.left, currentTopCursor, true);
        }
      }
      currentTopCursor = card.bottom + BUFFER_GAP;
    });
  }

  /********************************************************************************
   * Tidy Layout: One-Click Clean Balanced Arrangement Around the Main Clock
   ********************************************************************************/
  function tidyLayout() {
    clearSnapGuides();

    const clockEl = document.querySelector(".clock");
    let clockRect = { left: 535, right: 1385, top: 80, bottom: 450, width: 850, height: 370 };

    if (clockEl && isElementVisible(clockEl)) {
      // If the Main Clock was manually moved, keep its position or snap it cleanly to horizontal center if near center
      const rawClockRect = clockEl.getBoundingClientRect();
      clockRect = {
        left: rawClockRect.left,
        right: rawClockRect.right,
        top: rawClockRect.top,
        bottom: rawClockRect.bottom,
        width: rawClockRect.width,
        height: rawClockRect.height
      };
    }

    const placedObstacles = clockEl && isElementVisible(clockEl)
      ? [getCardDescriptor(clockEl)]
      : [];

    // 1. Left Column Priority: To-Do List (if visible), followed by Stopwatches
    const todoEl = document.getElementById("todo-container");
    if (todoEl && isElementVisible(todoEl)) {
      const todoDesc = getCardDescriptor(todoEl);
      const slot = findAvailableSlot(todoEl, "left", todoDesc.width, todoDesc.height, placedObstacles);
      persistCardPosition(todoDesc, slot.left, slot.top, true);
      placedObstacles.push(todoDesc);
    }

    document.querySelectorAll(".stopwatch-card").forEach(swEl => {
      if (!isElementVisible(swEl)) return;
      const swDesc = getCardDescriptor(swEl);
      const slot = findAvailableSlot(swEl, "left", swDesc.width, swDesc.height, placedObstacles);
      persistCardPosition(swDesc, slot.left, slot.top, true);
      placedObstacles.push(swDesc);
    });

    // 2. Right Column Priority: Countdown Alarms
    document.querySelectorAll(".timer-card").forEach(timerEl => {
      if (!isElementVisible(timerEl)) return;
      const timerDesc = getCardDescriptor(timerEl);
      const slot = findAvailableSlot(timerEl, "right", timerDesc.width, timerDesc.height, placedObstacles);
      persistCardPosition(timerDesc, slot.left, slot.top, true);
      placedObstacles.push(timerDesc);
    });
  }

  /********************************************************************************
   * Initialization
   ********************************************************************************/
  function init() {
    ensureGuideOverlay();

    const tidyBtn = document.getElementById("tidy-layout-btn");
    if (tidyBtn) {
      tidyBtn.addEventListener("click", function () {
        tidyLayout();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.WebClockSnapLayout = {
    BUFFER_GAP,
    VIEWPORT_MARGIN,
    MIN_TOP,
    resolveDragPosition,
    clearSnapGuides,
    findAvailableSlot,
    onCardGeometryChanged,
    onCardClosed,
    tidyLayout,
    getVisibleCards,
    getCardDescriptor
  };
})();
