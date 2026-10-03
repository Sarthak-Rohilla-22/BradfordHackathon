from datetime import date, datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


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
  status: str = "QUOTED"
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Booking(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  quote_id: int = Field(foreign_key="quote.id")
  scheduled_date: date
  selected_time_slot: str
  status: str = "CONFIRMED"
  created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Vehicle(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  name: str
  capacity_m3: float = Field(default=18.0)
  base_rate: float = Field(default=95.0)


class Crew(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  name: str
  role: str = Field(default="Driver")
  hourly_rate: float = Field(default=25.0)