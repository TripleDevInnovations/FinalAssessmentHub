from fastapi import FastAPI
from pydantic import BaseModel
import json
from pathlib import Path

app = FastAPI()

# File to store the numbers
DATA_FILE = Path("data/storage.json")


# Define request body
class Numbers(BaseModel):
    a: float
    b: float


@app.post("/save")
def save_numbers(data: Numbers):
    # Prepare the data
    entry = {"a": data.a, "b": data.b}

    # Read existing data if file exists
    if DATA_FILE.exists():
        with open(DATA_FILE, "r") as f:
            try:
                all_data = json.load(f)
            except json.JSONDecodeError:
                all_data = []
    else:
        all_data = []

    # Append the new entry
    all_data.append(entry)

    # Save back to the file
    with open(DATA_FILE, "w") as f:
        json.dump(all_data, f, indent=2)

    return {"message": "Numbers saved successfully!", "data": entry}
