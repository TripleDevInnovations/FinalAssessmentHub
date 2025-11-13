from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from backend.app.controller import exam_controller, root_controller

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "logging.Formatter",
            "fmt": "%(levelname)s:     %(message)s",
        },
        "access": {
            "()": "logging.Formatter",
            "fmt": "%(levelname)s:     %(client_addr)s - \"%(request_line)s\" %(status_code)s",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
    },
}

app = FastAPI()

origins = [
    "http://localhost:3000",    # create-react-app dev
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # vite
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(exam_controller.router, prefix="/exam", tags=["Exam"])
app.include_router(root_controller.router, tags=["Root"])

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port, log_config=LOG_CONFIG)
