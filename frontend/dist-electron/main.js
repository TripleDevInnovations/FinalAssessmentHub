import { app, crashReporter, BrowserWindow, dialog, nativeImage } from "electron";
import { fileURLToPath } from "node:url";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import * as http from "http";
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-accelerated-2d-canvas");
app.commandLine.appendSwitch("disable-accelerated-video-decode");
app.disableHardwareAcceleration();
crashReporter.start({
  productName: "FinalAssessmentHub",
  companyName: "DeinName",
  uploadToServer: false,
  compress: true
});
const userDataPath = app.getPath ? app.getPath("userData") : path.join(process.cwd(), ".userdata");
const logPath = path.join(userDataPath, "finalassessment-main.log");
function appendLog(msg) {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${(/* @__PURE__ */ new Date()).toISOString()} ${msg}
`);
  } catch (e) {
    try {
      console.error("Logging failed", e);
    } catch {
    }
  }
}
appendLog("=== App starting (early) ===");
process.on("uncaughtException", (err) => appendLog("uncaughtException: " + (err && (err.stack || err.message || String(err)))));
process.on("unhandledRejection", (r) => appendLog("unhandledRejection: " + String(r)));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 8e3);
let backendProcess = null;
function getBundledBackendPath() {
  const exeName = process.platform === "win32" ? "backend.exe" : "backend";
  return path.join(process.resourcesPath || process.cwd(), "backend", exeName);
}
function makeExecutableIfNeeded(p) {
  if (process.platform !== "win32") {
    try {
      fs.chmodSync(p, 493);
    } catch (err) {
      appendLog("chmod failed: " + String(err));
    }
  }
}
function startBundledBackend() {
  return new Promise((resolve, reject) => {
    var _a, _b;
    const exePath = getBundledBackendPath();
    appendLog("Attempt to start bundled backend at " + exePath);
    if (!fs.existsSync(exePath)) {
      appendLog("Backend binary not found at " + exePath);
      return reject(new Error(`Backend binary not found at ${exePath}`));
    }
    makeExecutableIfNeeded(exePath);
    const useDetached = process.platform !== "win32";
    backendProcess = spawn(exePath, [], {
      detached: useDetached,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BACKEND_PORT: String(BACKEND_PORT) }
    });
    (_a = backendProcess.stdout) == null ? void 0 : _a.on("data", (d) => {
      const s = d.toString();
      appendLog("[backend stdout] " + s.replace(/\r?\n/g, "\\n"));
      try {
        console.log("[backend stdout]", s);
      } catch {
      }
    });
    (_b = backendProcess.stderr) == null ? void 0 : _b.on("data", (d) => {
      const s = d.toString();
      appendLog("[backend stderr] " + s.replace(/\r?\n/g, "\\n"));
      try {
        console.error("[backend stderr]", s);
      } catch {
      }
    });
    backendProcess.on("exit", (code, signal) => {
      appendLog(`Backend exited: code=${code} signal=${signal}`);
      backendProcess = null;
      try {
        dialog.showErrorBox("Backend beendet", "Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.");
      } catch {
      }
    });
    const maxWait = 3e3;
    const start = Date.now();
    const tryConnect = () => {
      const req = http.request({ hostname: "127.0.0.1", port: BACKEND_PORT, path: "/health", method: "GET", timeout: 400 }, (res) => {
        appendLog("Backend healthcheck succeeded (status " + res.statusCode + ")");
        req.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start < maxWait) {
          setTimeout(tryConnect, 200);
        } else {
          appendLog("Backend did not become healthy within timeout — resolving anyway");
          resolve();
        }
      });
      req.end();
    };
    tryConnect();
  });
}
function stopBundledBackendSync() {
  var _a, _b;
  try {
    const req = http.request(
      { hostname: "127.0.0.1", port: BACKEND_PORT, path: "/shutdown", method: "POST", timeout: 500 },
      (res) => {
        appendLog("Shutdown endpoint called, status:" + res.statusCode);
      }
    );
    req.on("error", (err) => appendLog("Shutdown request failed: " + err.message));
    req.end();
  } catch (e) {
    appendLog("Could not call shutdown endpoint: " + String(e));
  }
  if (!backendProcess || !backendProcess.pid) return;
  const pid = backendProcess.pid;
  appendLog(`Stopping backend pid=${pid} platform=${process.platform}`);
  try {
    if (process.platform === "win32") {
      const { spawnSync } = require("child_process");
      const res = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"]);
      if (res.error) appendLog("taskkill failed: " + String(res.error));
      else appendLog("taskkill stdout: " + (((_a = res.stdout) == null ? void 0 : _a.toString()) || "") + " stderr: " + (((_b = res.stderr) == null ? void 0 : _b.toString()) || ""));
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch (e) {
        appendLog("SIGTERM to process group failed: " + String(e));
      }
      const TIMEOUT_MS = 2e3;
      const POLL_MS = 50;
      const start = Date.now();
      let gracefullyExited = false;
      while (Date.now() - start < TIMEOUT_MS) {
        try {
          process.kill(pid, 0);
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, POLL_MS);
        } catch (err) {
          gracefullyExited = true;
          break;
        }
      }
      if (!gracefullyExited) {
        appendLog("Backend did not exit gracefully, sending SIGKILL.");
        try {
          process.kill(-pid, "SIGKILL");
        } catch (e) {
          appendLog("SIGKILL failed: " + String(e));
        }
      }
    }
  } catch (err) {
    appendLog("Error stopping backend: " + String(err));
  } finally {
    backendProcess = null;
  }
}
app.on("before-quit", () => {
  appendLog("before-quit called");
  stopBundledBackendSync();
});
process.on("SIGINT", () => {
  appendLog("SIGINT");
  stopBundledBackendSync();
  process.exit(0);
});
process.on("SIGTERM", () => {
  appendLog("SIGTERM");
  stopBundledBackendSync();
  process.exit(0);
});
function getAssetPath(...paths) {
  const rel = path.join(...paths);
  if (app.isPackaged) return path.join(process.resourcesPath || process.cwd(), rel);
  else return path.join(__dirname, "..", "src", rel);
}
let win = null;
function createWindow() {
  const iconPath = getAssetPath("assets", "logo_white.png");
  if (!fs.existsSync(iconPath)) appendLog("Icon nicht gefunden unter: " + iconPath);
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty && icon.isEmpty()) appendLog("nativeImage konnte Icon nicht laden (isEmpty): " + iconPath);
  if (process.platform === "darwin" && icon && !icon.isEmpty()) {
    try {
      app.dock.setIcon(icon);
    } catch (err) {
      appendLog("app.dock.setIcon fehlgeschlagen: " + String(err));
    }
  }
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: icon && !icon.isEmpty() ? icon : void 0,
    resizable: true,
    fullscreenable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    appendLog("render-process-gone: " + JSON.stringify(details));
    try {
      dialog.showErrorBox("Renderer abgestürzt", `Der Renderer-Prozess ist abgestürzt:
${details.reason}`);
      const fallback = path.join(RENDERER_DIST, "error.html");
      if (fs.existsSync(fallback)) {
        win == null ? void 0 : win.loadFile(fallback).catch((e) => appendLog("Loading fallback failed: " + String(e)));
      }
    } catch (e) {
      appendLog("Error handling render-process-gone: " + String(e));
    }
  });
  win.webContents.on("child-process-gone", (_event, details) => {
    appendLog("child-process-gone: " + JSON.stringify(details));
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(RENDERER_DIST, "index.html"));
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    appendLog("window-all-closed -> quit");
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(async () => {
  appendLog("app.whenReady");
  try {
    if (!VITE_DEV_SERVER_URL) {
      await startBundledBackend();
    } else {
      appendLog("Vite dev server active — skipping bundled backend start");
    }
    createWindow();
  } catch (err) {
    appendLog("Fehler beim Starten: " + String(err));
    try {
      dialog.showErrorBox("Startfehler", "Das Backend konnte nicht gestartet werden: " + (err == null ? void 0 : err.message));
    } catch {
    }
    app.quit();
  }
});
app.on("will-quit", () => appendLog("will-quit"));
app.on("quit", () => appendLog("quit"));
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
