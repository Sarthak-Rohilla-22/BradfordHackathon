# services/orchestrator.py
from services.openloft import OpenLoftMemory
from services.gemma import GemmaAgent
from services.quote_engine import calculate_quote

async def process_moving_request(enquiry: MovingEnquiry):
    # Step 1: OpenLoft Context Retrieval
    memory = OpenLoftMemory()
    location_memories = await memory.query(
        f"Past moving issues, parking delays, or access constraints at {enquiry.origin_postcode} or {enquiry.destination_postcode}"
    ) # Returns e.g. "LS1 4AP has narrow access alleyway; adds ~30 mins unloading time."

    # Step 2: Gemma 4 Reasoning with Memory Context
    gemma_analysis = await GemmaAgent.analyze(
        enquiry=enquiry,
        historical_context=location_memories
    )
    # Gemma outputs: crew_recommendation=3, vehicle="Luton Van", buffer_minutes=30

    # Step 3: Deterministic Backend Calculation (AI cannot touch money/pricing directly)
    final_quote = calculate_quote(
        distance_miles=gemma_analysis.distance_miles,
        volume_m3=gemma_analysis.total_volume_m3,
        crew_size=gemma_analysis.crew_recommendation,
        stair_count=enquiry.origin_property.floor_level,
        buffer_minutes=gemma_analysis.buffer_minutes
    )

    return {
        "analysis": gemma_analysis,
        "quote": final_quote,
        "applied_memories": location_memories
    }
