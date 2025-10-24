from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from model.final_exam_result_input import FinalExamResultInput
from service.file_service import FileService
from service.exam_calculation_service import ExamCalculationService

router = APIRouter()
file_service = FileService("data/storage.json")
exam_calculation_service = ExamCalculationService()

@router.post("/save")
def save_numbers(finalexamresultinput: FinalExamResultInput):
    entry = file_service.save(entry=finalexamresultinput.model_dump())
    return {"message": "Numbers saved successfully!", "data": entry}

@router.get("/all")
def get_all_results():
    return file_service.load_all()

@router.get("/{entry_id}")
def get_result(entry_id: str):
    entry = file_service.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.delete("/{entry_id}")
def delete_result(entry_id: str):
    success = file_service.delete_by_id(entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted successfully"}

@router.put("/{entry_id}")
def update_result(entry_id: str, finalexamresultinput: FinalExamResultInput):
    updated = file_service.update_by_id(entry_id, finalexamresultinput.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry updated successfully", "data": updated}

@router.get("/calculate/{entry_id}")
def calculate_result(entry_id: str):
    raw = file_service.get_by_id(entry_id)

    if hasattr(raw, "model_dump"):
        data = raw.model_dump()
    elif hasattr(raw, "dict"):
        data = raw.dict()
    else:
        data = dict(raw)

    data.pop("id", None)

    try:
        finalexamresultinput = FinalExamResultInput.model_validate(data)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.errors())

    response = exam_calculation_service.calculateExamResults(finalexamresultinput)
    return {"message": "Entry calculated successfully", "data": response}
