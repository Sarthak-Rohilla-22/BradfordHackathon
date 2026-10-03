from dataclasses import dataclass

@dataclass
class QuoteBreakdown:
    labour_cost: float
    vehicle_cost: float
    travel_cost: float
    access_surcharge: float
    subtotal: float
    vat: float
    total_price: float

HOURLY_LABOUR_PER_MOVER = 25.0  # £/hr
VEHICLE_RATES = {
    "Transit Van": 45.0,
    "Luton Van": 75.0,
    "7.5t Lorry": 120.0
}
MILEAGE_RATE = 1.50  # £/mile

def calculate_quote(
    distance_miles: float,
    volume_m3: float,
    crew_size: int,
    stair_count: int,
    buffer_minutes: int = 0
) -> QuoteBreakdown:
    # 1. Estimate duration based on volume & stairs
    base_hours = max(2.0, volume_m3 / 4.0)  # ~4 m3 per hour loading/unloading
    stair_delay_hours = stair_count * 0.5
    total_duration_hours = base_hours + stair_delay_hours + (buffer_minutes / 60.0)

    # 2. Select vehicle
    if volume_m3 <= 10:
        vehicle = "Transit Van"
    elif volume_m3 <= 22:
        vehicle = "Luton Van"
    else:
        vehicle = "7.5t Lorry"

    # 3. Calculate components
    labour_cost = total_duration_hours * crew_size * HOURLY_LABOUR_PER_MOVER
    vehicle_cost = VEHICLE_RATES[vehicle]
    travel_cost = distance_miles * MILEAGE_RATE
    access_surcharge = 40.0 if stair_count > 1 else 0.0

    subtotal = labour_cost + vehicle_cost + travel_cost + access_surcharge
    vat = subtotal * 0.20
    total_price = subtotal + vat

    return QuoteBreakdown(
        labour_cost=round(labour_cost, 2),
        vehicle_cost=round(vehicle_cost, 2),
        travel_cost=round(travel_cost, 2),
        access_surcharge=round(access_surcharge, 2),
        subtotal=round(subtotal, 2),
        vat=round(vat, 2),
        total_price=round(total_price, 2)
    )