// Copyright (C) Microsoft Corporation. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Global registry for mods so error dialogs can reference the mod name.
function registerModScript(info) {
  if (!info || !info.src) {
    return;
  }

  const id = String(info.id || info.name || info.src);
  const name = String(info.name || info.id || info.src);
  const src = String(info.src);

  if (!id || !name || !src) {
    return;
  }

  const list = (window.__surfModScripts = window.__surfModScripts || []);

  // Avoid duplicate entries for the same script URL.
  if (list.some((entry) => entry.src === src)) {
    return;
  }

  list.push({ id, name, src });
}

// Expose the registration helper for the mods loader in surf.bundle.js.
window.__surfRegisterModScript = registerModScript;

// Helper to fetch and format source context around a given line number.
async function __surfGetSourceContext(
  url,
  lineNumber,
  linesBefore = 3,
  linesAfter = 3
) {
  try {
    if (!url || !lineNumber || typeof fetch === "undefined") {
      return null;
    }

    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);

    const index = Math.max(0, Math.min(lines.length - 1, lineNumber - 1));
    const start = Math.max(0, index - linesBefore);
    const end = Math.min(lines.length, index + linesAfter + 1);

    const snippetLines = [];
    for (let i = start; i < end; i++) {
      const isErrorLine = i + 1 === lineNumber;
      const prefix = isErrorLine ? ">" : " ";
      snippetLines.push(
        prefix + " " + String(i + 1).padStart(4, " ") + " | " + lines[i]
      );
    }

    return snippetLines.join("\n");
  } catch (e) {
    return null;
  }
}

function hookErrorReporting(component) {
  window.onerror = (message, source, lineno, columnNumber, error) => {
    let modInfo = null;
    const mods = window.__surfModScripts || [];
    if (source && mods && mods.length) {
      modInfo =
        mods.find((mod) => {
          if (!mod || !mod.src) return false;
          const modSrc = String(mod.src);
          return (
            source === modSrc ||
            source.endsWith(modSrc) ||
            source.indexOf("/" + modSrc) !== -1
          );
        }) || null;
    }

    const errorInfo = {
      column: columnNumber,
      component,
      line: lineno,
      message: error?.message ?? message,
      name: error?.name ?? "Error",
      source_url: source,
      stack: error?.stack ?? "(no stack)",
      modId: modInfo ? modInfo.id : null,
      modName: modInfo ? modInfo.name : null,
      modSrc: modInfo ? modInfo.src : null,
      time: new Date().toISOString(),
      pageUrl:
        typeof window !== "undefined" && window.location
          ? window.location.href
          : "(unknown)",
      userAgent:
        typeof navigator !== "undefined" && navigator.userAgent
          ? navigator.userAgent
          : "(unknown)",
      modsCount: Array.isArray(mods) ? mods.length : 0,
    };

    const locationDescription = errorInfo.modName
      ? `${errorInfo.component}`
      : errorInfo.component;

    (async () => {
      let sourceContext = null;
      try {
        sourceContext = await __surfGetSourceContext(
          errorInfo.source_url || (modInfo && modInfo.src) || null,
          errorInfo.line || null
        );
      } catch (e) {
        sourceContext = null;
      }

      const contextText = sourceContext
        ? `\n\nSource context (around ${errorInfo.source_url}:${errorInfo.line}):\n${sourceContext}`
        : "";
      
      alert(`Microsoft Edge Surf Assert Error!!!\n\nAn error occurred in ${locationDescription}. Check the JS console for more details.`)
      console.error(
        `Microsoft Edge Surf Assert Error!!!\n\nAn error occurred in ${locationDescription}. The below information may be helpful if you are developing a mod.\n\n` +
          (errorInfo.modName
        ? `Mod: ${errorInfo.modName} (id: ${errorInfo.modId})\n`
        : "") +
          `Name: ${errorInfo.name}\n` +
          `Message: ${errorInfo.message}\n` +
          `Source: ${errorInfo.source_url}:${errorInfo.line}:${errorInfo.column}\n\n` +
          `Stack:\n${errorInfo.stack}` +
          contextText +
          `\n\n---\n` +
          `Additional info:\n` +
          `Page URL: ${errorInfo.pageUrl}\n` +
          `Time: ${errorInfo.time}\n` +
          `User agent: ${errorInfo.userAgent}\n` +
          (errorInfo.modsCount
        ? `Registered mods: ${errorInfo.modsCount}\n`
        : "") +
          `\nDebugging tip: To break on this exception in Chromium DevTools and get more details, open DevTools (F12 or Ctrl+Shift+I), go to the Sources panel, enable "Pause on unhandled exceptions" and refresh the page. The debugger will pause where the exception is thrown.`
      );
    })();
  };
}
