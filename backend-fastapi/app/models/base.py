from pydantic import ConfigDict
from pydantic.alias_generators import to_camel


def _field_alias(name: str) -> str:
    # Beanie stores `id` as Mongo's `_id`; a plain camelCase generator would rename it to "id".
    return "_id" if name == "id" else to_camel(name)


# Stored field names are camelCase, identical to what the Express backend writes (TRD D3).
DOCUMENT_CONFIG = ConfigDict(alias_generator=_field_alias, populate_by_name=True)
