from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime, ForeignKey
import datetime

DATABASE_URL = "sqlite+aiosqlite:///./kisaan_ai.db"

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

# Base class for SQLAlchemy declarative models
class Base(AsyncAttrs, DeclarativeBase):
    pass

class FarmerProfile(Base):
    __tablename__ = "farmers"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_crop: Mapped[str] = mapped_column(String(50), nullable=False)

class DiagnosisHistory(Base):
    __tablename__ = "diagnosis_history"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"))
    timestamp: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    crop_image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    ai_diagnosis: Mapped[str] = mapped_column(String(2000), nullable=True)
    weather_at_time: Mapped[str] = mapped_column(String(500), nullable=True)

# Dependency injection generator for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    # Initialize the tables (creates them if they don't exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Hardcode seed our first user for easy Hackathon testing!
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(FarmerProfile).where(FarmerProfile.id == 1))
        farmer = result.scalars().first()
        if not farmer:
            dummy_farmer = FarmerProfile(id=1, name="Ramesh", location="New Delhi", primary_crop="Tomato")
            session.add(dummy_farmer)
            await session.commit()
