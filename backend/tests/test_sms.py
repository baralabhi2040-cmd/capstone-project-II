from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_predict_sms():
    response = client.post(
        "/predict/sms",
        json={
            "sender": "2211",
            "message": "Urgent! Your parcel is held. Click http://bit.ly/test",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["channel"] == "sms"
    assert "label" in data
    assert "ml_score" in data
    assert "rule_score" in data
    assert "summary" in data
    assert "recommendation" in data
    assert "indicators" in data
