import os
from app.models.db_models import Booking, Crew, Enquiry, Quote, Vehicle
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./yorkmove.db",
)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)


def init_db():
  SQLModel.metadata.create_all(engine)


def get_session():
  with Session(engine) as session:
    yield session