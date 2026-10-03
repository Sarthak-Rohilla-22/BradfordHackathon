from datetime import date
from typing import List, Dict, Optional
from sqlmodel import Session, select
from app.models.db_models import Vehicle, Crew, Booking

STANDARD_SLOTS = ["09:00", "14:00"]

class AvailabilityResult:
    def __init__(self, is_available: bool, available_slots: List[str], assigned_vehicle: Optional[Vehicle], assigned_crew: List[Crew]):
        self.is_available = is_available
        self.available_slots = available_slots
        self.assigned_vehicle = assigned_vehicle
        self.assigned_crew = assigned_crew

def check_availability(
    session: Session,
    target_date: date,
    required_vehicle_type: str,
    required_movers: int
) -> AvailabilityResult:
    stmt_vehicles = select(Vehicle).where(
        Vehicle.vehicle_type == required_vehicle_type,
        Vehicle.is_active == True
    )
    eligible_vehicles = session.exec(stmt_vehicles).all()

    stmt_crew = select(Crew).where(Crew.is_active == True)
    all_crew = session.exec(stmt_crew).all()

    stmt_bookings = select(Booking).where(Booking.scheduled_date == target_date, Booking.status == "CONFIRMED")
    existing_bookings = session.exec(stmt_bookings).all()

    booked_vehicle_ids_by_slot: Dict[str, List[int]] = {slot: [] for slot in STANDARD_SLOTS}
    booked_crew_ids_by_slot: Dict[str, List[int]] = {slot: [] for slot in STANDARD_SLOTS}

    for b in existing_bookings:
        if b.start_time in booked_vehicle_ids_by_slot:
            booked_vehicle_ids_by_slot[b.start_time].append(b.vehicle_id)
            crew_ids = [int(cid) for cid in b.assigned_crew_ids.split(",") if cid.strip().isdigit()]
            booked_crew_ids_by_slot[b.start_time].extend(crew_ids)

    valid_slots = []
    selected_vehicle = None
    selected_crew: List[Crew] = []

    for slot in STANDARD_SLOTS:
        busy_vehicles = booked_vehicle_ids_by_slot[slot]
        free_vehicles = [v for v in eligible_vehicles if v.id not in busy_vehicles]

        busy_crew = booked_crew_ids_by_slot[slot]
        free_crew = [c for c in all_crew if c.id not in busy_crew]

        if free_vehicles and len(free_crew) >= required_movers:
            valid_slots.append(slot)
            if not selected_vehicle:
                selected_vehicle = free_vehicles[0]
                selected_crew = free_crew[:required_movers]

    return AvailabilityResult(
        is_available=len(valid_slots) > 0,
        available_slots=valid_slots,
        assigned_vehicle=selected_vehicle,
        assigned_crew=selected_crew
    )