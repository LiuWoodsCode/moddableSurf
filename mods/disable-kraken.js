// Disable Kraken (foe) completely

(function () {
    if (!window.SurfModAPI) return;

    window.SurfModAPI.runWithClasses(({ ke, Se, Ne }) => {
        if (!ke || !Ne) return;

        const keProto = ke.prototype;
        const keSys = ke.sys;

        // 1) Prevent new foes from spawning via the regular spawner
        const origCreateFoe = keProto.createFoe;
        keProto.createFoe = function () {
            // No-op: never spawn Kraken
            return null;
        };

        // 2) Prevent any code path that tries to build a "foe" object
        const origBuildObject = keProto.buildObject;
        keProto.buildObject = function (type, x, y, pose) {
            if (type === "foe") {
                return null; // skip creating Kraken objects entirely
            }
            return origBuildObject.call(this, type, x, y, pose);
        };

        // 3) Make any existing foes harmless (safety net)
        if (Se && Se.prototype) {
            const seProto = Se.prototype;
            seProto.update = function () { /* do nothing */ };
            seProto.crash = function () { /* do nothing */ };
            seProto.resume = function () { /* do nothing */ };
            seProto.ending = function () { /* do nothing */ };
        }

        // 4) Ignore foe collisions in the collision system
        const neProto = Ne.prototype;
        const origCheckCollisions = neProto.checkCollisions;

        neProto.checkCollisions = function () {
            // Temporarily hide foes from the collision system
            let savedFoes = null;
            if (keSys && Array.isArray(keSys.foe)) {
                savedFoes = keSys.foe;
                keSys.foe = [];
            }
            try {
                return origCheckCollisions.call(this);
            } finally {
                if (savedFoes) {
                    keSys.foe = savedFoes;
                }
            }
        };
    });
})();