# services/gemma_vision.py
import google.genai as genai
from pydantic import BaseModel
from typing import List

class ImageInventoryDetection(BaseModel):
    room_type: str
    detected_items: List[InventoryItem]
    total_room_volume_m3: float
    confidence_score: float  # 0.0 to 1.0

def analyze_room_photo(image_bytes: bytes) -> ImageInventoryDetection:
    prompt = """
    Analyze this room photograph for a moving company assessment.
    1. Identify all furniture items, appliances, and visible boxes.
    2. Estimate average individual volume in cubic meters (m³) based on UK removals standards.
    3. Calculate total volume and assign an overall confidence score.
    Return ONLY JSON conforming to ImageInventoryDetection.
    """
    # Gemma 4 Multimodal call via Google GenAI SDK / LiteRT
    response = genai.Client().models.generate_content(
        model="gemma-4-31b",
        contents=[prompt, image_bytes],
        config={"response_mime_type": "application/json"}
    )
    return ImageInventoryDetection.model_validate_json(response.text)