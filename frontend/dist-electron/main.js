import { app, BrowserWindow, dialog, nativeImage } from "electron";
import { fileURLToPath } from "node:url";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import * as http from "http";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 8e3);
let backendProcess = null;
function getBundledBackendPath() {
  const exeName = process.platform === "win32" ? "backend.exe" : "backend";
  return path.join(process.resourcesPath, "backend", exeName);
}
function makeExecutableIfNeeded(p) {
  if (process.platform !== "win32") {
    try {
      fs.chmodSync(p, 493);
    } catch (err) {
      console.warn("chmod failed", err);
    }
  }
}
function startBundledBackend() {
  return new Promise((resolve, reject) => {
    var _a, _b;
    const exePath = getBundledBackendPath();
    if (!fs.existsSync(exePath)) {
      return reject(new Error(`Backend binary not found at ${exePath}`));
    }
    makeExecutableIfNeeded(exePath);
    backendProcess = spawn(exePath, [], {
      detached: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BACKEND_PORT: String(BACKEND_PORT) }
    });
    (_a = backendProcess.stdout) == null ? void 0 : _a.on("data", (d) => {
      console.log("[backend stdout]", d.toString());
    });
    (_b = backendProcess.stderr) == null ? void 0 : _b.on("data", (d) => {
      console.error("[backend stderr]", d.toString());
    });
    backendProcess.on("exit", (code, signal) => {
      console.log(`Backend exited: code=${code} signal=${signal}`);
      backendProcess = null;
      dialog.showErrorBox("Backend beendet", "Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.");
    });
    waitForBackendReady(50, 200).then(() => resolve()).catch((err) => {
      try {
        backendProcess == null ? void 0 : backendProcess.kill("SIGKILL");
      } catch (e) {
      }
      backendProcess = null;
      reject(err);
    });
  });
}
function stopBundledBackend() {
  if (!backendProcess) return;
  try {
    backendProcess.kill("SIGTERM");
    setTimeout(() => {
      if (backendProcess) {
        try {
          backendProcess.kill("SIGKILL");
        } catch (e) {
        }
        backendProcess = null;
      }
    }, 2e3);
  } catch (err) {
    console.error("Error stopping backend", err);
  }
}
function waitForBackendReady(retries = 50, intervalMs = 200) {
  const url = `http://127.0.0.1:${BACKEND_PORT}/health`;
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const t = setInterval(() => {
      attempts++;
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(t);
          resolve();
        } else if (attempts >= retries) {
          clearInterval(t);
          reject(new Error("Backend antwortete mit Status " + res.statusCode));
        }
      });
      req.on("error", () => {
        if (attempts >= retries) {
          clearInterval(t);
          reject(new Error("Backend nicht erreichbar (Connection error)"));
        }
      });
      req.setTimeout(1e3, () => {
        req.destroy();
      });
    }, intervalMs);
  });
}
function createWindow() {
  const iconPath = path.join(__dirname, "..", "src", "assets", "logo_white.png");
  const icon = nativeImage.createFromPath(iconPath);
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon,
    resizable: true,
    fullscreenable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(async () => {
  try {
    if (!VITE_DEV_SERVER_URL) {
      await startBundledBackend();
    } else {
      console.log("Vite dev server active — skipping bundled backend start");
    }
    createWindow();
  } catch (err) {
    console.error("Fehler beim Starten", err);
    dialog.showErrorBox("Startfehler", "Das Backend konnte nicht gestartet werden: " + (err == null ? void 0 : err.message));
    app.quit();
  }
});
app.on("before-quit", () => {
  stopBundledBackend();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
