from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session
from app.core.database import get_session
from app.models.db_models import Quote, Enquiry, Booking
from app.services.availability_engine import check_availability

router = APIRouter()

class BookingRequest(BaseModel):
    quote_id: int
    scheduled_date: str
    selected_time_slot: str

class BookingResponse(BaseModel):
    booking_id: int
    status: str
    scheduled_date: str
    start_time: str
    assigned_vehicle_id: int
    crew_count: int
    message: str

@router.post("/confirm", response_model=BookingResponse)
def confirm_booking(
    request: BookingRequest,
    session: Session = Depends(get_session)
):
    quote = session.get(Quote, request.quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    if quote.status == "ACCEPTED":
        raise HTTPException(status_code=400, detail="Quote has already been booked")

    enquiry = session.get(Enquiry, quote.enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Associated enquiry not found")

    try:
        booking_date = datetime.strptime(request.scheduled_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    availability = check_availability(
        session=session,
        target_date=booking_date,
        required_vehicle_type=quote.recommended_vehicle,
        required_movers=quote.movers_required
    )

    if not availability.is_available or request.selected_time_slot not in availability.available_slots:
        raise HTTPException(
            status_code=409,
            detail="The requested slot or required resources are no longer available on this date."
        )

    assigned_vehicle = availability.assigned_vehicle
    assigned_crew = availability.assigned_crew

    if not assigned_vehicle or len(assigned_crew) < quote.movers_required:
        raise HTTPException(status_code=500, detail="Failed to allocate vehicle or crew.")

    crew_id_str = ",".join(str(c.id) for c in assigned_crew)
    booking = Booking(
        quote_id=quote.id,
        enquiry_id=enquiry.id,
        scheduled_date=booking_date,
        start_time=request.selected_time_slot,
        end_time="14:00" if request.selected_time_slot == "09:00" else "19:00",
        vehicle_id=assigned_vehicle.id,
        crew_count=len(assigned_crew),
        assigned_crew_ids=crew_id_str,
        status="CONFIRMED"
    )

    session.add(booking)
    quote.status = "ACCEPTED"
    enquiry.status = "BOOKED"
    session.add(quote)
    session.add(enquiry)

    session.commit()
    session.refresh(booking)

    return BookingResponse(
        booking_id=booking.id,
        status=booking.status,
        scheduled_date=str(booking.scheduled_date),
        start_time=booking.start_time,
        assigned_vehicle_id=booking.vehicle_id,
        crew_count=booking.crew_count,
        message="Booking successfully confirmed and resources locked."
    )