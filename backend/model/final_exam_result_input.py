from pydantic import BaseModel

class FinalExamResultInput(BaseModel):
    Name: str
    AP1: int
    AP2_1_1: int
    AP2_1_2: int
    AP2_2_1: int
    AP2_2_2: int
    AP2_3_1: int
    AP2_3_2: int
    ML1: int
    ML2: int