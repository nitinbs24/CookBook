"""Runs the real script against the test DB (needs Docker MongoDB, like the Express createAdmin test)."""

import os
import subprocess
import sys
import uuid

import bcrypt
import pytest
from pymongo import MongoClient

TEST_URI = "mongodb://localhost:27017/recipebook_test"


def run(*args):
    env = {**os.environ, "MONGODB_URI": TEST_URI}
    return subprocess.run([sys.executable, "-m", "scripts.create_admin", *args], capture_output=True, text=True, env=env)


@pytest.fixture
def users():
    client = MongoClient(TEST_URI)
    yield client.get_default_database().users
    client.get_default_database().users.delete_many({"email": {"$regex": r"^pyadmin-.*@example\.com$"}})
    client.close()


def email():
    return f"pyadmin-{uuid.uuid4().hex[:8]}@example.com"


def test_creates_an_admin_with_default_name_lowercased_email_and_bcrypt_hash(users):
    address = email()

    result = run(address.upper(), "password123")

    user = users.find_one({"email": address})
    assert result.returncode == 0, result.stderr
    assert f"Created admin {address}" in result.stdout
    assert (user["name"], user["role"]) == ("Admin", "admin")
    assert bcrypt.checkpw(b"password123", user["passwordHash"].encode())


def test_promotes_an_existing_user_and_keeps_their_password(users):
    address = email()
    original = bcrypt.hashpw(b"original-pass", bcrypt.gensalt(4)).decode()
    from datetime import UTC, datetime

    users.insert_one({"name": "Cook", "email": address, "passwordHash": original, "role": "user", "createdAt": datetime.now(UTC)})

    result = run(address, "different-pass", "Ignored Name")

    user = users.find_one({"email": address})
    assert "(password unchanged)" in result.stdout
    assert (user["role"], user["passwordHash"]) == ("admin", original)


def test_rejects_invalid_input_with_exit_code_1(users):
    before = users.count_documents({})

    result = run("not-an-email", "short")

    assert result.returncode == 1
    assert users.count_documents({}) == before
