// ...existing code...
(function () {
    if (typeof window === "undefined" || !window.SurfModAPI) return;

    window.SurfModAPI.runWithClasses(function (classes) {
        const { Ne, ze } = classes;
        if (!Ne || !ze) return;

        // Keep original collision for NPC/foe logic, etc.
        const originalCollision = Ne.prototype.collision;
        if (!originalCollision) return;

        Ne.prototype.__originalCollision = originalCollision;

        // Disable any collision that involves the player (ze.sys)
        Ne.prototype.collision = function (a, b) {
            const player = ze.sys;
            if (!player) {
                // Fallback to original if player not ready yet
                return originalCollision.call(this, a, b);
            }

            // If either side of the collision is the player, say "no collision"
            if (a === player || b === player) {
                return false;
            }

            // Otherwise, use the original behavior
            return originalCollision.call(this, a, b);
        };

        console.log("[Surf Mod] No-collision mod loaded: player collisions disabled.");
    });
})();
// ...existing code...