from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlmodel import Session

from app.core.database import get_session
from app.models.db_models import Enquiry, Quote
from app.services.quote_engine import calculate_quote
from app.services.Orchestrator import process_moving_pipeline, OrchestrationResult

# This line MUST exist in enquiry.py for router.py to import it:
router = APIRouter()

# --- Request / Response Models ---
class MoveItemInput(BaseModel):
    name: str
    quantity: int
    volume_m3: float = 0.5

class CreateEnquiryRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    origin_postcode: str
    destination_postcode: str
    property_type: str
    bedrooms: int
    floor_level: int = 0
    has_lift: bool = False
    items: List[MoveItemInput]
    preferred_date: str  # YYYY-MM-DD
    distance_miles: float = 12.0

class CreateEnquiryResponse(BaseModel):
    enquiry_id: int
    quote_id: int
    total_price: float
    recommended_vehicle: str
    movers_required: int
    estimated_duration_hours: float

class PromptEnquiryRequest(BaseModel):
    user_prompt: str
    distance_miles: float = 15.0

# --- Endpoints ---

@router.post("/parse-prompt", response_model=OrchestrationResult)
def parse_prompt_enquiry(request: PromptEnquiryRequest):
    if not request.user_prompt.strip():
        raise HTTPException(status_code=400, detail="User prompt cannot be empty.")

    return process_moving_pipeline(
        user_prompt=request.user_prompt,
        distance_miles=request.distance_miles
    )

@router.post("/create", response_model=CreateEnquiryResponse)
def create_enquiry_and_quote(
    request: CreateEnquiryRequest,
    session: Session = Depends(get_session)
):
    try:
        preferred_dt = datetime.strptime(request.preferred_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid preferred_date format. Use YYYY-MM-DD")

    total_volume_m3 = sum(item.quantity * item.volume_m3 for item in request.items)
    if total_volume_m3 == 0:
        total_volume_m3 = request.bedrooms * 6.0

    calc = calculate_quote(
        volume_m3=total_volume_m3,
        distance_miles=request.distance_miles,
        floor_level=request.floor_level,
        has_lift=request.has_lift
    )

    items_json_str = json.dumps([item.model_dump() for item in request.items])
    enquiry = Enquiry(
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        customer_phone=request.customer_phone,
        origin_postcode=request.origin_postcode,
        destination_postcode=request.destination_postcode,
        property_type=request.property_type,
        bedrooms=request.bedrooms,
        floor_level=request.floor_level,
        has_lift=request.has_lift,
        items_json=items_json_str,
        preferred_date=preferred_dt,
        status="QUOTED"
    )
    session.add(enquiry)
    session.commit()
    session.refresh(enquiry)

    quote = Quote(
        enquiry_id=enquiry.id,
        estimated_volume_m3=calc.estimated_volume_m3,
        estimated_duration_hours=calc.estimated_duration_hours,
        recommended_vehicle=calc.recommended_vehicle,
        movers_required=calc.movers_required,
        labour_cost=calc.labour_cost,
        vehicle_cost=calc.vehicle_cost,
        travel_cost=calc.travel_cost,
        access_surcharge=calc.access_surcharge,
        subtotal=calc.subtotal,
        vat=calc.vat,
        total_price=calc.total_price,
        status="ISSUED",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    session.add(quote)
    session.commit()
    session.refresh(quote)

    return CreateEnquiryResponse(
        enquiry_id=enquiry.id,
        quote_id=quote.id,
        total_price=quote.total_price,
        recommended_vehicle=quote.recommended_vehicle,
        movers_required=quote.movers_required,
        estimated_duration_hours=quote.estimated_duration_hours
    )