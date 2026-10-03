from sqlmodel import SQLModel, create_engine, Session, select
from app.models.db_models import Vehicle, Crew

sqlite_url = "sqlite:///./test.db"
test_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def seed_test_data(session: Session):
    # Auto-seed vehicles if table is empty
    if not session.exec(select(Vehicle)).first():
        vehicles = [
            Vehicle(name="Transit Van 01", license_plate="BD26 ABC", vehicle_type="Transit Van", volume_capacity_m3=10.0),
            Vehicle(name="Luton Van 01", license_plate="LS26 XYZ", vehicle_type="Luton Van", volume_capacity_m3=22.0),
            Vehicle(name="7.5t Lorry 01", license_plate="WY26 HJK", vehicle_type="7.5t Lorry", volume_capacity_m3=40.0),
        ]
        session.add_all(vehicles)

    # Auto-seed crew if table is empty
    if not session.exec(select(Crew)).first():
        crew_members = [
            Crew(name="Dave Smith", phone="07123456789", role="Lead Mover"),
            Crew(name="Steve Jones", phone="07987654321", role="Driver"),
            Crew(name="Jack Wilson", phone="07555555555", role="Mover"),
            Crew(name="Liam Brown", phone="07444444444", role="Mover"),
        ]
        session.add_all(crew_members)

    session.commit()

def init_test_db():
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        seed_test_data(session)

def get_test_session():
    with Session(test_engine) as session:
        yield session