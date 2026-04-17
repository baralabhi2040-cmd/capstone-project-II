from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_predict_email():
    response = client.post(
        "/predict/email",
        json={
            "sender": "security@gmail.com",
            "subject": "Urgent verify your account",
            "body": "Click here immediately to reset password https://bad-link.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["channel"] == "email"
    assert "label" in data
    assert "ml_score" in data
    assert "rule_score" in data
    assert "summary" in data
    assert "recommendation" in data
    assert "indicators" in data
