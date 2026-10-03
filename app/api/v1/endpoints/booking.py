from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session
from app.core.database import get_session
from app.models.db_models import Booking, Quote

router = APIRouter()


class BookingRequest(BaseModel):
    quote_id: int
    scheduled_date: date
    selected_time_slot: str


class BookingResponse(BaseModel):
    booking_id: int
    status: str
    scheduled_date: date
    selected_time_slot: str


@router.post("/confirm", response_model=BookingResponse)
def confirm_booking(request: BookingRequest, session: Session = Depends(get_session)):
    quote = session.get(Quote, request.quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    booking = Booking(
        quote_id=quote.id,
        scheduled_date=request.scheduled_date,
        selected_time_slot=request.selected_time_slot,
        status="CONFIRMED",
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)

    return BookingResponse(
        booking_id=booking.id,
        status=booking.status,
        scheduled_date=booking.scheduled_date,
        selected_time_slot=booking.selected_time_slot,
    )