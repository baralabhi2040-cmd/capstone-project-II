from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app

client = TestClient(app)


class BrokenDb:
    def query(self, *args, **kwargs):
        raise RuntimeError("database offline")

    def rollback(self):
        return None


def override_broken_db():
    yield BrokenDb()


def test_health_route_is_available():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "database" in data


def test_stats_shape_matches_dashboard_contract():
    response = client.get("/stats")
    assert response.status_code == 200
    data = response.json()

    expected_keys = {
        "total_scans",
        "phishing_count",
        "legitimate_count",
        "most_targeted_channel",
        "scope",
        "channel_counts",
        "risk_distribution",
        "daily_activity",
    }
    assert expected_keys.issubset(data.keys())
    assert isinstance(data["channel_counts"], dict)
    assert isinstance(data["risk_distribution"], dict)
    assert isinstance(data["daily_activity"], list)


def test_logs_route_is_available_for_frontend():
    response = client.get("/logs?limit=10")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_stats_and_logs_fall_back_when_database_is_unavailable():
    app.dependency_overrides[get_db] = override_broken_db
    try:
        stats_response = client.get("/stats")
        logs_response = client.get("/logs?limit=2")
    finally:
        app.dependency_overrides.clear()

    assert stats_response.status_code == 200
    assert stats_response.json()["scope"] == "guest-demo"
    assert logs_response.status_code == 200
    assert len(logs_response.json()) == 2


def test_sms_and_social_routes_match_frontend_contract():
    sms_response = client.post(
        "/predict/sms",
        json={
            "sender": "212",
            "message": "Congratulations, you won 10M. Claim your reward now.",
        },
    )
    assert sms_response.status_code == 200
    assert sms_response.json()["channel"] == "sms"

    social_response = client.post(
        "/predict/social",
        json={
            "platform": "instagram",
            "message": "Verify your account to unlock a giveaway prize.",
        },
    )
    assert social_response.status_code == 200
    assert social_response.json()["channel"] == "social"


def test_vercel_origins_are_allowed_by_cors():
    response = client.options(
        "/health",
        headers={
            "Origin": "https://capstone-project-ii.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://capstone-project-ii.vercel.app"
    )

    preview_response = client.options(
        "/health",
        headers={
            "Origin": "https://capstone-project-ii-git-main-demo.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert preview_response.status_code == 200
    assert preview_response.headers["access-control-allow-origin"] == (
        "https://capstone-project-ii-git-main-demo.vercel.app"
    )
