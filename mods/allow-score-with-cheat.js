// Keep score counting enabled even when cheats are active

(function () {
    function patchCheat() {
        if (!window.SurfModAPI || typeof window.SurfModAPI.runInClassScope !== "function") {
            console.warn("[CheatScoreMod] SurfModAPI not available; aborting patch.");
            return;
        }

        window.SurfModAPI.runInClassScope("Ae", function (AeClass) {
            const proto = AeClass && AeClass.prototype;
            if (!proto || typeof proto.cheat !== "function") {
                console.warn("[CheatScoreMod] Ae.cheat not found; aborting patch.");
                return;
            }

            const originalCheat = proto.cheat;

            proto.cheat = function (flag, enable = true) {
                // Run original behavior
                originalCheat.call(this, flag, enable);

                // But never mark the game as 'cheated' for scoring purposes
                try {
                    if (te && te.sys && te.sys.game && te.sys.game.cheat) {
                        te.sys.game.cheat.used = false;
                    }
                } catch (err) {
                    console.error("[CheatScoreMod] Error clearing cheat.used", err);
                }
            };

            console.log("[CheatScoreMod] Ae.cheat patched; scores will still count with cheats.");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", patchCheat);
    } else {
        patchCheat();
    }
})();