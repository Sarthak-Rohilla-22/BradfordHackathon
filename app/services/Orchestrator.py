from pydantic import BaseModel
from typing import Optional
from app.services.gemma_orchestration import parse_enquiry_text, GemmaExtractionResult
from app.services.openloft_memory import query_openloft_memory, MemoryNote
from app.services.quote_engine import calculate_quote, CalculatedQuote

class OrchestrationResult(BaseModel):
    extraction: GemmaExtractionResult
    memory_note: Optional[MemoryNote] = None
    calculated_quote: CalculatedQuote
    reasoning_trace: str

def process_moving_pipeline(user_prompt: str, distance_miles: float = 15.0) -> OrchestrationResult:
    # 1. Gemma 4 NLU Extraction
    extraction = parse_enquiry_text(user_prompt)

    # 2. OpenLoft Persistent Operational Memory Query
    memory_note = query_openloft_memory(extraction.origin_postcode)
    buffer_mins = memory_note.buffer_minutes if memory_note else 0

    # 3. Calculate volume m3
    total_volume = sum(item.quantity * item.volume_m3 for item in extraction.items)

    # 4. Deterministic Pricing Engine execution with memory buffer
    quote = calculate_quote(
        volume_m3=total_volume,
        distance_miles=distance_miles,
        floor_level=extraction.floor_level,
        has_lift=extraction.has_lift,
        buffer_minutes=buffer_mins
    )

    # 5. Build AI reasoning trace for Admin Dashboard
    warning_txt = f" (Memory Flag: {memory_note.access_warning})" if memory_note else ""
    reasoning_trace = (
        f"Gemma 4 extracted {len(extraction.items)} items ({total_volume}m³). "
        f"Assigned {quote.recommended_vehicle} with {quote.movers_required} movers.{warning_txt}"
    )

    return OrchestrationResult(
        extraction=extraction,
        memory_note=memory_note,
        calculated_quote=quote,
        reasoning_trace=reasoning_trace
    )