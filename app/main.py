from app.api.v1.endpoints.router import api_router
from app.core.database import init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="YorkMove API",
    description="AI-powered removals operations platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
  init_db()


@app.get("/health", include_in_schema=False)
def health_check():
  return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")