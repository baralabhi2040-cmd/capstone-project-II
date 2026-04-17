from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_predict_url():
    response = client.post("/predict/url", json={"url": "http://192.168.1.1/login"})
    assert response.status_code == 200
    data = response.json()
    assert data["channel"] == "url"
    assert "label" in data
    assert "ml_score" in data
    assert "rule_score" in data
    assert "summary" in data
    assert "recommendation" in data
    assert "indicators" in data
