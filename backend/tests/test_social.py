from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_predict_social():
    response = client.post(
        "/predict/social",
        json={
            "platform": "instagram",
            "message": "You won a prize. Verify your account now using https://fake-site.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["channel"] == "social"
    assert "label" in data
    assert "ml_score" in data
    assert "rule_score" in data
    assert "summary" in data
    assert "recommendation" in data
    assert "indicators" in data
