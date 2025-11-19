import { ipcMain as S, app as i, crashReporter as _, BrowserWindow as T, dialog as y, nativeTheme as P, nativeImage as v } from "electron";
import { fileURLToPath as x } from "node:url";
import * as s from "path";
import * as h from "fs";
import { spawn as A } from "child_process";
import * as B from "http";
S.handle("getAppVersion", () => i.getVersion());
_.start({
  productName: "FinalAssessmentHub",
  companyName: "DeinName",
  uploadToServer: !1,
  compress: !0
});
const L = i.getPath ? i.getPath("userData") : s.join(process.cwd(), ".userdata"), R = s.join(L, "finalassessment-main.log");
function e(t) {
  try {
    h.mkdirSync(s.dirname(R), { recursive: !0 }), h.appendFileSync(R, `${(/* @__PURE__ */ new Date()).toISOString()} ${t}
`);
  } catch (n) {
    try {
      console.error("Logging failed", n);
    } catch {
    }
  }
}
e("=== App starting (early) ===");
process.on("uncaughtException", (t) => e("uncaughtException: " + (t && (t.stack || t.message || String(t)))));
process.on("unhandledRejection", (t) => e("unhandledRejection: " + String(t)));
const b = s.dirname(x(import.meta.url));
process.env.APP_ROOT = s.join(b, "..");
const f = process.env.VITE_DEV_SERVER_URL, M = s.join(process.env.APP_ROOT, "dist-electron"), k = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = f ? s.join(process.env.APP_ROOT, "public") : k;
const w = Number(process.env.BACKEND_PORT ?? 8e3);
let p = null;
function O() {
  const t = process.platform === "win32" ? "backend.exe" : "backend";
  return s.join(process.resourcesPath || process.cwd(), "backend", t);
}
function j(t) {
  if (process.platform !== "win32")
    try {
      h.chmodSync(t, 493);
    } catch (n) {
      e("chmod failed: " + String(n));
    }
}
function q() {
  return new Promise((t, n) => {
    var u, I;
    const a = O();
    if (e("Attempt to start bundled backend at " + a), !h.existsSync(a))
      return e("Backend binary not found at " + a), n(new Error(`Backend binary not found at ${a}`));
    j(a);
    const r = process.platform !== "win32";
    p = A(a, [], {
      detached: r,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BACKEND_PORT: String(w) }
    }), (u = p.stdout) == null || u.on("data", (d) => {
      const l = d.toString();
      e("[backend stdout] " + l.replace(/\r?\n/g, "\\n"));
      try {
        console.log("[backend stdout]", l);
      } catch {
      }
    }), (I = p.stderr) == null || I.on("data", (d) => {
      const l = d.toString();
      e("[backend stderr] " + l.replace(/\r?\n/g, "\\n"));
      try {
        console.error("[backend stderr]", l);
      } catch {
      }
    }), p.on("exit", (d, l) => {
      e(`Backend exited: code=${d} signal=${l}`), p = null;
      try {
        y.showErrorBox("Backend beendet", "Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.");
      } catch {
      }
    });
    const o = 3e3, g = Date.now(), m = () => {
      const d = B.request({ hostname: "127.0.0.1", port: w, path: "/health", method: "GET", timeout: 400 }, (l) => {
        e("Backend healthcheck succeeded (status " + l.statusCode + ")"), d.destroy(), t();
      });
      d.on("error", () => {
        Date.now() - g < o ? setTimeout(m, 200) : (e("Backend did not become healthy within timeout — resolving anyway"), t());
      }), d.end();
    };
    m();
  });
}
function E() {
  var n, a;
  try {
    const r = B.request(
      { hostname: "127.0.0.1", port: w, path: "/shutdown", method: "POST", timeout: 500 },
      (o) => {
        e("Shutdown endpoint called, status:" + o.statusCode);
      }
    );
    r.on("error", (o) => e("Shutdown request failed: " + o.message)), r.end();
  } catch (r) {
    e("Could not call shutdown endpoint: " + String(r));
  }
  if (!p || !p.pid) return;
  const t = p.pid;
  e(`Stopping backend pid=${t} platform=${process.platform}`);
  try {
    if (process.platform === "win32") {
      const { spawnSync: r } = require("child_process"), o = r("taskkill", ["/PID", String(t), "/T", "/F"]);
      o.error ? e("taskkill failed: " + String(o.error)) : e("taskkill stdout: " + (((n = o.stdout) == null ? void 0 : n.toString()) || "") + " stderr: " + (((a = o.stderr) == null ? void 0 : a.toString()) || ""));
    } else {
      try {
        process.kill(-t, "SIGTERM");
      } catch (u) {
        e("SIGTERM to process group failed: " + String(u));
      }
      const r = 2e3, o = 50, g = Date.now();
      let m = !1;
      for (; Date.now() - g < r; )
        try {
          process.kill(t, 0), Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, o);
        } catch {
          m = !0;
          break;
        }
      if (!m) {
        e("Backend did not exit gracefully, sending SIGKILL.");
        try {
          process.kill(-t, "SIGKILL");
        } catch (u) {
          e("SIGKILL failed: " + String(u));
        }
      }
    }
  } catch (r) {
    e("Error stopping backend: " + String(r));
  } finally {
    p = null;
  }
}
i.on("before-quit", () => {
  e("before-quit called"), E();
});
process.on("SIGINT", () => {
  e("SIGINT"), E(), process.exit(0);
});
process.on("SIGTERM", () => {
  e("SIGTERM"), E(), process.exit(0);
});
function N(...t) {
  const n = s.join(...t);
  return i.isPackaged ? s.join(process.resourcesPath || process.cwd(), n) : s.join(b, "..", "src", n);
}
let c = null;
function D() {
  S.handle("theme:set", (a, r) => {
    P.themeSource = r;
  }), S.handle("theme:get", () => P.shouldUseDarkColors);
  const t = N("assets", "logo_blue.png");
  h.existsSync(t) || e("Icon nicht gefunden unter: " + t);
  let n = v.createFromPath(t);
  if (n.isEmpty && n.isEmpty() && e("nativeImage konnte Icon nicht laden (isEmpty): " + t), process.platform === "darwin" && n && !n.isEmpty())
    try {
      i.dock.setIcon(n);
    } catch (a) {
      e("app.dock.setIcon fehlgeschlagen: " + String(a));
    }
  c = new T({
    width: 1200,
    height: 800,
    icon: n && !n.isEmpty() ? n : void 0,
    resizable: !0,
    fullscreenable: !0,
    maximizable: !0,
    webPreferences: {
      preload: s.join(b, "preload.mjs")
    }
  }), c.webContents.on("render-process-gone", (a, r) => {
    e("render-process-gone: " + JSON.stringify(r));
    try {
      y.showErrorBox("Renderer abgestürzt", `Der Renderer-Prozess ist abgestürzt:
${r.reason}`);
      const o = s.join(k, "error.html");
      h.existsSync(o) && (c == null || c.loadFile(o).catch((g) => e("Loading fallback failed: " + String(g))));
    } catch (o) {
      e("Error handling render-process-gone: " + String(o));
    }
  }), c.webContents.on("child-process-gone", (a, r) => {
    e("child-process-gone: " + JSON.stringify(r));
  }), c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), f ? c.loadURL(f) : c.loadFile(s.join(k, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (e("window-all-closed -> quit"), i.quit(), c = null);
});
i.on("activate", () => {
  T.getAllWindows().length === 0 && D();
});
i.whenReady().then(async () => {
  e("app.whenReady");
  try {
    f ? e("Vite dev server active — skipping bundled backend start") : await q(), D();
  } catch (t) {
    e("Fehler beim Starten: " + String(t));
    try {
      y.showErrorBox("Startfehler", "Das Backend konnte nicht gestartet werden: " + (t == null ? void 0 : t.message));
    } catch {
    }
    i.quit();
  }
});
i.on("will-quit", () => e("will-quit"));
i.on("quit", () => e("quit"));
export {
  M as MAIN_DIST,
  k as RENDERER_DIST,
  f as VITE_DEV_SERVER_URL
};
