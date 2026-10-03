from typing import Dict, Optional
from pydantic import BaseModel

class MemoryNote(BaseModel):
    postcode_prefix: str
    access_warning: str
    buffer_minutes: int
    difficulty_tag: str

# Persistent memory database for operational quirks across Yorkshire
OPENLOFT_MEMORY_STORE: Dict[str, MemoryNote] = {
    "LS1": MemoryNote(
        postcode_prefix="LS1",
        access_warning="Narrow alleyway access; double-parking prohibited on weekday mornings.",
        buffer_minutes=30,
        difficulty_tag="MEDIUM_ACCESS"
    ),
    "BD1": MemoryNote(
        postcode_prefix="BD1",
        access_warning="Cobbled street with steep incline; requires extra loading time.",
        buffer_minutes=45,
        difficulty_tag="HARD_ACCESS"
    ),
    "YO1": MemoryNote(
        postcode_prefix="YO1",
        access_warning="Historic pedestrian zone; bollard clearance required before 10 AM.",
        buffer_minutes=30,
        difficulty_tag="STRICT_WINDOW"
    )
}

def query_openloft_memory(postcode: str) -> Optional[MemoryNote]:
    """Search OpenLoft memory for historical access warnings based on postcode outward code."""
    if not postcode:
        return None
    prefix = postcode.strip().upper().split(" ")[0]
    return OPENLOFT_MEMORY_STORE.get(prefix)