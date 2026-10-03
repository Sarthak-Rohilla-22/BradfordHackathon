from fastapi import APIRouter
from app.api.v1.endpoints import booking

api_router = APIRouter()

api_router.include_router(booking.router, prefix="/booking", tags=["Booking"])