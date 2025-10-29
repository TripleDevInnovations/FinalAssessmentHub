from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.controller import exam_controller

app = FastAPI()

origins = [
    "http://localhost:3000",    # create-react-app dev
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # vite
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(exam_controller.router, prefix="/exam", tags=["Exam"])