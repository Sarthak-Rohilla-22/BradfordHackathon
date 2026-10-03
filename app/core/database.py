import os
from sqlmodel import Session, SQLModel, create_engine

# Replace with your actual Supabase URI string or set DATABASE_URL environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:[bradford_hackathon]@db.dbpmxffqzrjgtkmwgdwm.supabase.co:5432/postgres",
)

engine = create_engine(DATABASE_URL, echo=True)


def init_db():
  # Creates tables on Supabase if they don't exist
  SQLModel.metadata.create_all(engine)


def get_session():
  with Session(engine) as session:
    yield session