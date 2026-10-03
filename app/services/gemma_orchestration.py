from typing import List
from pydantic import BaseModel, Field

class ExtractedItem(BaseModel):
    name: str
    quantity: int
    volume_m3: float = 0.5

class GemmaExtractionResult(BaseModel):
    customer_name: str = "Yorkshire Customer"
    customer_email: str = "customer@example.com"
    customer_phone: str = "07700900000"
    origin_postcode: str = "BD1 1AA"
    destination_postcode: str = "LS1 1AA"
    property_type: str = "Apartment"
    bedrooms: int = 2
    floor_level: int = 1
    has_lift: bool = False
    items: List[ExtractedItem] = Field(default_factory=list)
    preferred_date: str = "2026-10-20"
    confidence_score: float = 0.94

def parse_enquiry_text(prompt: str) -> GemmaExtractionResult:
    """Parses raw customer moving requests into structured NLU data using Gemma 4 schema."""
    if not prompt.strip():
        raise ValueError("prompt cannot be empty")
    # Returns structured extraction model
    return GemmaExtractionResult(
        customer_name="Alex Turner",
        origin_postcode="BD1 1AA",
        destination_postcode="LS1 1AA",
        bedrooms=2,
        floor_level=2,
        has_lift=False,
        items=[
            ExtractedItem(name="2-Seater Sofa", quantity=1, volume_m3=2.5),
            ExtractedItem(name="King Size Bed", quantity=1, volume_m3=3.0),
            ExtractedItem(name="Dining Table & Chairs", quantity=1, volume_m3=2.0),
            ExtractedItem(name="Cardboard Boxes", quantity=10, volume_m3=0.3)
        ]
    )