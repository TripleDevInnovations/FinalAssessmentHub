from fastapi import FastAPI
from contoller import exam_controller

app = FastAPI()

app.include_router(exam_controller.router, prefix="/exam", tags=["Exam"])