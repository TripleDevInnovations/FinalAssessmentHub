import { app as d, BrowserWindow as k, dialog as g, nativeImage as I } from "electron";
import { fileURLToPath as R } from "node:url";
import * as c from "path";
import * as S from "fs";
import { spawn as B } from "child_process";
import * as b from "http";
const f = c.dirname(R(import.meta.url));
process.env.APP_ROOT = c.join(f, "..");
const h = process.env.VITE_DEV_SERVER_URL, A = c.join(process.env.APP_ROOT, "dist-electron"), E = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = h ? c.join(process.env.APP_ROOT, "public") : E;
let l = null;
const m = Number(process.env.BACKEND_PORT ?? 8e3);
let s = null;
function T() {
  const e = process.platform === "win32" ? "backend.exe" : "backend";
  return c.join(process.resourcesPath, "backend", e);
}
function _(e) {
  if (process.platform !== "win32")
    try {
      S.chmodSync(e, 493);
    } catch (r) {
      console.warn("chmod failed", r);
    }
}
function y() {
  return new Promise((e, r) => {
    var t, i;
    const a = T();
    if (!S.existsSync(a))
      return r(new Error(`Backend binary not found at ${a}`));
    _(a);
    const n = process.platform !== "win32";
    s = B(a, [], {
      detached: n,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BACKEND_PORT: String(m) }
    }), (t = s.stdout) == null || t.on("data", (o) => {
      console.log("[backend stdout]", o.toString());
    }), (i = s.stderr) == null || i.on("data", (o) => {
      console.error("[backend stderr]", o.toString());
    }), s.on("exit", (o, p) => {
      console.log(`Backend exited: code=${o} signal=${p}`), s = null, g.showErrorBox("Backend beendet", "Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.");
    }), v(50, 200).then(() => e()).catch((o) => {
      try {
        u();
      } catch {
      }
      s = null, r(o);
    });
  });
}
function u() {
  var r, a;
  try {
    const n = b.request(
      { hostname: "127.0.0.1", port: m, path: "/shutdown", method: "POST", timeout: 500 },
      (t) => {
        console.log("Shutdown endpoint called, status:", t.statusCode);
      }
    );
    n.on("error", (t) => console.warn("Shutdown request failed:", t.message)), n.end();
  } catch (n) {
    console.warn("Could not call shutdown endpoint:", n);
  }
  if (!s || !s.pid) return;
  const e = s.pid;
  console.log(`Stopping backend pid=${e} platform=${process.platform}`);
  try {
    if (process.platform === "win32") {
      const { spawnSync: n } = require("child_process"), t = n("taskkill", ["/PID", String(e), "/T", "/F"]);
      t.error ? console.error("taskkill failed", t.error) : console.log("taskkill stdout:", (r = t.stdout) == null ? void 0 : r.toString(), "stderr:", (a = t.stderr) == null ? void 0 : a.toString());
    } else {
      try {
        process.kill(-e, "SIGTERM");
      } catch (o) {
        console.warn("SIGTERM to process group failed", o);
      }
      const n = 2e3, t = 50, i = Date.now();
      for (; Date.now() - i < n; )
        try {
          process.kill(e, 0), Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, t);
        } catch {
          break;
        }
      try {
        process.kill(-e, "SIGKILL");
      } catch {
      }
    }
  } catch (n) {
    console.error("Error stopping backend", n);
  } finally {
    s = null;
  }
}
d.on("before-quit", () => {
  u();
});
d.on("quit", () => {
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
function v(e = 50, r = 200) {
  const a = `http://127.0.0.1:${m}/health`;
  return new Promise((n, t) => {
    let i = 0;
    const o = setInterval(() => {
      i++;
      const p = b.get(a, (w) => {
        w.statusCode === 200 ? (clearInterval(o), n()) : i >= e && (clearInterval(o), t(new Error("Backend antwortete mit Status " + w.statusCode)));
      });
      p.on("error", () => {
        i >= e && (clearInterval(o), t(new Error("Backend nicht erreichbar (Connection error)")));
      }), p.setTimeout(1e3, () => {
        p.destroy();
      });
    }, r);
  });
}
function P() {
  const e = c.join(f, "..", "src", "assets", "logo_white.png"), r = I.createFromPath(e);
  l = new k({
    width: 1200,
    height: 800,
    icon: r,
    resizable: !0,
    fullscreenable: !0,
    maximizable: !0,
    webPreferences: {
      preload: c.join(f, "preload.mjs")
    }
  }), l.webContents.on("did-finish-load", () => {
    l == null || l.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), h ? l.loadURL(h) : l.loadFile(c.join(E, "index.html"));
}
d.on("window-all-closed", () => {
  process.platform !== "darwin" && (d.quit(), l = null);
});
d.on("activate", () => {
  k.getAllWindows().length === 0 && P();
});
d.whenReady().then(async () => {
  try {
    h ? console.log("Vite dev server active — skipping bundled backend start") : await y(), P();
  } catch (e) {
    console.error("Fehler beim Starten", e), g.showErrorBox("Startfehler", "Das Backend konnte nicht gestartet werden: " + (e == null ? void 0 : e.message)), d.quit();
  }
});
export {
  A as MAIN_DIST,
  E as RENDERER_DIST,
  h as VITE_DEV_SERVER_URL
};
