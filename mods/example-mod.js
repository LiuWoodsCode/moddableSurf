// Example Mod template for Microsoft Edge Surf
// This file is loaded dynamically when the mod is enabled via the Mods menu.

(function () {
  const MOD_ID = "example-mod";

  function getTimestamp() {
    return new Date().toISOString();
  }

  console.log("[Surf Mod Template] Loaded", MOD_ID, "@", getTimestamp());

  // =============================
  // Lifecycle hook placeholders
  // =============================

  // Runs immediately when this script is evaluated.
  function onScriptLoad() {
    console.log("[Surf Mod Template] onScriptLoad", MOD_ID, "@", getTimestamp());
    // TODO: Code that should run as soon as the mod file is loaded.
  }

  // Runs once the DOM is interactive (DOMContentLoaded).
  function onDomReady() {
    console.log("[Surf Mod Template] onDomReady", MOD_ID, "@", getTimestamp());
    // TODO: Code that can assume basic DOM structure exists.
  }

  // Runs when the window load event fires (all assets loaded).
  function onWindowLoad() {
    console.log("[Surf Mod Template] onWindowLoad", MOD_ID, "@", getTimestamp());
    alert("Example Mod loaded! Check JS console.");
    // TODO: Code that can assume images/fonts/etc. are loaded.
  }

  // =============================
  // Internal wiring / utilities
  // =============================

  const REACT_ROOT_SELECTOR = "#root, #app, #game-root, [data-reactroot], [data-surf-root]";

  function waitForReactRoot() {
    const existing = document.querySelector(REACT_ROOT_SELECTOR);
    if (existing) {
      handleReactRoot(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const root = document.querySelector(REACT_ROOT_SELECTOR);
      if (root) {
        observer.disconnect();
        handleReactRoot(root);
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function handleReactRoot(rootElement) {
    try {
      onReactRootAvailable(rootElement);
    } catch (e) {
      console.error("[Surf Mod Template] Error in onReactRootAvailable", e);
    }

    // Approximate hydration completion by waiting a couple of frames / idle.
    const runHydrationCallback = () => {
      try {
        onHydrationComplete(rootElement);
      } catch (e) {
        console.error("[Surf Mod Template] Error in onHydrationComplete", e);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(runHydrationCallback);
        });
      });
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(runHydrationCallback);
      });
    }
  }

  function safeCall(fn, label) {
    try {
      fn();
    } catch (e) {
      console.error("[Surf Mod Template] Error in", label, e);
    }
  }

  // =============================
  // Boot sequence
  // =============================

  // 1. As soon as script loads.
  safeCall(onScriptLoad, "onScriptLoad");

  // 2. DOM ready + 3. window load.
  function handleDomReady() {
    safeCall(onDomReady, "onDomReady");
    // Start watching for React root once DOM is ready.
    waitForReactRoot();
  }

  function handleWindowLoad() {
    safeCall(onWindowLoad, "onWindowLoad");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", handleDomReady, { once: true });
    window.addEventListener("load", handleWindowLoad, { once: true });
  } else if (document.readyState === "interactive") {
    handleDomReady();
    window.addEventListener("load", handleWindowLoad, { once: true });
  } else {
    // "complete" – DOM and resources already loaded.
    handleDomReady();
    handleWindowLoad();
  }
})();
