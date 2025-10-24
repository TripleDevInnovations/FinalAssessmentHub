import os
import json
import pytest
from backend.app.service.file_service import FileService


@pytest.fixture
def file_service(tmp_path):
    test_file = tmp_path / "test_data.json"
    return FileService(filepath=str(test_file))


@pytest.fixture
def populated_file_service(file_service):
    entry1 = file_service.save({"name": "Anna", "value": 100})
    entry2 = file_service.save({"name": "Ben", "value": 200})
    return file_service, [entry1, entry2]


class TestFileService:
    def test_init_creates_directory_and_file(self, tmp_path):
        dir_path = tmp_path / "new_dir"
        file_path = dir_path / "data.json"

        assert not os.path.exists(dir_path)

        # Service initialisieren
        FileService(filepath=str(file_path))

        assert os.path.exists(dir_path)
        assert os.path.exists(file_path)
        with open(file_path, "r") as f:
            assert json.load(f) == []

    def test_load_all_on_empty_file(self, file_service):
        assert file_service.load_all() == []

    def test_save_and_load_all(self, file_service):
        entry_to_save = {"name": "Test Entry", "data": [1, 2, 3]}

        saved_entry = file_service.save(entry_to_save)

        assert "id" in saved_entry
        assert saved_entry["name"] == "Test Entry"

        all_entries = file_service.load_all()
        assert len(all_entries) == 1
        assert all_entries[0] == saved_entry

    def test_get_by_id(self, populated_file_service):
        service, entries = populated_file_service
        entry1, entry2 = entries

        found_entry = service.get_by_id(entry1["id"])
        assert found_entry == entry1

        assert service.get_by_id("non_existent_id") is None

    def test_delete_by_id(self, populated_file_service):
        service, entries = populated_file_service
        entry1, entry2 = entries

        result = service.delete_by_id(entry1["id"])
        assert result is True

        remaining_entries = service.load_all()
        assert len(remaining_entries) == 1
        assert remaining_entries[0] == entry2
        assert service.get_by_id(entry1["id"]) is None

        result_non_existent = service.delete_by_id("non_existent_id")
        assert result_non_existent is False
        assert len(service.load_all()) == 1

    def test_update_by_id(self, populated_file_service):
        service, entries = populated_file_service
        entry1, _ = entries

        update_data = {"name": "Anna Updated", "value": 150}

        updated_entry = service.update_by_id(entry1["id"], update_data)

        assert updated_entry["id"] == entry1["id"]
        assert updated_entry["name"] == "Anna Updated"
        assert updated_entry["value"] == 150

        retrieved_entry = service.get_by_id(entry1["id"])
        assert retrieved_entry == updated_entry

        non_existent_update = service.update_by_id("non_existent_id", {"name": "ghost"})
        assert non_existent_update is None

    def test_load_with_corrupted_json(self, file_service):
        with open(file_service.filepath, "w") as f:
            f.write("{'name': 'test',")

        assert file_service.load_all() == []

        with open(file_service.filepath, "r") as f:
            assert json.load(f) == []
