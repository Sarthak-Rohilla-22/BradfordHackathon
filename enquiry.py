# schemas/enquiry.py
from pydantic import BaseModel, Field
from typing import List, Optional

class InventoryItem(BaseModel):
    name: str = Field(description="Normalized item name, e.g., '3-Seater Sofa'")
    quantity: int = Field(default=1, description="Detected quantity")
    estimated_volume_m3: float = Field(description="Estimated cubic volume per unit")

class PropertyDetails(BaseModel):
    property_type: str = Field(description="flat, house, bungalow, storage_unit")
    bedrooms: int
    floor_level: int = Field(default=0, description="0 = Ground Floor")
    has_lift: bool = Field(default=False)
    parking_access: Optional[str] = Field(description="driveway, street, permit_required, unknown")

class MovingEnquiry(BaseModel):
    origin_postcode: str
    destination_postcode: str
    origin_property: PropertyDetails
    destination_property: PropertyDetails
    preferred_date: str
    items: List[InventoryItem]
    missing_fields: List[str] = Field(description="Crucial details missing from request, e.g. 'destination_floor_level'")