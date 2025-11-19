import { app, ipcMain, BrowserWindow, nativeImage, dialog, crashReporter } from 'electron'
import { fileURLToPath } from 'node:url'
import * as path from 'path'
import * as fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import * as http from 'http'

app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-accelerated-2d-canvas')
app.commandLine.appendSwitch('disable-accelerated-video-decode')

app.disableHardwareAcceleration()

ipcMain.handle('getAppVersion', () => {
  return app.getVersion();
});


// ----------------------------------------------------------------------------
// CrashReporter (lokal)
crashReporter.start({
  productName: 'FinalAssessmentHub',
  companyName: 'DeinName',
  uploadToServer: false,
  compress: true
})

// ----------------------------------------------------------------------------
// Logging-Helper
const userDataPath = app.getPath ? app.getPath('userData') : path.join(process.cwd(), '.userdata')
const logPath = path.join(userDataPath, 'finalassessment-main.log')
function appendLog(msg: string) {
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true })
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`)
  } catch (e) {
    try { console.error('Logging failed', e) } catch {}
  }
}
appendLog('=== App starting (early) ===')

process.on('uncaughtException', (err) => appendLog('uncaughtException: ' + (err && (err.stack || err.message || String(err)))))
process.on('unhandledRejection', (r) => appendLog('unhandledRejection: ' + String(r)))

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT as string, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT as string, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT as string, 'public') : RENDERER_DIST

// --- Backend control ---
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 8000)
let backendProcess: ChildProcess | null = null

function getBundledBackendPath(): string {
  const exeName = process.platform === 'win32' ? 'backend.exe' : 'backend'
  return path.join(process.resourcesPath || process.cwd(), 'backend', exeName)
}

function makeExecutableIfNeeded(p: string) {
  if (process.platform !== 'win32') {
    try { fs.chmodSync(p, 0o755) } catch (err) { appendLog('chmod failed: ' + String(err)) }
  }
}

function startBundledBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const exePath = getBundledBackendPath()
    appendLog('Attempt to start bundled backend at ' + exePath)
    if (!fs.existsSync(exePath)) {
      appendLog('Backend binary not found at ' + exePath)
      return reject(new Error(`Backend binary not found at ${exePath}`))
    }

    makeExecutableIfNeeded(exePath)

    const useDetached = process.platform !== 'win32'
    backendProcess = spawn(exePath, [], {
      detached: useDetached,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BACKEND_PORT: String(BACKEND_PORT) }
    })

    backendProcess.stdout?.on('data', d => {
      const s = d.toString()
      appendLog('[backend stdout] ' + s.replace(/\r?\n/g, '\\n'))
      try { console.log('[backend stdout]', s) } catch {}
    })
    backendProcess.stderr?.on('data', d => {
      const s = d.toString()
      appendLog('[backend stderr] ' + s.replace(/\r?\n/g, '\\n'))
      try { console.error('[backend stderr]', s) } catch {}
    })

    backendProcess.on('exit', (code, signal) => {
      appendLog(`Backend exited: code=${code} signal=${signal}`)
      backendProcess = null
      try {
        dialog.showErrorBox('Backend beendet', 'Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.')
      } catch {}
    })

    const maxWait = 3000
    const start = Date.now()
    const tryConnect = () => {
      const req = http.request({ hostname: '127.0.0.1', port: BACKEND_PORT, path: '/health', method: 'GET', timeout: 400 }, res => {
        appendLog('Backend healthcheck succeeded (status ' + res.statusCode + ')')
        req.destroy()
        resolve()
      })
      req.on('error', () => {
        if (Date.now() - start < maxWait) {
          setTimeout(tryConnect, 200)
        } else {
          appendLog('Backend did not become healthy within timeout — resolving anyway')
          resolve()
        }
      })
      req.end()
    }
    tryConnect()
  })
}

/*** Synchronous stop routine: beendet ganze Prozess-Gruppe / Baum plattformübergreifend.*/
function stopBundledBackendSync(): void {
  try {
    const req = http.request({ hostname: '127.0.0.1', port: BACKEND_PORT, path: '/shutdown', method: 'POST', timeout: 500 },
      res => { appendLog('Shutdown endpoint called, status:' + res.statusCode) })
    req.on('error', (err) => appendLog('Shutdown request failed: ' + err.message))
    req.end()
  } catch (e) { appendLog('Could not call shutdown endpoint: ' + String(e)) }

  if (!backendProcess || !backendProcess.pid) return
  const pid = backendProcess.pid
  appendLog(`Stopping backend pid=${pid} platform=${process.platform}`)
  try {
    if (process.platform === 'win32') {
      const { spawnSync } = require('child_process')
      const res = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'])
      if (res.error) appendLog('taskkill failed: ' + String(res.error))
      else appendLog('taskkill stdout: ' + (res.stdout?.toString() || '') + ' stderr: ' + (res.stderr?.toString() || ''))
    } else {
      try { process.kill(-pid, 'SIGTERM') } catch (e) { appendLog('SIGTERM to process group failed: ' + String(e)) }

      const TIMEOUT_MS = 2000
      const POLL_MS = 50
      const start = Date.now()
      let gracefullyExited = false
      while (Date.now() - start < TIMEOUT_MS) {
        try {
          process.kill(pid, 0)
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, POLL_MS)
        } catch (err) {
          gracefullyExited = true
          break
        }
      }
      if (!gracefullyExited) {
        appendLog('Backend did not exit gracefully, sending SIGKILL.')
        try { process.kill(-pid, 'SIGKILL') } catch (e) { appendLog('SIGKILL failed: ' + String(e)) }
      }
    }
  } catch (err) {
    appendLog('Error stopping backend: ' + String(err))
  } finally { backendProcess = null }
}

// Hooks
app.on('before-quit', () => {
  appendLog('before-quit called')
  stopBundledBackendSync()
})
process.on('SIGINT', () => { appendLog('SIGINT'); stopBundledBackendSync(); process.exit(0) })
process.on('SIGTERM', () => { appendLog('SIGTERM'); stopBundledBackendSync(); process.exit(0) })

// --- Window / app lifecycle ---
function getAssetPath(...paths: string[]) {
  const rel = path.join(...paths)
  if (app.isPackaged) return path.join(process.resourcesPath || process.cwd(), rel)
  else return path.join(__dirname, '..', 'src', rel)
}

let win: BrowserWindow | null = null

function createWindow() {
  const iconPath = getAssetPath('assets', 'logo_white.png')
  if (!fs.existsSync(iconPath)) appendLog('Icon nicht gefunden unter: ' + iconPath)
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty && icon.isEmpty()) appendLog('nativeImage konnte Icon nicht laden (isEmpty): ' + iconPath)

  if (process.platform === 'darwin' && icon && !icon.isEmpty()) {
    try { app.dock.setIcon(icon) } catch (err) { appendLog('app.dock.setIcon fehlgeschlagen: ' + String(err)) }
  }

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: icon && !icon.isEmpty() ? icon : undefined as any,
    resizable: true,
    fullscreenable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs')
    }
  })

  win.webContents.on('render-process-gone', (_event: Electron.Event, details: Electron.RenderProcessGoneDetails) => {
    appendLog('render-process-gone: ' + JSON.stringify(details))
    try {
      dialog.showErrorBox('Renderer abgestürzt', `Der Renderer-Prozess ist abgestürzt:\n${details.reason}`)
      const fallback = path.join(RENDERER_DIST, 'error.html')
      if (fs.existsSync(fallback)) {
        win?.loadFile(fallback).catch(e => appendLog('Loading fallback failed: ' + String(e)))
      }
    } catch (e) { appendLog('Error handling render-process-gone: ' + String(e)) }
  })

  ;(win.webContents as any).on('child-process-gone', (_event: any, details: any) => {
    appendLog('child-process-gone: ' + JSON.stringify(details))
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL)
  else win.loadFile(path.join(RENDERER_DIST, 'index.html'))
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    appendLog('window-all-closed -> quit')
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Main startup
app.whenReady().then(async () => {
  appendLog('app.whenReady')
  try {
    if (!VITE_DEV_SERVER_URL) {
      await startBundledBackend()
    } else {
      appendLog('Vite dev server active — skipping bundled backend start')
    }
    createWindow()
  } catch (err: any) {
    appendLog('Fehler beim Starten: ' + String(err))
    try { dialog.showErrorBox('Startfehler', 'Das Backend konnte nicht gestartet werden: ' + err?.message) } catch {}
    app.quit()
  }
})

// Fallback: log App quits
app.on('will-quit', () => appendLog('will-quit'))
app.on('quit', () => appendLog('quit'))
