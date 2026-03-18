/**
 * autoheal.js — Lightweight, plug-and-play UX auto-repair script
 * Drop-in: <script src="autoheal.js"></script>
 * No dependencies. No configuration needed.
 * Version: 1.0.0
 */

(function (global) {
  "use strict";

  // ─────────────────────────────────────────────
  // 1. INJECT STYLES
  // ─────────────────────────────────────────────
  function injectStyles() {
    const css = `
      /* ── AutoHeal Toast Container ── */
      #autoheal-toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .autoheal-toast {
        pointer-events: auto;
        min-width: 260px;
        max-width: 360px;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 13.5px;
        font-weight: 500;
        line-height: 1.4;
        color: #fff;
        box-shadow: 0 4px 18px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(12px) scale(0.97);
        transition: opacity 0.25s ease, transform 0.25s ease;
        cursor: default;
        word-break: break-word;
      }

      .autoheal-toast.ah-show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .autoheal-toast.ah-hide {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
      }

      .autoheal-toast.ah-success { background: #1a9e5c; }
      .autoheal-toast.ah-error   { background: #d93025; }
      .autoheal-toast.ah-info    { background: #2563eb; }
      .autoheal-toast.ah-warning { background: #d97706; }

      .autoheal-toast-icon {
        font-size: 16px;
        flex-shrink: 0;
        line-height: 1;
      }

      .autoheal-toast-close {
        margin-left: auto;
        background: none;
        border: none;
        color: rgba(255,255,255,0.75);
        cursor: pointer;
        font-size: 16px;
        padding: 0 0 0 6px;
        line-height: 1;
        flex-shrink: 0;
        transition: color 0.15s;
      }
      .autoheal-toast-close:hover { color: #fff; }

      /* ── Offline Bar ── */
      #autoheal-offline-bar {
        position: fixed;
        top: 0; left: 0; right: 0;
        background: #1a1a1a;
        color: #fff;
        text-align: center;
        font-size: 13.5px;
        font-weight: 500;
        padding: 9px 16px;
        z-index: 2147483646;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        letter-spacing: 0.01em;
        transform: translateY(-100%);
        transition: transform 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      #autoheal-offline-bar.ah-visible {
        transform: translateY(0);
      }
      #autoheal-offline-bar.ah-online-flash {
        background: #1a9e5c;
      }

      /* ── Broken Image Placeholder ── */
      .autoheal-img-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 5px;
        background: #f0f0f0;
        border: 1.5px dashed #ccc;
        border-radius: 6px;
        color: #999;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 10px;
        min-width: 60px;
        min-height: 50px;
        box-sizing: border-box;
        text-align: center;
        vertical-align: middle;
      }
      .autoheal-img-wrap svg {
        opacity: 0.45;
      }
      .autoheal-img-label {
        font-size: 11px;
        color: #aaa;
        line-height: 1.3;
      }

      /* ── Copy Button for Code Blocks ── */
      .autoheal-pre-wrap {
        position: relative;
      }
      .autoheal-copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.85);
        font-size: 11.5px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 4px 10px;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        letter-spacing: 0.02em;
        line-height: 1.5;
      }
      .autoheal-copy-btn:hover {
        background: rgba(255,255,255,0.22);
        color: #fff;
      }
      .autoheal-copy-btn.ah-copied {
        background: #1a9e5c;
        border-color: #1a9e5c;
        color: #fff;
      }

      /* Light-background <pre> support */
      pre:not([class*="dark"]) .autoheal-copy-btn,
      .autoheal-pre-wrap.ah-light .autoheal-copy-btn {
        background: rgba(0,0,0,0.06);
        border-color: rgba(0,0,0,0.14);
        color: #444;
      }
      pre:not([class*="dark"]) .autoheal-copy-btn:hover,
      .autoheal-pre-wrap.ah-light .autoheal-copy-btn:hover {
        background: rgba(0,0,0,0.13);
        color: #111;
      }
    `;

    const style = document.createElement("style");
    style.id = "autoheal-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }


  // ─────────────────────────────────────────────
  // 2. TOAST NOTIFICATION SYSTEM
  // ─────────────────────────────────────────────
  const TOAST_ICONS = {
    success : "✓",
    error   : "✕",
    info    : "ℹ",
    warning : "⚠",
  };

  // Duplicate-suppression: track recent messages
  const _recentMessages = new Map(); // message → timestamp

  /**
   * notify(message, type, duration)
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration  ms (0 = sticky)
   */
  function notify(message, type, duration) {
    type     = type     || "info";
    duration = (duration === undefined) ? 4500 : duration;

    // Suppress exact duplicate within 3 s
    var now = Date.now();
    if (_recentMessages.has(message) && now - _recentMessages.get(message) < 3000) {
      return;
    }
    _recentMessages.set(message, now);

    var container = document.getElementById("autoheal-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "autoheal-toast-container";
      document.body.appendChild(container);
    }

    var toast = document.createElement("div");
    toast.className = "autoheal-toast ah-" + type;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");

    var icon = document.createElement("span");
    icon.className = "autoheal-toast-icon";
    icon.textContent = TOAST_ICONS[type] || "ℹ";

    var text = document.createElement("span");
    text.textContent = message;

    var closeBtn = document.createElement("button");
    closeBtn.className = "autoheal-toast-close";
    closeBtn.setAttribute("aria-label", "Dismiss");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", function () { dismissToast(toast); });

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add("ah-show");
      });
    });

    if (duration > 0) {
      setTimeout(function () { dismissToast(toast); }, duration);
    }

    return toast;
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.remove("ah-show");
    toast.classList.add("ah-hide");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }


  // ─────────────────────────────────────────────
  // 3. BROKEN IMAGE HANDLING
  // ─────────────────────────────────────────────

  // SVG placeholder icon (inline, no external request)
  var BROKEN_IMG_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 32 28" fill="none">' +
    '<rect x="1" y="1" width="30" height="26" rx="3" stroke="#ccc" stroke-width="1.5" fill="none"/>' +
    '<circle cx="10" cy="9" r="2.5" fill="#ccc"/>' +
    '<polyline points="1,20 10,11 17,18 22,13 31,22" stroke="#ccc" stroke-width="1.5" fill="none" stroke-linejoin="round"/>' +
    '</svg>';

  function handleBrokenImage(img) {
    // Avoid double-processing
    if (img.dataset.ahHandled) return;
    img.dataset.ahHandled = "1";

    // Capture original dimensions if set
    var w = img.getAttribute("width")  || img.offsetWidth  || 120;
    var h = img.getAttribute("height") || img.offsetHeight || 80;
    var alt = img.getAttribute("alt") || "Image";

    var wrap = document.createElement("span");
    wrap.className = "autoheal-img-wrap";
    wrap.style.width  = (parseInt(w, 10) || 120) + "px";
    wrap.style.height = (parseInt(h, 10) || 80)  + "px";
    wrap.title = "Could not load: " + (img.src || "(unknown)");

    wrap.innerHTML = BROKEN_IMG_SVG +
      '<span class="autoheal-img-label">Image not available</span>';

    if (img.parentNode) {
      img.parentNode.insertBefore(wrap, img);
      img.parentNode.removeChild(img);
    }
  }

  function initBrokenImages() {
    // Handle images already in DOM via error event delegation
    document.addEventListener("error", function (e) {
      if (e.target && e.target.tagName === "IMG") {
        handleBrokenImage(e.target);
      }
    }, true /* capture — fires before bubbling */);

    // Also scan images that may already be broken (cached error state)
    function scanExisting() {
      var imgs = document.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        // naturalWidth === 0 and complete === true → broken or empty src
        if (img.complete && img.naturalWidth === 0 && img.src && img.src !== location.href) {
          handleBrokenImage(img);
        }
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scanExisting);
    } else {
      scanExisting();
    }
  }


  // ─────────────────────────────────────────────
  // 4. GLOBAL ERROR HANDLING
  // ─────────────────────────────────────────────
  // Throttle to avoid flooding on repeated errors
  var _errorThrottle = 0;

  function initErrorHandling() {
    global.addEventListener("error", function (event) {
      var now = Date.now();
      if (now - _errorThrottle < 5000) return; // one per 5 s
      _errorThrottle = now;

      console.groupCollapsed("[AutoHeal] Uncaught Error");
      console.error("Message :", event.message);
      console.error("Source  :", event.filename, "line", event.lineno, "col", event.colno);
      if (event.error) console.error("Error   :", event.error);
      console.groupEnd();

      notify("Something went wrong, but the app is still running.", "error", 6000);
    });

    global.addEventListener("unhandledrejection", function (event) {
      var now = Date.now();
      if (now - _errorThrottle < 5000) return;
      _errorThrottle = now;

      console.groupCollapsed("[AutoHeal] Unhandled Promise Rejection");
      console.error("Reason:", event.reason);
      console.groupEnd();

      notify("Something went wrong, but the app is still running.", "error", 6000);
    });
  }


  // ─────────────────────────────────────────────
  // 5. OFFLINE / ONLINE DETECTION
  // ─────────────────────────────────────────────
  function initConnectivityDetection() {
    var bar = document.createElement("div");
    bar.id = "autoheal-offline-bar";
    bar.setAttribute("role", "status");
    bar.setAttribute("aria-live", "assertive");

    var _onlineFlashTimer = null;

    function showOffline() {
      bar.classList.remove("ah-online-flash");
      bar.innerHTML = "⚡ You are offline — check your connection";
      bar.classList.add("ah-visible");
    }

    function showOnline() {
      bar.classList.add("ah-online-flash");
      bar.innerHTML = "✓ Back online";

      // If it wasn't visible already, briefly flash it
      bar.classList.add("ah-visible");

      clearTimeout(_onlineFlashTimer);
      _onlineFlashTimer = setTimeout(function () {
        bar.classList.remove("ah-visible");
        setTimeout(function () { bar.classList.remove("ah-online-flash"); }, 400);
      }, 2500);
    }

    global.addEventListener("offline", showOffline);
    global.addEventListener("online",  showOnline);

    // Show bar immediately if already offline when script loads
    if (!navigator.onLine) {
      document.addEventListener("DOMContentLoaded", function () {
        document.body.appendChild(bar);
        showOffline();
      });
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        document.body.appendChild(bar);
      });
    }
  }


  // ─────────────────────────────────────────────
  // 6. SLOW LOAD DETECTION
  // ─────────────────────────────────────────────
  function initSlowLoadDetection() {
    var THRESHOLD_MS = 3000;
    var _slowTimer = null;
    var _toastRef  = null;

    // Start the slow-load timer as soon as script runs
    _slowTimer = setTimeout(function () {
      _toastRef = notify("Loading is taking longer than usual…", "warning", 0 /* sticky */);
    }, THRESHOLD_MS);

    // Cancel if page loads in time
    function onLoaded() {
      clearTimeout(_slowTimer);
      if (_toastRef) {
        dismissToast(_toastRef);
        _toastRef = null;
      }
    }

    if (document.readyState === "complete") {
      onLoaded();
    } else {
      global.addEventListener("load", onLoaded, { once: true });
    }

    // Also use Navigation Timing API for a more accurate post-load report
    global.addEventListener("load", function () {
      try {
        var timing = performance.timing;
        if (!timing) return;
        var loadTime = timing.loadEventEnd - timing.navigationStart;
        if (loadTime > THRESHOLD_MS) {
          console.info("[AutoHeal] Page load time:", loadTime + "ms");
        }
      } catch (e) { /* silence */ }
    });
  }


  // ─────────────────────────────────────────────
  // 7. COPY BUTTON FOR CODE BLOCKS
  // ─────────────────────────────────────────────

  /** Detect whether a <pre> has a light or dark background */
  function isLightBackground(el) {
    try {
      var bg = global.getComputedStyle(el).backgroundColor;
      // Parse rgb/rgba
      var m = bg.match(/\d+/g);
      if (!m || m.length < 3) return true;
      var r = +m[0], g = +m[1], b = +m[2];
      // If transparent / no background bubble up
      if (+m[3] === 0) return true;
      // Perceived luminance
      var lum = 0.299 * r + 0.587 * g + 0.114 * b;
      return lum > 128;
    } catch (e) {
      return true;
    }
  }

  /** Wrap a <pre> and inject a copy button */
  function addCopyButton(preEl) {
    if (preEl.dataset.ahCopy) return;
    preEl.dataset.ahCopy = "1";

    // Ensure the pre is positioned
    var existingPos = global.getComputedStyle(preEl).position;
    if (existingPos === "static") preEl.style.position = "relative";

    var btn = document.createElement("button");
    btn.className = "autoheal-copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");

    if (isLightBackground(preEl)) {
      btn.parentElement && btn.parentElement.classList.add("ah-light");
      btn.style.background    = "rgba(0,0,0,0.06)";
      btn.style.borderColor   = "rgba(0,0,0,0.14)";
      btn.style.color         = "#444";
    }

    btn.addEventListener("click", function () {
      var code = preEl.querySelector("code") || preEl;
      var text = code.innerText || code.textContent || "";

      var finish = function (ok) {
        if (ok) {
          btn.textContent = "Copied!";
          btn.classList.add("ah-copied");
          setTimeout(function () {
            btn.textContent = "Copy";
            btn.classList.remove("ah-copied");
          }, 2000);
        } else {
          btn.textContent = "Failed";
          setTimeout(function () { btn.textContent = "Copy"; }, 2000);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          finish(true);
        }).catch(function () {
          finish(legacyCopy(text));
        });
      } else {
        finish(legacyCopy(text));
      }
    });

    preEl.appendChild(btn);
  }

  /** Fallback copy via execCommand */
  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function initCopyButtons() {
    function processAll() {
      var pres = document.querySelectorAll("pre");
      for (var i = 0; i < pres.length; i++) {
        addCopyButton(pres[i]);
      }
    }

    // Initial scan after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", processAll);
    } else {
      processAll();
    }

    // Watch for dynamically added <pre> elements
    if (global.MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
          var nodes = mutations[m].addedNodes;
          for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            if (!node || node.nodeType !== 1) continue;
            if (node.tagName === "PRE") {
              addCopyButton(node);
            } else if (node.querySelectorAll) {
              var pres = node.querySelectorAll("pre");
              for (var p = 0; p < pres.length; p++) {
                addCopyButton(pres[p]);
              }
            }
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }


  // ─────────────────────────────────────────────
  // 8. BOOTSTRAP — wire everything up
  // ─────────────────────────────────────────────
  function boot() {
    injectStyles();
    initBrokenImages();
    initErrorHandling();
    initConnectivityDetection();
    initSlowLoadDetection();
    initCopyButtons();

    // Expose a minimal public API
    global.AutoHeal = {
      notify       : notify,
      version      : "1.0.0",
    };
  }

  // Run immediately — styles & event listeners are safe before DOMContentLoaded
  boot();

}(window));
