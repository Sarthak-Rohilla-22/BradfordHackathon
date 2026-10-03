from pydantic import BaseModel, Field
from typing import Optional


class MovingEnquiry(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None

    property_type: Optional[str] = None
    bedrooms: Optional[int] = Field(default=None, ge=0)

    preferred_date: Optional[str] = None

    floor: Optional[int] = Field(default=None, ge=0)
    has_lift: Optional[bool] = None

    estimated_boxes: Optional[int] = Field(default=None, ge=0)

    special_items: list[str] = []

    notes: Optional[str] = None