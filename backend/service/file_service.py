import json
import os
import uuid

class FileService:
    def __init__(self, filepath: str):
        self.filepath = filepath
        if not os.path.exists(filepath):
            with open(filepath, "w") as f:
                json.dump([], f)

    def _load(self):
        with open(self.filepath, "r") as f:
            return json.load(f)

    def _save(self, data):
        with open(self.filepath, "w") as f:
            json.dump(data, f, indent=4)

    def save(self, entry: dict):
        data = self._load()
        entry["id"] = str(uuid.uuid4())
        data.append(entry)
        self._save(data)
        return entry

    def load_all(self):
        return self._load()

    def get_by_id(self, entry_id: str):
        data = self._load()
        for item in data:
            if item["id"] == entry_id:
                return item
        return None

    def delete_by_id(self, entry_id: str):
        data = self._load()
        new_data = [item for item in data if item["id"] != entry_id]
        if len(new_data) == len(data):
            return False
        self._save(new_data)
        return True

    def update_by_id(self, entry_id: str, new_entry: dict):
        data = self._load()
        for i, item in enumerate(data):
            if item["id"] == entry_id:
                new_entry["id"] = entry_id
                data[i] = new_entry
                self._save(data)
                return new_entry
        return None
