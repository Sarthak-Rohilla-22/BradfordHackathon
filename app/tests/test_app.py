import io
import json
import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core.database import get_session
from app.main import app
from app.services.Orchestrator import process_moving_pipeline
from app.services.quote_engine import calculate_quote


class AppBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SQLModel.metadata.create_all(cls.engine)

        def get_test_session():
            with Session(cls.engine) as session:
                yield session

        app.dependency_overrides[get_session] = get_test_session
        cls.startup_patch = patch("app.main.init_db")
        cls.startup_patch.start()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        cls.client.close()
        cls.startup_patch.stop()
        SQLModel.metadata.drop_all(cls.engine)
        cls.engine.dispose()

    def setUp(self):
        SQLModel.metadata.drop_all(self.engine)
        SQLModel.metadata.create_all(self.engine)

    def test_prompt_pipeline_applies_memory_buffer(self):
        result = process_moving_pipeline("Move my belongings from BD1 to LS1")
        self.assertEqual(result.calculated_quote.estimated_duration_hours, 2.9)

    def test_quote_buffer_increases_duration_and_labour_cost(self):
        baseline = calculate_quote(volume_m3=10, distance_miles=25)
        buffered = calculate_quote(volume_m3=10, distance_miles=25, buffer_minutes=30)
        self.assertEqual(buffered.estimated_duration_hours, baseline.estimated_duration_hours + 0.5)
        self.assertGreater(buffered.labour_cost, baseline.labour_cost)

    def test_frontend_prompt_field_is_accepted(self):
        response = self.client.post(
            "/api/v1/enquiry/parse-prompt",
            json={"prompt": "Move my belongings from BD1 to LS1"},
        )
        self.assertEqual(response.status_code, 200, response.text)

    def test_frontend_enquiry_payload_creates_quote(self):
        response = self.client.post(
            "/api/v1/enquiry/create",
            json={
                "customer_name": "Test Customer",
                "customer_email": "test@example.com",
                "customer_phone": "07700900000",
                "origin_postcode": "BD1 1AA",
                "destination_postcode": "LS1 1AA",
                "property_type": "House",
                "bedrooms": 2,
                "floor_level": 0,
                "has_lift": False,
                "items_json": "[]",
                "preferred_date": "2026-10-15",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertGreater(response.json()["quote_id"], 0)

        booking_response = self.client.post(
            "/api/v1/booking/confirm",
            json={
                "quote_id": response.json()["quote_id"],
                "scheduled_date": "2026-10-15",
                "selected_time_slot": "AM",
            },
        )
        self.assertEqual(booking_response.status_code, 200, booking_response.text)
        self.assertEqual(booking_response.json()["scheduled_date"], "2026-10-15")

    def test_invalid_booking_date_returns_validation_error(self):
        response = self.client.post(
            "/api/v1/booking/confirm",
            json={
                "quote_id": 1,
                "scheduled_date": "not-a-date",
                "selected_time_slot": "AM",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_photo_analysis_reports_missing_backend_key(self):
        with patch.dict(
            os.environ,
            {"GEMINI_API_KEY": "", "GOOGLE_API_KEY": "", "GEMMA_API_KEY": ""},
        ):
            response = self.client.post(
                "/api/v1/enquiry/analyse-photos",
                json={"photos": [{"mime_type": "image/jpeg", "data": "aGVsbG8="}]},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("GEMINI_API_KEY", response.json()["detail"])

    def test_photo_analysis_calls_gemini_and_validates_detections(self):
        provider_response = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        "items": [
                                            {
                                                "name": "3-seat sofa",
                                                "quantity": 1,
                                                "room": "Living room",
                                                "estimated_volume_m3": 1.8,
                                                "confidence": 0.96,
                                            }
                                        ]
                                    }
                                )
                            }
                        ]
                    }
                }
            ]
        }
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch(
                "app.api.v1.endpoints.enquiry.urlopen",
                return_value=io.BytesIO(json.dumps(provider_response).encode()),
            ) as provider,
        ):
            response = self.client.post(
                "/api/v1/enquiry/analyse-photos",
                json={
                    "photos": [{"mime_type": "image/jpeg", "data": "aGVsbG8="}],
                    "catalogue_items": ["3-seat sofa"],
                },
            )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["items"][0]["name"], "3-seat sofa")
        self.assertEqual(
            provider.call_args.args[0].get_header("X-goog-api-key"),
            "test-key",
        )


if __name__ == "__main__":
    unittest.main()
