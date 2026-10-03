from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from app.api.v1.endpoints.router import api_router
from app.core.database import init_db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI):
  init_db()
  yield


app = FastAPI(
    title="YorkMove API",
    description="AI-powered removals operations platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", include_in_schema=False)
def health_check():
  return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")