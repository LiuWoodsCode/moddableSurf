// ...existing code...
(function () {
  const TARGET = 2147483647;     // overflow trigger
  const OFFSET = 100;            // how far before it we stop
  const TARGET_UNIT = TARGET - OFFSET;

  function warpNearMaxDistance(classes) {
    const { te, ue } = classes;
    const sys = te.sys;
    if (!sys || !sys.game) return;

    // Only make sense in endless mode
    if (sys.session.settings.mode !== "endless") {
      console.warn("[NearMaxDistance] Only works in Endless mode.");
      return;
    }

    // Set logical distance (score)
    sys.game.dist.unit = TARGET_UNIT;

    // Keep y consistent with how unit is calculated (unit += y / 10)
    sys.game.dist.y = TARGET_UNIT * 10;

    // Optional: mark as cheat so high scores don’t count
    sys.game.cheat.used = true;

    // Refresh UI
    ue.sys.updateScore();
    ue.sys.sendNotification("cheat");

    console.log(
      "[NearMaxDistance] Warped to",
      TARGET_UNIT,
      "units (100 before overflow)."
    );
  }

  function install() {
    if (
      typeof window === "undefined" ||
      !window.SurfModAPI ||
      typeof window.SurfModAPI.runWithClasses !== "function"
    ) {
      console.warn("[NearMaxDistance] SurfModAPI not available.");
      return;
    }

    window.SurfModAPI.runWithClasses((classes) => {
      console.log(
        "[NearMaxDistance] Loaded. Press Ctrl+Shift+M in Endless mode to warp near max distance."
      );

      window.addEventListener("keydown", (ev) => {
        if (ev.ctrlKey && ev.shiftKey && ev.code === "KeyM") {
          ev.preventDefault();
          warpNearMaxDistance(classes);
        }
      });
    });
  }

  install();
})();