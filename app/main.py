from fastapi import FastAPI
from app.api.v1.endpoints.router import api_router
from app.core.database import get_session
from app.core.test_database import init_test_db, get_test_session

app = FastAPI(title="YorkMove API")

# Route database requests to local SQLite test_database
app.dependency_overrides[get_session] = get_test_session

@app.on_event("startup")
def on_startup():
    init_test_db()

app.include_router(api_router, prefix="/api/v1")