import { app as i, BrowserWindow as g, dialog as S, nativeImage as b } from "electron";
import { fileURLToPath as y } from "node:url";
import * as a from "path";
import * as f from "fs";
import { spawn as R } from "child_process";
import * as E from "http";
const m = a.dirname(y(import.meta.url));
process.env.APP_ROOT = a.join(m, "..");
const h = process.env.VITE_DEV_SERVER_URL, C = a.join(process.env.APP_ROOT, "dist-electron"), I = a.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = h ? a.join(process.env.APP_ROOT, "public") : I;
let d = null;
const w = Number(process.env.BACKEND_PORT ?? 8e3);
let c = null;
function B() {
  const e = process.platform === "win32" ? "backend.exe" : "backend";
  return a.join(process.resourcesPath, "backend", e);
}
function T(e) {
  if (process.platform !== "win32")
    try {
      f.chmodSync(e, 493);
    } catch (s) {
      console.warn("chmod failed", s);
    }
}
function v() {
  return new Promise((e, s) => {
    var n, l;
    const t = B();
    if (!f.existsSync(t))
      return s(new Error(`Backend binary not found at ${t}`));
    T(t);
    const o = process.platform !== "win32";
    c = R(t, [], {
      detached: o,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BACKEND_PORT: String(w) }
    }), (n = c.stdout) == null || n.on("data", (r) => {
      console.log("[backend stdout]", r.toString());
    }), (l = c.stderr) == null || l.on("data", (r) => {
      console.error("[backend stderr]", r.toString());
    }), c.on("exit", (r, p) => {
      console.log(`Backend exited: code=${r} signal=${p}`), c = null, S.showErrorBox("Backend beendet", "Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.");
    }), _(50, 200).then(() => e()).catch((r) => {
      try {
        u();
      } catch {
      }
      c = null, s(r);
    });
  });
}
function u() {
  var s, t;
  try {
    const o = E.request(
      { hostname: "127.0.0.1", port: w, path: "/shutdown", method: "POST", timeout: 500 },
      (n) => {
        console.log("Shutdown endpoint called, status:", n.statusCode);
      }
    );
    o.on("error", (n) => console.warn("Shutdown request failed:", n.message)), o.end();
  } catch (o) {
    console.warn("Could not call shutdown endpoint:", o);
  }
  if (!c || !c.pid) return;
  const e = c.pid;
  console.log(`Stopping backend pid=${e} platform=${process.platform}`);
  try {
    if (process.platform === "win32") {
      const { spawnSync: o } = require("child_process"), n = o("taskkill", ["/PID", String(e), "/T", "/F"]);
      n.error ? console.error("taskkill failed", n.error) : console.log("taskkill stdout:", (s = n.stdout) == null ? void 0 : s.toString(), "stderr:", (t = n.stderr) == null ? void 0 : t.toString());
    } else {
      try {
        process.kill(-e, "SIGTERM");
      } catch (r) {
        console.warn("SIGTERM to process group failed", r);
      }
      const o = 2e3, n = 50, l = Date.now();
      for (; Date.now() - l < o; )
        try {
          process.kill(e, 0), Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
        } catch {
          break;
        }
      try {
        process.kill(-e, "SIGKILL");
      } catch {
      }
    }
  } catch (o) {
    console.error("Error stopping backend", o);
  } finally {
    c = null;
  }
}
i.on("before-quit", () => {
  u();
});
i.on("quit", () => {
  u();
});
process.on("SIGINT", () => {
  u(), process.exit(0);
});
process.on("SIGTERM", () => {
  u(), process.exit(0);
});
process.on("exit", () => {
  u();
});
function _(e = 50, s = 200) {
  const t = `http://127.0.0.1:${w}/health`;
  return new Promise((o, n) => {
    let l = 0;
    const r = setInterval(() => {
      l++;
      const p = E.get(t, (k) => {
        k.statusCode === 200 ? (clearInterval(r), o()) : l >= e && (clearInterval(r), n(new Error("Backend antwortete mit Status " + k.statusCode)));
      });
      p.on("error", () => {
        l >= e && (clearInterval(r), n(new Error("Backend nicht erreichbar (Connection error)")));
      }), p.setTimeout(1e3, () => {
        p.destroy();
      });
    }, s);
  });
}
function x(...e) {
  const s = a.join(...e);
  return i.isPackaged ? a.join(process.resourcesPath, s) : a.join(m, "..", "src", s);
}
function P() {
  const e = x("assets", "logo_white.png");
  f.existsSync(e) || console.warn("Icon nicht gefunden unter:", e);
  let t = b.createFromPath(e);
  if (t.isEmpty() && (console.warn("nativeImage konnte Icon nicht laden (isEmpty):", e), t = void 0), process.platform === "darwin" && t && !t.isEmpty())
    try {
      i.dock.setIcon(t);
    } catch (o) {
      console.warn("app.dock.setIcon fehlgeschlagen:", o);
    }
  d = new g({
    width: 1200,
    height: 800,
    icon: t && !t.isEmpty() ? t : void 0,
    resizable: !0,
    fullscreenable: !0,
    maximizable: !0,
    webPreferences: {
      preload: a.join(m, "preload.mjs")
    }
  }), d.webContents.on("did-finish-load", () => {
    d == null || d.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), h ? d.loadURL(h) : d.loadFile(a.join(I, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), d = null);
});
i.on("activate", () => {
  g.getAllWindows().length === 0 && P();
});
i.whenReady().then(async () => {
  try {
    h ? console.log("Vite dev server active — skipping bundled backend start") : await v(), P();
  } catch (e) {
    console.error("Fehler beim Starten", e), S.showErrorBox("Startfehler", "Das Backend konnte nicht gestartet werden: " + (e == null ? void 0 : e.message)), i.quit();
  }
});
export {
  C as MAIN_DIST,
  I as RENDERER_DIST,
  h as VITE_DEV_SERVER_URL
};
