from pydantic import BaseModel

class CalculatedQuote(BaseModel):
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

def calculate_quote(
    volume_m3: float,
    distance_miles: float,
    floor_level: int = 0,
    has_lift: bool = False,
    buffer_minutes: int = 0,
) -> CalculatedQuote:
    """
    Calculates cost, duration, vehicle, and crew requirements for removals.
    """
    # 1. Vehicle Selection & Crew Allocation
    if volume_m3 <= 8.0:
        recommended_vehicle = "Luton Van (Small)"
        movers_required = 1
        vehicle_base_rate = 60.0
    elif volume_m3 <= 18.0:
        recommended_vehicle = "3.5t Luton Van"
        movers_required = 2
        vehicle_base_rate = 95.0
    elif volume_m3 <= 35.0:
        recommended_vehicle = "7.5t Box Truck"
        movers_required = 3
        vehicle_base_rate = 180.0
    else:
        recommended_vehicle = "Multiple Luton Vans"
        movers_required = 4
        vehicle_base_rate = 260.0

    if buffer_minutes < 0:
        raise ValueError("buffer_minutes cannot be negative")

    # 2. Duration Estimation (Loading/Unloading + Driving + access buffer)
    # Estimate ~3.5 m3 per hour per mover + travel time at 25 mph average speed
    loading_hours = max(1.5, volume_m3 / (3.5 * movers_required))
    driving_hours = distance_miles / 25.0
    buffer_hours = buffer_minutes / 60.0
    estimated_duration_hours = round(loading_hours + driving_hours + buffer_hours, 1)

    # 3. Cost Breakdown
    hourly_rate_per_mover = 25.0
    labour_cost = round(movers_required * hourly_rate_per_mover * estimated_duration_hours, 2)
    vehicle_cost = round(vehicle_base_rate, 2)
    
    # Distance / Fuel charge: £1.20 per mile
    travel_cost = round(distance_miles * 1.20, 2)

    # Floor / Access Surcharges (No charge if lift is available or ground floor)
    access_surcharge = 0.0
    if floor_level > 0 and not has_lift:
        access_surcharge = round(floor_level * 25.0, 2)

    # 4. Totals & Tax Calculation
    subtotal = round(labour_cost + vehicle_cost + travel_cost + access_surcharge, 2)
    vat = round(subtotal * 0.20, 2)  # 20% VAT
    total_price = round(subtotal + vat, 2)

    return CalculatedQuote(
        estimated_volume_m3=round(volume_m3, 2),
        estimated_duration_hours=estimated_duration_hours,
        recommended_vehicle=recommended_vehicle,
        movers_required=movers_required,
        labour_cost=labour_cost,
        vehicle_cost=vehicle_cost,
        travel_cost=travel_cost,
        access_surcharge=access_surcharge,
        subtotal=subtotal,
        vat=vat,
        total_price=total_price
    )