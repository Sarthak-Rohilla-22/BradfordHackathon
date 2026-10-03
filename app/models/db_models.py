from datetime import datetime, date
from typing import Optional
from sqlmodel import SQLModel, Field

class Enquiry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_name: str
    customer_email: str
    customer_phone: str
    origin_postcode: str
    destination_postcode: str
    property_type: str
    bedrooms: int
    floor_level: int = 0
    has_lift: bool = False
    items_json: str
    preferred_date: date
    status: str = "PENDING"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Quote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    enquiry_id: int = Field(foreign_key="enquiry.id")
    estimated_volume_m3: float
    estimated_duration_hours: float
    recommended_vehicle: str
    movers_required: int
    labour_cost: float
    vehicle_cost: float
    travel_cost: float
    access_surcharge: float
    subtotal: float
    vat: float
    total_price: float
    status: str = "ISSUED"
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Vehicle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    license_plate: str
    vehicle_type: str
    volume_capacity_m3: float
    is_active: bool = True

class Crew(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: str
    role: str = "Mover"
    is_active: bool = True

class Booking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quote_id: int = Field(foreign_key="quote.id")
    enquiry_id: int = Field(foreign_key="enquiry.id")
    scheduled_date: date
    start_time: str
    end_time: str
    vehicle_id: int = Field(foreign_key="vehicle.id")
    crew_count: int
    assigned_crew_ids: str
    status: str = "CONFIRMED"
    created_at: datetime = Field(default_factory=datetime.utcnow)