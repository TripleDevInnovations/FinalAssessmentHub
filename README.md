# FA Grades Calculator

A compact desktop application for apprentices to record exam subresults, compute final grades, confirm pass or fail status, persist data with privacy in mind, switch UI theme, change language between English and German, and hear the result via speech output.

---

## Features

- **Start and Exit**: install, run, and close the program at any time.  
- **Enter Results**: input subexam scores for AP Part 1 and AP Part 2 including theory, software project, and optional theory supplement.  
- **Save and Load**: persist entered results to a local file with privacy aware storage and reload them automatically on startup.  
- **Intermediate Outputs**: display interim scores per entry and aggregated interim scores for AP Part 1, AP Part 2 theory, AP Part 2 project, and AP Part 2 total.  
- **Final Calculation**: compute the final grade and display a clear Passed or Not Passed verdict.  
- **Themes**: toggle between Light mode and Dark mode for improved readability.  
- **Localization**: switch the entire UI between English and German.  
- **Speech Output**: read the computed result aloud honoring the selected language.  
- **Documentation and Tests**: built in documentation and a test dataset runner to validate expected behavior.

---

## Installation

- **Read the manual** in the docs folder for prerequisites and platform notes.  
- **Install the program** by following the platform specific installer script or build steps in the repository.  
- **Start the application** using the supplied launcher or executable.

---

## Quick Usage Guide

- **Open the app** to view or load previously saved results.  
- **Enter subexam scores** in the input form sections labeled for AP Part 1 and AP Part 2 components.  
- **Save results** to store them locally; saved data is reloaded automatically on next start.  
- **View interim scores** shown next to each input and summarized for each subpart.  
- **Compute final grade** using the Calculate button; the final grade and pass or fail status appear immediately.  
- **Toggle theme** in Settings between Light and Dark modes to change the UI color scheme.  
- **Switch language** in Settings to English or German to update all interface text.  
- **Listen to results** by triggering the Speak Result action; speech respects the chosen language.  
- **Exit** by using the Close or Exit control to free system resources.

---

## Product Backlog with Story Points

| Item | Story Points |
|---|---:|
| Input interface for exam results | 4 |
| Show interim grade per entry | 1 |
| Show interim grade aggregations | 1 |
| Show final grade | 1 |
| Show Passed or Not Passed | 1 |
| Save results with privacy considerations | 3 |
| Load saved results | 2 |
| Calculate interim grades | 6 |
| Calculate final grade | 3 |
| Determine Passed or Not Passed logic | 1 |
| Light and Dark mode | 3 |
| Language settings English and German | 3 |
| Speech output of result | 2 |
| Documentation | 3 |
| Start and close program | 1 |
| Run test dataset suite | 5 |

---

## Testing and Documentation

- **TODO**

---

## Tech Stack

**Architecture:** Python Backend + TypeScript Frontend (Desktop)

**Frontend (empfohlen):** Electron (TS runs in Node + Chromium) or a neutral desktop layer such as Neutralino or Tauri.

**Communication:** local HTTP / WebSocket / gRPC or direct stdio / IPC between Node and Python.

**Vorteile:** large ecosystems (React / Vue) for UI; many TS/JS developers available.

**Nachteile:** Electron embeds a browser engine (larger footprint); if you strictly mean "no browser", Electron is still a desktop app but uses Chromium internally.

