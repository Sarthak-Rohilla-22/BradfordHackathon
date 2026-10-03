import asyncio
import base64
import binascii
from datetime import date, datetime, timedelta, timezone
import json
import os
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException
from pydantic import AliasChoices, BaseModel, Field, field_validator, model_validator
from typing import List
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
    items: List[MoveItemInput] = Field(default_factory=list)
    preferred_date: date
    distance_miles: float = 12.0

    @model_validator(mode="before")
    @classmethod
    def accept_items_json(cls, values):
        if isinstance(values, dict) and "items" not in values and "items_json" in values:
            try:
                items = json.loads(values["items_json"])
            except (TypeError, json.JSONDecodeError) as exc:
                raise ValueError("items_json must contain a JSON array") from exc
            return {**values, "items": items}
        return values

class CreateEnquiryResponse(BaseModel):
    enquiry_id: int
    quote_id: int
    total_price: float
    recommended_vehicle: str
    movers_required: int
    estimated_duration_hours: float

class PromptEnquiryRequest(BaseModel):
    user_prompt: str = Field(validation_alias=AliasChoices("user_prompt", "prompt"))
    distance_miles: float = 15.0

class PhotoForAnalysis(BaseModel):
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    data: str

    @field_validator("data")
    @classmethod
    def validate_image_data(cls, value: str) -> str:
        try:
            decoded = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ValueError("Photo data must be valid base64") from exc
        if not decoded or len(decoded) > 5 * 1024 * 1024:
            raise ValueError("Each photo must be between 1 byte and 5 MB")
        return value

class PhotoAnalysisRequest(BaseModel):
    photos: List[PhotoForAnalysis] = Field(min_length=1, max_length=12)
    catalogue_items: List[str] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_total_photo_size(self):
        if sum(len(photo.data) for photo in self.photos) > 16 * 1024 * 1024:
            raise ValueError("Combined photo data must be no larger than 16 MB")
        return self

class DetectedItem(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(ge=1, le=500)
    room: str = Field(min_length=1, max_length=80)
    estimated_volume_m3: float = Field(gt=0, le=100)
    confidence: float = Field(ge=0, le=1)

class PhotoAnalysisResponse(BaseModel):
    items: List[DetectedItem]

# --- Endpoints ---

def _analyse_photos_with_gemini(request: PhotoAnalysisRequest) -> PhotoAnalysisResponse:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMMA_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Photo recognition is not configured. Set GEMINI_API_KEY on the backend and restart it.",
        )

    catalogue = "\n".join(f"- {name}" for name in request.catalogue_items)
    prompt = (
        "Identify the distinct movable household objects visible in these room photos. "
        "Return only a JSON object with an 'items' array. Each item must contain "
        "'name' (use an exact matching catalogue name when appropriate, otherwise a concise "
        "specific name), 'quantity' (count visible instances, do not count the same object "
        "twice across photos), 'room', 'estimated_volume_m3' (rough volume for one item), "
        "and 'confidence' (0 to 1). Ignore people, decor fixed to the property, and objects "
        "that are too unclear to identify. Do not invent objects. The catalogue is:\n"
        f"{catalogue or '- No catalogue provided'}"
    )
    parts: list[dict[str, object]] = [{"text": prompt}]
    parts.extend(
        {
            "inline_data": {
                "mime_type": photo.mime_type,
                "data": photo.data,
            }
        }
        for photo in request.photos
    )
    payload = json.dumps(
        {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
            },
        }
    ).encode()
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    http_request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=payload,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urlopen(http_request, timeout=90) as response:
            provider_response = json.load(response)
    except HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini photo recognition failed (provider HTTP {exc.code}). Check the backend key, model access, and quota.",
        ) from exc
    except (URLError, TimeoutError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the Gemini photo-recognition service.",
        ) from exc
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Gemini returned an invalid response.") from exc

    try:
        text = provider_response["candidates"][0]["content"]["parts"][0]["text"]
        if text.startswith("```"):
            text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = PhotoAnalysisResponse.model_validate_json(text)
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Gemini returned an inventory in an unexpected format. Please retry the photo analysis.",
        ) from exc
    return result


@router.post("/analyse-photos", response_model=PhotoAnalysisResponse)
async def analyse_photos(request: PhotoAnalysisRequest):
    return await asyncio.to_thread(_analyse_photos_with_gemini, request)


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
        preferred_date=request.preferred_date,
        status="QUOTED"
    )
    session.add(enquiry)
    session.flush()

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
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    session.add(quote)
    session.commit()
    session.refresh(enquiry)
    session.refresh(quote)

    return CreateEnquiryResponse(
        enquiry_id=enquiry.id,
        quote_id=quote.id,
        total_price=quote.total_price,
        recommended_vehicle=quote.recommended_vehicle,
        movers_required=quote.movers_required,
        estimated_duration_hours=quote.estimated_duration_hours
    )