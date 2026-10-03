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

HOURLY_LABOUR_PER_MOVER = 25.0
MILEAGE_RATE = 1.50
STAIR_SURCHARGE_PER_FLOOR = 20.0

VEHICLE_CONFIGS = {
    "Transit Van": {"max_m3": 10.0, "base_fee": 45.0},
    "Luton Van": {"max_m3": 22.0, "base_fee": 75.0},
    "7.5t Lorry": {"max_m3": 40.0, "base_fee": 130.0}
}

def calculate_quote(
    volume_m3: float,
    distance_miles: float,
    floor_level: int,
    has_lift: bool,
    buffer_minutes: int = 0
) -> CalculatedQuote:
    base_hours = max(2.0, volume_m3 / 4.0)
    stair_delay = 0.0 if (has_lift or floor_level <= 0) else (floor_level * 0.5)
    total_duration = round(base_hours + stair_delay + (buffer_minutes / 60.0), 1)

    if volume_m3 <= VEHICLE_CONFIGS["Transit Van"]["max_m3"]:
        recommended_vehicle = "Transit Van"
    elif volume_m3 <= VEHICLE_CONFIGS["Luton Van"]["max_m3"]:
        recommended_vehicle = "Luton Van"
    else:
        recommended_vehicle = "7.5t Lorry"
    
    vehicle_cost = VEHICLE_CONFIGS[recommended_vehicle]["base_fee"]

    if volume_m3 <= 12 and floor_level <= 1:
        movers_required = 2
    elif volume_m3 <= 25:
        movers_required = 3 if (floor_level > 1 and not has_lift) else 2
    else:
        movers_required = 4

    labour_cost = round(total_duration * movers_required * HOURLY_LABOUR_PER_MOVER, 2)
    travel_cost = round(distance_miles * MILEAGE_RATE, 2)
    access_surcharge = 0.0 if (has_lift or floor_level <= 0) else round(floor_level * STAIR_SURCHARGE_PER_FLOOR, 2)

    subtotal = round(labour_cost + vehicle_cost + travel_cost + access_surcharge, 2)
    vat = round(subtotal * 0.20, 2)
    total_price = round(subtotal + vat, 2)

    return CalculatedQuote(
        estimated_volume_m3=volume_m3,
        estimated_duration_hours=total_duration,
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