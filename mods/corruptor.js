(function () {
    if (typeof window === "undefined" || !window.SurfModAPI) return;
    if (window.__surfChaosShortcutInstalled) return;
    window.__surfChaosShortcutInstalled = true;

    const HOTKEY = {
        key: "Q",        // letter (not case-sensitive)
        ctrl: true,      // require Ctrl
        shift: true,     // require Shift
        alt: false,      // require Alt
    };

    function hotkeyMatches(e) {
        if (e.key.toUpperCase() !== HOTKEY.key.toUpperCase()) return false;
        if (!!HOTKEY.ctrl !== e.ctrlKey) return false;
        if (!!HOTKEY.shift !== e.shiftKey) return false;
        if (!!HOTKEY.alt !== e.altKey) return false;
        return true;
    }

    function install(classes) {
        const { te, he, de, pe, ke, Me } = classes;

        // Helpers to corrupt raw bytes of values
        function numberToBytes(value) {
            const buf = new ArrayBuffer(8);
            const view = new DataView(buf);
            view.setFloat64(0, value, true);
            return new Uint8Array(buf);
        }

        function bytesToNumber(bytes) {
            if (!bytes || bytes.byteLength < 8) return NaN;
            const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + 8);
            const view = new DataView(buf);
            return view.getFloat64(0, true);
        }

        function booleanToBytes(value) {
            return new Uint8Array([value ? 1 : 0]);
        }

        function bytesToBoolean(bytes) {
            if (!bytes || bytes.byteLength === 0) return false;
            return !!bytes[0];
        }

        function stringToBytes(str) {
            const buf = new ArrayBuffer(str.length * 2);
            const view = new Uint16Array(buf);
            for (let i = 0; i < str.length; i++) {
                view[i] = str.charCodeAt(i);
            }
            return new Uint8Array(buf);
        }

        function bytesToString(bytes) {
            if (!bytes) return "";
            const len = Math.floor(bytes.byteLength / 2);
            const view = new Uint16Array(bytes.buffer, bytes.byteOffset, len);
            let out = "";
            for (let i = 0; i < view.length; i++) {
                out += String.fromCharCode(view[i]);
            }
            return out;
        }

        function objectToBytes(obj) {
            try {
                const json = JSON.stringify(obj);
                if (typeof json !== "string") return null;
                return stringToBytes(json);
            } catch {
                return null;
            }
        }

        function bytesToObject(bytes) {
            try {
                const json = bytesToString(bytes);
                return JSON.parse(json);
            } catch {
                return null;
            }
        }

        function corruptBytes(bytes) {
            if (!bytes || bytes.byteLength === 0) return bytes;
            const count = 1 + Math.floor(Math.random() * Math.max(1, bytes.byteLength / 4));
            for (let i = 0; i < count; i++) {
                const idx = Math.floor(Math.random() * bytes.byteLength);
                const bit = 1 << Math.floor(Math.random() * 8);
                bytes[idx] ^= bit;
            }
            return bytes;
        }

        function mutate(value) {
            const type = typeof value;
            try {
                let bytes;
                switch (type) {
                    case "number":
                        if (!isFinite(value)) return value;
                        bytes = numberToBytes(value);
                        bytes = corruptBytes(bytes);
                        return bytesToNumber(bytes);
                    case "boolean":
                        bytes = booleanToBytes(value);
                        bytes = corruptBytes(bytes);
                        return bytesToBoolean(bytes);
                    case "string":
                        if (!value.length) return value;
                        bytes = stringToBytes(value);
                        bytes = corruptBytes(bytes);
                        return bytesToString(bytes);
                    case "object":
                        if (!value) return value;
                        bytes = objectToBytes(value);
                        if (!bytes) return value;
                        bytes = corruptBytes(bytes);
                        const mutated = bytesToObject(bytes);
                        return mutated == null ? value : mutated;
                    default:
                        return value;
                }
            } catch {
                return value;
            }
        }

        function glitch(current) {
            return mutate(current);
        }

        // NEW: randomly walk the class objects and corrupt several random props
        function randomClassCorruption() {
            const roots = [te, he, de, pe, ke, Me].filter(Boolean);
            const visited = new Set();
            const candidates = [];
            const MAX_DEPTH = 4;
            const MAX_CANDIDATES = 300;

            function collect(obj, depth) {
                if (!obj || typeof obj !== "object" || depth > MAX_DEPTH) return;
                if (visited.has(obj)) return;
                visited.add(obj);

                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

                    let val;
                    try {
                        val = obj[key];
                    } catch {
                        continue;
                    }

                    const t = typeof val;
                    if (t === "function") continue;

                    // skip obvious DOM/window-like things
                    if (val && (val.nodeType || (typeof Window !== "undefined" && val instanceof Window))) {
                        continue;
                    }

                    if (Math.random() < 0.15) {
                        candidates.push({ obj, key });
                        if (candidates.length >= MAX_CANDIDATES) return;
                    }

                    if (t === "object") collect(val, depth + 1);
                }
            }

            roots.forEach(r => collect(r, 0));

            if (!candidates.length) return;

            const numCorrupt = 5 + Math.floor(Math.random() * 98); // 5–102 random vars
            for (let i = 0; i < numCorrupt; i++) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                try {
                    target.obj[target.key] = glitch(target.obj[target.key]);
                } catch {
                }
            }
        }

        function chaos() {
            try {
                const sys = te.sys;
                if (!sys) return;
                const game = sys.game;
                const session = sys.session;

                // Core timing / distance
                game.time.loop = glitch(game.time.loop);
                game.time.elapsed = glitch(game.time.elapsed);
                game.time.scale = glitch(game.time.scale);

                // Resources
                game.lives.current = glitch(game.lives.current);
                game.lives.max = glitch(game.lives.max);
                game.lives.numCollected = glitch(game.lives.numCollected);

                game.boosts.current = glitch(game.boosts.current);
                game.boosts.max = glitch(game.boosts.max);
                game.boosts.numCollected = glitch(game.boosts.numCollected);
                game.boosts.numUsed = glitch(game.boosts.numUsed);

                game.shields.current = glitch(game.shields.current);
                game.shields.max = glitch(game.shields.max);

                // Scoring / flags
                game.gates = glitch(game.gates);
                game.coins = glitch(game.coins);
                game.finish = glitch(game.finish);
                game.friend = glitch(game.friend);
                game.caught = glitch(game.caught);
                game.highScore = glitch(game.highScore);

                // Cheat flags
                game.cheat.used = glitch(game.cheat.used);
                game.cheat.lives = glitch(game.cheat.lives);
                game.cheat.boosts = glitch(game.cheat.boosts);
                game.cheat.safety = glitch(game.cheat.safety);

                // Session / settings
                session.state = glitch(session.state);
                session.settings.gameSpeed = glitch(session.settings.gameSpeed);
                session.settings.mode = glitch(session.settings.mode);
                session.settings.theme = glitch(session.settings.theme);
                session.settings.character = glitch(session.settings.character);
                session.settings.hitbox = glitch(session.settings.hitbox);

                session.bestScore.endless = glitch(session.bestScore.endless);
                session.bestScore.timetrial = glitch(session.bestScore.timetrial);
                session.bestScore.zigzag = glitch(session.bestScore.zigzag);

                session.w = glitch(session.w);
                session.h = glitch(session.h);
                session.x = glitch(session.x);
                session.y = glitch(session.y);
                session.inputType = glitch(session.inputType);
                session.flyoutActive = glitch(session.flyoutActive);
                session.forcedColors = glitch(session.forcedColors);

                // Stats / telemetry
                if (he) {
                    he.numTimeTrialGames = glitch(he.numTimeTrialGames);
                    he.numEndlessGames = glitch(he.numEndlessGames);
                    he.numZigZagGames = glitch(he.numZigZagGames);
                    he.sessionStartTime = glitch(he.sessionStartTime);
                }

                // Renderer / canvas
                if (de && de.sys) {
                    if (de.sys.canvas) {
                        de.sys.canvas.width = glitch(de.sys.canvas.width);
                        de.sys.canvas.height = glitch(de.sys.canvas.height);
                    }
                    if (de.sys.offset) {
                        de.sys.offset.x = glitch(de.sys.offset.x);
                        de.sys.offset.y = glitch(de.sys.offset.y);
                    }
                }

                // Theme / assets
                if (pe && pe.sys) {
                    pe.sys.bgSize = glitch(pe.sys.bgSize);
                    pe.sys.gradient = glitch(pe.sys.gradient);
                    pe.sys.hitbox = glitch(pe.sys.hitbox);
                    pe.sys.boundary = glitch(pe.sys.boundary);
                    pe.sys.accent = glitch(pe.sys.accent);
                }

                // Object system
                if (ke && ke.sys) {
                    if (ke.sys.grid) {
                        ke.sys.grid.size = glitch(ke.sys.grid.size);
                        ke.sys.grid.gap = glitch(ke.sys.grid.gap);
                        ke.sys.grid.slots = glitch(ke.sys.grid.slots);
                    }
                    if (ke.sys.endless && ke.sys.endless.row) {
                        ke.sys.endless.row.next = glitch(ke.sys.endless.row.next);
                        ke.sys.endless.row.inc = glitch(ke.sys.endless.row.inc);
                    }
                    if (ke.sys.timetrial && ke.sys.timetrial.row) {
                        ke.sys.timetrial.row.next = glitch(ke.sys.timetrial.row.next);
                        ke.sys.timetrial.row.inc = glitch(ke.sys.timetrial.row.inc);
                    }
                    if (ke.sys.zigzag && ke.sys.zigzag.row) {
                        ke.sys.zigzag.row.next = glitch(ke.sys.zigzag.row.next);
                        ke.sys.zigzag.row.inc = glitch(ke.sys.zigzag.row.inc);
                    }
                }

                // Input / vibration
                if (Me && Me.sys) {
                    Me.sys.last = glitch(Me.sys.last);
                    Me.sys.vibCurrent = glitch(Me.sys.vibCurrent);
                    Me.sys.timer = glitch(Me.sys.timer);
                }

                // Chance to also randomly corrupt a bunch of other vars
                if (true) {
                    randomClassCorruption();
                }

                if (typeof window !== "undefined") {
                    window.__surfChaosTriggered = true;
                }
            } catch (err) {
                console.error("Chaos mod failed:", err);
            }
        }

        window.addEventListener("keydown", function (e) {
            if (hotkeyMatches(e)) {
                e.preventDefault();
                chaos();
            }
        });
    }

    window.SurfModAPI.runWithClasses(install);
})();