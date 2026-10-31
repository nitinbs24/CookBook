from datetime import UTC, datetime
from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel


def _iso_ms(value: datetime) -> str:
    """`2026-10-31T05:30:00.123Z`: what JSON.stringify(Date) gives in Express (contract tests compare it)."""
    value = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
    return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


IsoDatetime = Annotated[datetime, PlainSerializer(_iso_ms, return_type=str)]


class CamelModel(BaseModel):
    """Request/response base: camelCase on the wire, snake_case in Python."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


T = TypeVar("T")


class Page(CamelModel, Generic[T]):
    """`{ items, page, limit, total }` (TRD §6.1)."""

    items: list[T]
    page: int
    limit: int
    total: int
