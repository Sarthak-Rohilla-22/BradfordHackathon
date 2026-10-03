
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="YorkMove API",
    description="AI-powered removals operations platform",
    version="0.1.0",
)


class MoveRequest(BaseModel):
    origin: str
    destination: str
    property_type: str
    bedrooms: int
    preferred_date: str


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "YorkMove API",
    }


@app.post("/api/moves")
def create_move(move: MoveRequest):
    return {
        "message": "Move request received",
        "move": move.model_dump(),
        "status": "ENQUIRY_RECEIVED",
    }