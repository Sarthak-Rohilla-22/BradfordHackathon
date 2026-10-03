from app.models.db_models import Crew, Vehicle
from sqlmodel import Session, SQLModel, create_engine, select

sqlite_url = "sqlite:///./test.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})


def seed_test_data(session: Session):
  if not session.exec(select(Vehicle)).first():
    v1 = Vehicle(name="Transit Van 01", capacity_m3=18.0, base_rate=95.0)
    v2 = Vehicle(name="7.5t Box Truck", capacity_m3=35.0, base_rate=180.0)
    session.add_all([v1, v2])
    session.commit()

  if not session.exec(select(Crew)).first():
    c1 = Crew(name="Lead Driver", role="Driver", hourly_rate=25.0)
    c2 = Crew(name="Assistant Mover", role="Mover", hourly_rate=20.0)
    session.add_all([c1, c2])
    session.commit()


def init_test_db():
  SQLModel.metadata.create_all(engine)
  with Session(engine) as session:
    seed_test_data(session)


def get_test_session():
  with Session(engine) as session:
    yield session