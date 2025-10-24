from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.app.controller.exam_controller import router

app = FastAPI()
app.include_router(router, prefix="/exam")

client = TestClient(app)

VALID_PAYLOAD = {
    "Name": "test name",
    "AP1": 85,
    "ap2": {
        "planning": {"main": 90},
        "development": {"main": 88, "extra": 92},
        "economy": {"main": 78}
    },
    "ml": {
        "ML1": 95,
        "ML2": 98
    }
}

MOCK_ENTRY = {"id": "some_test_id", **VALID_PAYLOAD}


from unittest.mock import patch, MagicMock

@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_get_all_results(mock_file_service):
    mock_file_service.load_all.return_value = []

    response = client.get("/exam/all")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json() == []


def test_get_specific_result_not_found():
    with patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock) as mock_file_service:
        mock_file_service.get_by_id.return_value = None

        response = client.get("/exam/an_id_that_does_not_exist")

        assert response.status_code == 404
        assert response.json() == {"detail": "Entry not found"}
        mock_file_service.get_by_id.assert_called_with("an_id_that_does_not_exist")


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_save_numbers_success(mock_file_service):
    mock_file_service.save.return_value = MOCK_ENTRY

    response = client.post("/exam/save", json=VALID_PAYLOAD)

    assert response.status_code == 200
    assert response.json() == {"message": "Numbers saved successfully!", "data": MOCK_ENTRY}
    mock_file_service.save.assert_called_once()


def test_save_numbers_validation_error():
    invalid_payload = VALID_PAYLOAD.copy()
    invalid_payload["AP1"] = 101

    response = client.post("/exam/save", json=invalid_payload)

    assert response.status_code == 422


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_get_specific_result_found(mock_file_service):
    mock_file_service.get_by_id.return_value = MOCK_ENTRY

    response = client.get(f"/exam/{MOCK_ENTRY['id']}")

    assert response.status_code == 200
    assert response.json() == MOCK_ENTRY
    mock_file_service.get_by_id.assert_called_with(MOCK_ENTRY['id'])


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_delete_result_success(mock_file_service):
    mock_file_service.delete_by_id.return_value = True

    response = client.delete(f"/exam/{MOCK_ENTRY['id']}")

    assert response.status_code == 200
    assert response.json() == {"message": "Entry deleted successfully"}
    mock_file_service.delete_by_id.assert_called_with(MOCK_ENTRY['id'])


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_delete_result_not_found(mock_file_service):
    mock_file_service.delete_by_id.return_value = False

    response = client.delete("/exam/an_id_that_does_not_exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Entry not found"}


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_update_result_success(mock_file_service):
    updated_data = {**VALID_PAYLOAD, "Name": "test name the second"}
    mock_file_service.update_by_id.return_value = {"id": MOCK_ENTRY['id'], **updated_data}

    response = client.put(f"/exam/{MOCK_ENTRY['id']}", json=updated_data)

    assert response.status_code == 200
    assert response.json()["message"] == "Entry updated successfully"
    assert response.json()["data"]["Name"] == "test name the second"
    mock_file_service.update_by_id.assert_called_once()


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_update_result_not_found(mock_file_service):
    mock_file_service.update_by_id.return_value = None

    response = client.put("/exam/an_id_that_does_not_exist", json=VALID_PAYLOAD)

    assert response.status_code == 404
    assert response.json() == {"detail": "Entry not found"}


@patch('backend.app.controller.exam_controller.exam_calculation_service', new_callable=MagicMock)
@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_calculate_result_success(mock_file_service, mock_calc_service):
    # Mock Services
    mock_file_service.get_by_id.return_value = MOCK_ENTRY
    mock_calc_service.calculateExamResults.return_value = {"final_grade": 90.5, "passed": True}

    response = client.get(f"/exam/calculate/{MOCK_ENTRY['id']}")

    assert response.status_code == 200
    assert response.json()["message"] == "Entry calculated successfully"
    assert response.json()["data"] == {"final_grade": 90.5, "passed": True}

    mock_file_service.get_by_id.assert_called_with(MOCK_ENTRY['id'])
    mock_calc_service.calculateExamResults.assert_called_once()


@patch('backend.app.controller.exam_controller.file_service', new_callable=MagicMock)
def test_calculate_result_entry_not_found(mock_file_service):
    mock_file_service.get_by_id.return_value = None

    response = client.get("/exam/calculate/an_id_that_does_not_exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Entry not found"}
