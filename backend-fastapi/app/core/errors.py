import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("recipebook")


class ApiError(Exception):
    """An error sent as-is: `{ "error": { code, message } }` with `status` (TRD §6.1)."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


def _validation_message(exc: RequestValidationError) -> str:
    first = exc.errors()[0]
    if first["type"] == "json_invalid":
        return "body: Malformed JSON"
    # Same "<path>: <message>" shape as the Express backend, e.g. "ingredients.0.name: ...".
    path = ".".join(str(p) for p in first["loc"] if p not in ("body", "query", "path"))
    return f"{path or 'body'}: {first['msg']}"


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error(_req: Request, exc: ApiError):
        return _error(exc.status, exc.code, exc.message)

    # FastAPI answers bad input with 422; the contract says 400.
    @app.exception_handler(RequestValidationError)
    async def validation_error(_req: Request, exc: RequestValidationError):
        return _error(400, "VALIDATION_ERROR", _validation_message(exc))

    @app.exception_handler(StarletteHTTPException)
    async def http_error(req: Request, exc: StarletteHTTPException):
        if exc.status_code in (404, 405):  # Express treats an unknown method + path as a missing route
            return _error(404, "NOT_FOUND", f"No route for {req.method} {req.url.path}")
        return _error(exc.status_code, "INTERNAL" if exc.status_code >= 500 else "VALIDATION_ERROR", str(exc.detail))

    @app.exception_handler(DuplicateKeyError)
    async def duplicate(_req: Request, _exc: DuplicateKeyError):
        return _error(409, "CONFLICT", "Already exists")

    # A middleware, not @exception_handler(Exception): Starlette runs that handler outside every
    # middleware, so its 500 would miss the CORS headers and the browser would hide it.
    # main.py adds CORS after this, so CORS wraps it.
    @app.middleware("http")
    async def unexpected(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            log.exception("Unhandled error on %s %s", request.method, request.url.path)
            return _error(500, "INTERNAL", "Something went wrong")
