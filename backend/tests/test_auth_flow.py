from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_account_verification_and_snapshot_flow():
    unique_email = f"tester-{uuid4().hex[:10]}@example.com"

    register_response = client.post(
        "/auth/register",
        json={
            "full_name": "Integration Tester",
            "email": unique_email,
            "password": "testing1234",
        },
    )
    assert register_response.status_code == 201
    register_data = register_response.json()
    assert register_data["user"]["email"] == unique_email
    assert register_data["user"]["is_verified"] is False
    assert register_data["verification_preview_url"]

    auth_headers = {"Authorization": f"Bearer {register_data['token']}"}

    me_response = client.get("/auth/me", headers=auth_headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == unique_email

    scan_response = client.post(
        "/predict/sms",
        json={
            "sender": "212",
            "message": "Congratulations you have won 10 M you don't have to work anymore",
        },
        headers=auth_headers,
    )
    assert scan_response.status_code == 200
    scan_data = scan_response.json()
    assert scan_data["scan_id"]

    blocked_snapshot = client.post(
        f"/snapshots/{scan_data['scan_id']}/email",
        headers=auth_headers,
    )
    assert blocked_snapshot.status_code == 403

    verification_url = register_data["verification_preview_url"]
    parsed = urlparse(verification_url)
    assert parsed.path == "/auth/verify-page"
    token = parse_qs(parsed.query)["token"][0]
    verify_response = client.get(f"{parsed.path}?token={token}")
    assert verify_response.status_code == 200
    assert "Email verified" in verify_response.text
    assert "Continue to account workspace" in verify_response.text
    assert "/auth?verified=1" in verify_response.text

    delivered_snapshot = client.post(
        f"/snapshots/{scan_data['scan_id']}/email",
        headers=auth_headers,
    )
    assert delivered_snapshot.status_code == 200
    delivered_data = delivered_snapshot.json()
    assert delivered_data["delivery_mode"] in {"preview", "smtp"}
