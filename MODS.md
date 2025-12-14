## Modding overview

This project adds a lightweight “mod loader” plus a small global API that exposes internal game classes so mods can patch behavior at runtime.

A **mod** is a JavaScript file (ex: superSaiyan.js) declared in mods.json. Mods are loaded on page load (see `window.onload` in surf.bundle.js), before the rest of the game finishes initialization.

---

## mods.json

Location:

- mods.json

Format: an array of mod descriptors.

Example (from your repo):

````json
[
  {
    "id": "example-mod",
    "name": "Example Mod",
    "description": "Example mod showing the optional description + link fields.",
    "link": "https://github.com/LiuWoodsCode/moddableSurf",
    "settings": [
      { "name": "enabled", "type": "bool", "default": true },
      { "name": "multiplier", "type": "number", "default": 1 },
      { "name": "message", "type": "string", "default": "hello" }
    ],
    "path": "example-mod.js"
  }
]
````

### Fields

| Field | Required | Type | Notes |
|---|---:|---|---|
| `id` | yes | `string` | Unique identifier. Also used as the settings storage key prefix. |
| `name` | yes | `string` | Display name in the Mods UI. |
| `path` | yes | `string` | File name relative to the mods folder (ex: `superSaiyan.js`). |
| `description` | no | `string` | Shown in the Mods UI (if present). |
| `link` | no | `string (URL)` | If present, Mods UI renders the name as a clickable link. |
| `settings` | no | `Array` | Declares mod-specific settings shown in the UI and persisted to `localStorage`. |

---

## Mod settings

### Schema (`settings` entries)

Each entry looks like:

- `name`: setting key (string)
- `type`: `"bool" | "number" | "string"`
- `default`: default value (type should match)

### Persistence (localStorage)

Mods store settings under a per-mod key:

- **`<modId>-settings`** (JSON)

Example key:

- `example-mod-settings`

The UI/loader typically reads this key, merges it with defaults from mods.json, and persists changes back to `localStorage`.

Additionally, selected/enabled mods are tracked under:

- **`surf_selected_mods`** (JSON) — constant is `pt = "surf_selected_mods"` in surf.bundle.js.

---

## Global Mod API: `window.SurfModAPI`

surf.bundle.js exposes internal classes to mods via `window.SurfModAPI`.

### `SurfModAPI.runWithClasses(callback)`

Runs `callback(classes)` where `classes` is an object containing references to internal game classes.

- **Signature:** `runWithClasses((classes) => void)`

### `SurfModAPI.runInClassScope(className, callback)`

Runs `callback.call(targetClass, targetClass, classes)`.

- **Signature:** `runInClassScope(className: string, (targetClass, classes) => void)`
- `this` inside the callback is set to the class object as well.

This is mainly a convenience when you want to patch one specific class.

---

## Exposed internal classes

These are exposed (exact names) via `SURF_INTERNAL_CLASSES`:

- `Y` — offline/local stats/session persistence wrapper
- `te` — central “system” singleton (`te.sys`), holds `session` and `game`
- `he` — stats + telemetry wrapper; includes localStorage fallback
- `de` — canvas/background renderer
- `pe` — theme assets manager (images, gradients, hitbox colors, etc.)
- `be` — sprite sheet metadata + player sprite generator
- `ue` — UI overlay builder/updater (score, icons, notifications)
- `ye` — spawn legend/clusters definition
- `ke` — world/spawn manager (creates objects, rows, acts, etc.)
- `Me` — gamepad/controller handler
- `Pe` — mouse input handler
- `ze` — player entity/controller (movement, collisions reactions, pickups, etc.)
- `De` — keyboard handler
- `Oe` — touch handler
- `Ae` — input router + cheat code handler
- `Ne` — collision system
- `Ze` — main game loop / state machine (`Ze.sys`)

Common pattern: many classes have a `.sys` singleton instance once constructed (ex: `te.sys`, `Ze.sys`, `de.sys`, `ue.sys`, …).

---

## Practical mod patterns

### 1) Patch a prototype method

Example: multiply distance progression by a setting.

````js
// (no filepath comment — example mod content)
(function () {
  const settingsKey = "example-mod-settings";
  const settings = JSON.parse(localStorage.getItem(settingsKey) || "{}");
  const enabled = settings.enabled ?? true;
  const multiplier = settings.multiplier ?? 1;

  if (!enabled) return;

  window.SurfModAPI.runWithClasses(({ te }) => {
    const original = te.prototype.updateDistances;

    te.prototype.updateDistances = function (dx, dy) {
      return original.call(this, dx * multiplier, dy * multiplier);
    };
  });
})();
````

### 2) Use `.sys` to affect current game state

Example: give boosts instantly (only works after `te.sys` exists).

````js
// (no filepath comment — example mod content)
(function () {
  window.SurfModAPI.runWithClasses(({ te }) => {
    const tryApply = () => {
      if (!te.sys) return false;
      te.sys.game.boosts.current = te.sys.game.boosts.max;
      return true;
    };

    if (tryApply()) return;

    // Fallback: retry shortly after load if the instance isn't created yet.
    const id = setInterval(() => {
      if (tryApply()) clearInterval(id);
    }, 50);
  });
})();
````

---

## Debugging tips (VS Code / browser)

- Open DevTools Console and check:
  - `window.SurfModAPI`
  - `window.SurfModAPI.runWithClasses(c => console.log(Object.keys(c)))`
  - `te.sys`, `Ze.sys` (after the game starts)
- Clear mod state:
  - Remove `localStorage["surf_selected_mods"]`
  - Remove `<modId>-settings` keys

---

## Minimal checklist for a new mod

1. Add an entry to mods.json with a unique `id` and `path`.
2. Create `mods/<path>` that:
   - reads `localStorage["<id>-settings"]` (optional),
   - uses `SurfModAPI.runWithClasses(...)` to patch code / read instances.
3. Prefer patching class prototypes early (before instances are created); prefer `.sys` for live state edits after start.