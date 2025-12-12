// Simple mod: makes the player move much faster in all modes.
(function () {
  if (!window.SurfModAPI) return;

  window.SurfModAPI.runWithClasses(({ ze }) => {
    const originalUpdateSpeed = ze.prototype.updateSpeed;

    ze.prototype.updateSpeed = function superFastUpdateSpeed() {
      // Crank up base/max speed and acceleration every frame
      this.speed.base = 2000000000;      // default was 7.5
      this.speed.max = 40000000000;       // allow very high top speed
      this.speed.accel = 1005;   // accelerate much faster

      return originalUpdateSpeed.call(this);
    };
  });
})();