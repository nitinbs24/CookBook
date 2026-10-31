import os

# Unit tests never touch the real .env values; settings read these first.
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/recipebook_test")
os.environ.setdefault("JWT_SECRET", "unit-test-secret-at-least-32-characters")
os.environ.setdefault("CORS_ORIGIN", "http://localhost:5173")
