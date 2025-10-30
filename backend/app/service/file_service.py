import json
import os
import uuid
from json import JSONDecodeError

class FileService:
    def __init__(self, filepath: str):
        self.filepath = filepath
        dirpath = os.path.dirname(filepath)
        if dirpath and not os.path.exists(dirpath):
            os.makedirs(dirpath, exist_ok=True)
        if not os.path.exists(filepath):
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _load(self):
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except (JSONDecodeError, ValueError):
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump([], f)
            return []
        except FileNotFoundError:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump([], f)
            return []

    def _save(self, data):
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

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
            if item.get("id") == entry_id:
                return item
        return None

    def delete_by_id(self, entry_id: str):
        data = self._load()
        new_data = [item for item in data if item.get("id") != entry_id]
        if len(new_data) == len(data):
            return False
        self._save(new_data)
        return True

    def update_by_id(self, entry_id: str, new_entry: dict):
        data = self._load()
        for i, item in enumerate(data):
            if item.get("id") == entry_id:
                new_entry["id"] = entry_id
                data[i] = new_entry
                self._save(data)
                return new_entry
        return None
