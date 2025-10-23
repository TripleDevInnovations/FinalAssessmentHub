# Frontend — Electron + TypeScript App

This folder contains the Electron desktop frontend of the monorepo.  
It uses TypeScript and Webpack (or your chosen setup) to build and run a cross-platform desktop UI.

---

## Requirements

- **Node.js 18+**
- **npm** (comes with Node)
- (optional) **VS Code** for TypeScript + Electron debugging

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This installs all required modules listed in `package.json`.

---

### 2. Run in development mode

```bash
npm start
```

This will:
- Build the TypeScript source
- Launch the Electron app

The application window should open automatically.

---

### 3. Build for production

```bash
npm run build
```

This compiles TypeScript into JavaScript in the `dist/` folder.

---

### 4. Project structure

```
frontend/
├── package.json
├── tsconfig.json
├── src/ or main.ts        # main Electron process
├── public/ or static/     # HTML files and assets
└── dist/                  # compiled output
```

---

## Connecting to the Backend

If your Electron app needs to call the backend API (running on FastAPI):

```ts
fetch("http://127.0.0.1:8000/health")
  .then(res => res.json())
  .then(console.log);
```

Make sure your backend server is running before launching the Electron app.

---

## Notes

- Edit `main.ts` to modify the Electron main process.
- Add frontend frameworks (React, Vue, etc.) inside the renderer as needed.
- For debugging, use VS Code’s “Electron: Start” launch configuration or `npm start` directly.
