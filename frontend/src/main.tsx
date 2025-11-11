import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './i18n'


const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);


// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
