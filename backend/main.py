from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from backend.app.controller import exam_controller, root_controller

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
    uvicorn.run(app, host="127.0.0.1", port=port)
