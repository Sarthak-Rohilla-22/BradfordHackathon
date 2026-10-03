from fastapi import FastAPI
from app.core.database import create_db_and_tables
from app.api.v1.router import api_router

app = FastAPI(title="YorkMove API")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(api_router, prefix="/api/v1")