(function () {
  if (typeof window === "undefined" || !window.SurfModAPI) {
    console.warn("[HardcoreMode] SurfModAPI not found; mod not applied.");
    return;
  }

  if (window.__HARDCORE_MODE_INSTALLED__) return;
  window.__HARDCORE_MODE_INSTALLED__ = true;

  window.SurfModAPI.runWithClasses(function (classes) {
    const { te, xe, Se, ze, ke } = classes;

    // --- One life only ---
    const origResetGameData = te.prototype.resetGameData;
    te.prototype.resetGameData = function (...args) {
      origResetGameData.apply(this, args);
      if (this.game && this.game.lives) {
        this.game.lives.max = 1;
        this.game.lives.current = 1;
      }
    };
    if (te.sys && te.sys.game && te.sys.game.lives) {
      te.sys.game.lives.max = 1;
      te.sys.game.lives.current = 1;
    }

    // Helper: scale any {speed:{raw,max,current}} struct
    function scaleSpeed(obj, factor) {
      if (!obj || !obj.speed) return;
      if (typeof obj.speed.raw === "number") obj.speed.raw *= factor;
      if (typeof obj.speed.max === "number") obj.speed.max *= factor;
      if (typeof obj.speed.current === "number") obj.speed.current *= factor;
    }

    // --- Foes / NPCs move twice as fast ---
    if (xe && xe.prototype.reset) {
      const origXeReset = xe.prototype.reset;
      xe.prototype.reset = function (...args) {
        origXeReset.apply(this, args);
        scaleSpeed(this, 2); // NPCs
      };
    }

    if (Se && Se.prototype.reset) {
      const origSeReset = Se.prototype.reset;
      Se.prototype.reset = function (...args) {
        origSeReset.apply(this, args);
        scaleSpeed(this, 2); // Kraken / main foe
      };
    }

    // --- Player slightly faster (~20%) ---
    if (ze && ze.prototype.reset) {
      const origZeReset = ze.prototype.reset;
      ze.prototype.reset = function (...args) {
        origZeReset.apply(this, args);
        scaleSpeed(this, 1.2);
      };
    }

    // --- Obstacles spawn more often: rows closer together ---
    if (ke && ke.prototype.calcSpawnHeight) {
      const origCalcSpawnHeight = ke.prototype.calcSpawnHeight;
      ke.prototype.calcSpawnHeight = function (...args) {
        const h = origCalcSpawnHeight.apply(this, args);
        return typeof h === "number" ? h * 0.7 : h; // 30% closer
      };
    }

    console.log("[HardcoreMode] Hardcore modifiers applied.");
  });
})();