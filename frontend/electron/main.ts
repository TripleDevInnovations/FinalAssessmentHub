import { app, BrowserWindow, nativeImage, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import * as path from 'path'
import * as fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import * as http from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null

// --- Backend control ---
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 8000)
let backendProcess: ChildProcess | null = null

function getBundledBackendPath(): string {
  // electron-builder legt extraResources unter process.resourcesPath
  // Ich nehme an, du packst in extraResources "from: dist_backend, to: backend"
  // dann liegt die Datei unter: <resources>/backend/<exeName>
  const exeName = process.platform === 'win32' ? 'backend.exe' : 'backend'
  return path.join(process.resourcesPath, 'backend', exeName)
}

function makeExecutableIfNeeded(p: string) {
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(p, 0o755)
    } catch (err) {
      console.warn('chmod failed', err)
    }
  }
}

function startBundledBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const exePath = getBundledBackendPath()

    if (!fs.existsSync(exePath)) {
      return reject(new Error(`Backend binary not found at ${exePath}`))
    }

    makeExecutableIfNeeded(exePath)

    // spawn the backend. Pass port via env so the binary can read it
    backendProcess = spawn(exePath, [], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BACKEND_PORT: String(BACKEND_PORT) }
    })

    backendProcess.stdout?.on('data', d => {
      console.log('[backend stdout]', d.toString())
    })
    backendProcess.stderr?.on('data', d => {
      console.error('[backend stderr]', d.toString())
    })

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend exited: code=${code} signal=${signal}`)
      backendProcess = null
      // Falls das Backend unerwartet beendet wird, zeige Info (optional)
      dialog.showErrorBox('Backend beendet', 'Das lokale Backend wurde beendet. Die Anwendung kann nicht korrekt funktionieren.')
    })

    // Warte bis /health antwortet
    waitForBackendReady(50, 200)
      .then(() => resolve())
      .catch(err => {
        // Backend hat sich nicht rechtzeitig gemeldet -> kill process & reject
        try { backendProcess?.kill('SIGKILL') } catch (e) { /* ignore */ }
        backendProcess = null
        reject(err)
      })
  })
}

function stopBundledBackend(): void {
  if (!backendProcess) return
  try {
    backendProcess.kill('SIGTERM')
    // fallback kill nach 2s
    setTimeout(() => {
      if (backendProcess) {
        try { backendProcess.kill('SIGKILL') } catch (e) { /* ignore */ }
        backendProcess = null
      }
    }, 2000)
  } catch (err) {
    console.error('Error stopping backend', err)
  }
}

function waitForBackendReady(retries = 50, intervalMs = 200): Promise<void> {
  const url = `http://127.0.0.1:${BACKEND_PORT}/health`
  return new Promise((resolve, reject) => {
    let attempts = 0
    const t = setInterval(() => {
      attempts++
      const req = http.get(url, res => {
        // status 200 => ready
        if (res.statusCode === 200) {
          clearInterval(t)
          resolve()
        } else if (attempts >= retries) {
          clearInterval(t)
          reject(new Error('Backend antwortete mit Status ' + res.statusCode))
        }
        // andernfalls weiter poll
      })
      req.on('error', () => {
        if (attempts >= retries) {
          clearInterval(t)
          reject(new Error('Backend nicht erreichbar (Connection error)'))
        }
      })
      req.setTimeout(1000, () => {
        req.destroy()
      })
    }, intervalMs)
  })
}

// --- Window / app lifecycle ---
function createWindow() {
  const iconPath = path.join(__dirname, '..', 'src', 'assets', 'logo_white.png')
  const icon = nativeImage.createFromPath(iconPath)

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon,
    resizable: true,
    fullscreenable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Main: wenn App ready ist -> in prod backend starten, danach Fenster erstellen
app.whenReady().then(async () => {
  try {
    if (!VITE_DEV_SERVER_URL) {
      // Produktion: starte gebündeltes Backend
      await startBundledBackend()
    } else {
      // Dev: angenommen Backend läuft lokal (oder du willst es manuell starten)
      console.log('Vite dev server active — skipping bundled backend start')
    }

    createWindow()
  } catch (err: any) {
    console.error('Fehler beim Starten', err)
    dialog.showErrorBox('Startfehler', 'Das Backend konnte nicht gestartet werden: ' + err?.message)
    app.quit()
  }
})

// Beim Beenden das Backend stoppen
app.on('before-quit', () => {
  stopBundledBackend()
})
