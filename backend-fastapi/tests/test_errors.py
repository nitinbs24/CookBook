from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


def _boom():
    raise RuntimeError("unexpected")


app.add_api_route("/api/v1/__test_boom", _boom)
client = TestClient(app, raise_server_exceptions=False)  # no `with`: lifespan (DB) is not started


def test_unexpected_errors_are_500_in_the_api_shape_and_keep_cors_headers():
    res = client.get("/api/v1/__test_boom", headers={"Origin": settings.cors_origin})

    assert res.status_code == 500
    assert res.json() == {"error": {"code": "INTERNAL", "message": "Something went wrong"}}
    assert res.headers.get("access-control-allow-origin") == settings.cors_origin


def test_unknown_methods_are_404_like_express():
    res = client.delete("/api/v1/categories")

    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"
