// Infinite Health & Boosts mod

(function () {
    function enableInfiniteCheats(classes) {
        const { Ze, te, ue } = classes;

        if (!Ze || !te || !ue) return;

        const originalTriggerStart = Ze.prototype.triggerStart;

        Ze.prototype.triggerStart = function (...args) {
            const result = originalTriggerStart.apply(this, args);

            const game = te.sys.game;

            // Turn on built-in cheat flags
            game.cheat.used = true;
            game.cheat.lives = true;
            game.cheat.boosts = true;

            // Top off lives and boosts
            game.lives.current = game.lives.max;
            game.boosts.current = game.boosts.max;

            // Refresh UI icons
            ue.sys.updateIcons();

            return result;
        };
    }

    function initWhenAPIReady() {
        if (window.SurfModAPI && typeof window.SurfModAPI.runWithClasses === "function") {
            window.SurfModAPI.runWithClasses(enableInfiniteCheats);
        } else {
            // Retry until SurfModAPI is available
            setTimeout(initWhenAPIReady, 100);
        }
    }

    initWhenAPIReady();
})();