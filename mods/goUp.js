// Go Up mod – treat "stop" input as moving back up, not stopping
(function () {
    if (!window.SurfModAPI) return;

    window.SurfModAPI.runWithClasses(function (classes) {
        const { ze, Me } = classes;
        if (!ze) return;

        const proto = ze.prototype;
        const originalStop = proto.stop;

        proto.stop = function () {
            // If we're basically stopped already, keep original behavior
            if (this.speed.current <= 0 && this.speed.raw <= 0) {
                return originalStop.call(this);
            }

            // Otherwise: "stop" means face up and keep current speed (move back up)
            this.changeDirection("stop");

            try {
                Me && Me.sys && Me.sys.setVibration && Me.sys.setVibration("tiny");
            } catch (_) {
                /* ignore */
            }
        };

        console.log("[Surf Mod] Go Up: 'stop' now moves you back up instead of stopping.");
    });
})();