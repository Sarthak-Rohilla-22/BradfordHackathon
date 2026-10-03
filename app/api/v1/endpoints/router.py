from fastapi import APIRouter
from app.api.v1.endpoints.booking import router as booking_router
from app.api.v1.endpoints.enquiry import router as enquiry_router

api_router = APIRouter()

api_router.include_router(enquiry_router, prefix="/enquiry", tags=["Enquiry"])
api_router.include_router(booking_router, prefix="/booking", tags=["Booking"])