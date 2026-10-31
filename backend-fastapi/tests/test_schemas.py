from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginIn, RegisterIn, UserOut


def test_register_trims_name_and_trims_and_lowercases_email():
    body = RegisterIn(name="  Asha  ", email=" Asha@Example.COM ", password="password123")

    assert (body.name, body.email) == ("Asha", "asha@example.com")


def test_register_ignores_fields_the_client_must_not_set():
    body = RegisterIn.model_validate({"name": "Asha", "email": "a@b.co", "password": "password123", "role": "admin"})

    assert not hasattr(body, "role")


@pytest.mark.parametrize(
    "data",
    [
        {"name": "A", "email": "a@b.co", "password": "password123"},
        {"name": "Asha", "email": "not-an-email", "password": "password123"},
        {"name": "Asha", "email": "a@b.co", "password": "short"},
        {"name": "Asha", "email": "a@b.co", "password": "x" * 73},
        {"name": "Asha", "email": {"$gt": ""}, "password": "password123"},
    ],
)
def test_register_rejects_invalid_input(data):
    with pytest.raises(ValidationError):
        RegisterIn.model_validate(data)


def test_login_rejects_a_non_string_email():
    with pytest.raises(ValidationError):
        LoginIn.model_validate({"email": {"$gt": ""}, "password": "x"})


def test_user_out_uses_camel_case_and_millisecond_utc_dates_like_express():
    out = UserOut(id="u1", name="Asha", email="a@b.co", role="user", created_at=datetime(2026, 10, 31, 5, 30, 0, 123456, tzinfo=UTC))

    data = out.model_dump(mode="json", by_alias=True)

    assert data == {"id": "u1", "name": "Asha", "email": "a@b.co", "role": "user", "createdAt": "2026-10-31T05:30:00.123Z"}


def test_naive_datetimes_are_treated_as_utc():
    out = UserOut(id="u1", name="A", email="a@b.co", role="user", created_at=datetime(2026, 1, 2, 3, 4, 5))

    assert out.model_dump(mode="json", by_alias=True)["createdAt"] == "2026-01-02T03:04:05.000Z"
