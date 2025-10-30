# Backend — FastAPI Service

This folder contains the Python backend service of the monorepo.  
It provides a simple FastAPI application that can be extended with APIs, database connections, and other business logic.

---

## Requirements

- **Python 3.9+**
- **pip**
- **virtualenv** or **venv** module ( ``` python -m venv .venv```)

### Pycharm Interpreter konfigurieren

1. Öffne **File ▸ Settings ▸ Project: `FinalAssessmentHub` ▸ Python Interpreter**
2. Klicke auf **Add Interpreter ▸ Add Existing Interpreter**
3. Wähle den Interpreter deiner virtuellen Umgebung:

   * **Windows:**

     ```
     PATH_TO_PROJECT\backend\.venv\Scripts\python.exe
     ```
   * **Linux / macOS:**

     ```
     PATH_TO_PROJECT/backend/.venv/bin/python
     ```

---

Activate it:

- **macOS/Linux:**
  ```bash
  source .venv/bin/activate
  ```
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```

---

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> If `requirements.txt` is missing, install manually:
> ```bash
> pip install fastapi uvicorn
> pip freeze > requirements.txt
> ```

---

### 3. Run the development server
Please make sure to run this command from the root directory of the monorepo (FinalAssessmentHub)
```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Once started, open:

- API root: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 4. Project structure

```
backend/
├── app
    ├── controller
    └── ...
├── main.py
├── requirements.txt
└── .venv/            # virtual environment (excluded in .gitignore)
```

---

## Tests

```bash
pytest
```
