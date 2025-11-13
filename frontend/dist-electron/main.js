import { app as o, crashReporter as B, BrowserWindow as P, dialog as k, nativeImage as D } from "electron";
import { fileURLToPath as _ } from "node:url";
import * as a from "path";
import * as h from "fs";
import { spawn as v } from "child_process";
import * as R from "http";
o.commandLine.appendSwitch("disable-gpu");
o.commandLine.appendSwitch("disable-gpu-compositing");
o.commandLine.appendSwitch("disable-software-rasterizer");
o.commandLine.appendSwitch("disable-accelerated-2d-canvas");
o.commandLine.appendSwitch("disable-accelerated-video-decode");
o.disableHardwareAcceleration();
B.start({
  productName: "FinalAssessmentHub",
  companyName: "DeinName",
  uploadToServer: !1,
  // nur lokal speichern
  compress: !0
});
const x = o.getPath ? o.getPath("userData") : a.join(process.cwd(), ".userdata"), I = a.join(x, "finalassessment-main.log");
function e(t) {
  try {
    h.mkdirSync(a.dirname(I), { recursive: !0 }), h.appendFileSync(I, `${(/* @__PURE__ */ new Date()).toISOString()} ${t}
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
const y = a.dirname(_(import.meta.url));
process.env.APP_ROOT = a.join(y, "..");
const f = process.env.VITE_DEV_SERVER_URL, G = a.join(process.env.APP_ROOT, "dist-electron"), w = a.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = f ? a.join(process.env.APP_ROOT, "public") : w;
const S = Number(process.env.BACKEND_PORT ?? 8e3);
let p = null;
function L() {
  const t = process.platform === "win32" ? "backend.exe" : "backend";
  return a.join(process.resourcesPath || process.cwd(), "backend", t);
}
function A(t) {
  if (process.platform !== "win32")
    try {
      h.chmodSync(t, 493);
    } catch (n) {
      e("chmod failed: " + String(n));
    }
}
function O() {
  return new Promise((t, n) => {
    var u, E;
    const c = L();
    if (e("Attempt to start bundled backend at " + c), !h.existsSync(c))
      return e("Backend binary not found at " + c), n(new Error(`Backend binary not found at ${c}`));
    A(c);
    const r = process.platform !== "win32";
    p = v(c, [], {
      detached: r,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BACKEND_PORT: String(S) }
    }), (u = p.stdout) == null || u.on("data", (d) => {
      const l = d.toString();
      e("[backend stdout] " + l.replace(/\r?\n/g, "\\n"));
      try {
        console.log("[backend stdout]", l);
      } catch {
      }
    }), (E = p.stderr) == null || E.on("data", (d) => {
      const l = d.toString();
      e("[backend stderr] " + l.replace(/\r?\n/g, "\\n"));
      try {
        console.error("[backend stderr]", l);
      } catch {
      }
    }), p.on("exit", (d, l) => {
      e(`Backend exited: code=${d} signal=${l}`), p = null;
      try {
        k.showErrorBox("Backend beendet", "Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.");
      } catch {
      }
    });
    const s = 3e3, m = Date.now(), g = () => {
      const d = R.request({ hostname: "127.0.0.1", port: S, path: "/", method: "GET", timeout: 400 }, (l) => {
        e("Backend healthcheck succeeded (status " + l.statusCode + ")"), d.destroy(), t();
      });
      d.on("error", () => {
        Date.now() - m < s ? setTimeout(g, 200) : (e("Backend did not become healthy within timeout — resolving anyway"), t());
      }), d.end();
    };
    g();
  });
}
function b() {
  var n, c;
  try {
    const r = R.request(
      { hostname: "127.0.0.1", port: S, path: "/shutdown", method: "POST", timeout: 500 },
      (s) => {
        e("Shutdown endpoint called, status:" + s.statusCode);
      }
    );
    r.on("error", (s) => e("Shutdown request failed: " + s.message)), r.end();
  } catch (r) {
    e("Could not call shutdown endpoint: " + String(r));
  }
  if (!p || !p.pid) return;
  const t = p.pid;
  e(`Stopping backend pid=${t} platform=${process.platform}`);
  try {
    if (process.platform === "win32") {
      const { spawnSync: r } = require("child_process"), s = r("taskkill", ["/PID", String(t), "/T", "/F"]);
      s.error ? e("taskkill failed: " + String(s.error)) : e("taskkill stdout: " + (((n = s.stdout) == null ? void 0 : n.toString()) || "") + " stderr: " + (((c = s.stderr) == null ? void 0 : c.toString()) || ""));
    } else {
      try {
        process.kill(-t, "SIGTERM");
      } catch (u) {
        e("SIGTERM to process group failed: " + String(u));
      }
      const r = 2e3, s = 50, m = Date.now();
      let g = !1;
      for (; Date.now() - m < r; )
        try {
          process.kill(t, 0), Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s);
        } catch {
          g = !0;
          break;
        }
      if (!g) {
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
o.on("before-quit", () => {
  e("before-quit called"), b();
});
process.on("SIGINT", () => {
  e("SIGINT"), b(), process.exit(0);
});
process.on("SIGTERM", () => {
  e("SIGTERM"), b(), process.exit(0);
});
function j(...t) {
  const n = a.join(...t);
  return o.isPackaged ? a.join(process.resourcesPath || process.cwd(), n) : a.join(y, "..", "src", n);
}
let i = null;
function T() {
  const t = j("assets", "logo_white.png");
  h.existsSync(t) || e("Icon nicht gefunden unter: " + t);
  let n = D.createFromPath(t);
  if (n.isEmpty && n.isEmpty() && e("nativeImage konnte Icon nicht laden (isEmpty): " + t), process.platform === "darwin" && n && !n.isEmpty())
    try {
      o.dock.setIcon(n);
    } catch (c) {
      e("app.dock.setIcon fehlgeschlagen: " + String(c));
    }
  i = new P({
    width: 1200,
    height: 800,
    icon: n && !n.isEmpty() ? n : void 0,
    resizable: !0,
    fullscreenable: !0,
    maximizable: !0,
    webPreferences: {
      preload: a.join(y, "preload.mjs")
    }
  }), i.webContents.on("render-process-gone", (c, r) => {
    e("render-process-gone: " + JSON.stringify(r));
    try {
      k.showErrorBox("Renderer abgestürzt", `Der Renderer-Prozess ist abgestürzt:
${r.reason}`);
      const s = a.join(w, "error.html");
      h.existsSync(s) && (i == null || i.loadFile(s).catch((m) => e("Loading fallback failed: " + String(m))));
    } catch (s) {
      e("Error handling render-process-gone: " + String(s));
    }
  }), i.webContents.on("child-process-gone", (c, r) => {
    e("child-process-gone: " + JSON.stringify(r));
  }), i.webContents.on("did-finish-load", () => {
    i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), f ? i.loadURL(f) : i.loadFile(a.join(w, "index.html"));
}
o.on("window-all-closed", () => {
  process.platform !== "darwin" && (e("window-all-closed -> quit"), o.quit(), i = null);
});
o.on("activate", () => {
  P.getAllWindows().length === 0 && T();
});
o.whenReady().then(async () => {
  e("app.whenReady");
  try {
    f ? e("Vite dev server active — skipping bundled backend start") : await O(), T();
  } catch (t) {
    e("Fehler beim Starten: " + String(t));
    try {
      k.showErrorBox("Startfehler", "Das Backend konnte nicht gestartet werden: " + (t == null ? void 0 : t.message));
    } catch {
    }
    o.quit();
  }
});
o.on("will-quit", () => e("will-quit"));
o.on("quit", () => e("quit"));
export {
  G as MAIN_DIST,
  w as RENDERER_DIST,
  f as VITE_DEV_SERVER_URL
};
