from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean, Float
import datetime

DATABASE_URL = "sqlite+aiosqlite:///./kisaan_ai.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

class Base(AsyncAttrs, DeclarativeBase):
    pass

class User(Base):
    """Auth table — stores hashed passwords for JWT login."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), nullable=True)

class FarmerProfile(Base):
    __tablename__ = "farmers"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_crop: Mapped[str] = mapped_column(String(50), nullable=False)
    latitude: Mapped[float] = mapped_column(nullable=True)
    longitude: Mapped[float] = mapped_column(nullable=True)
    fcm_token: Mapped[str] = mapped_column(String(255), nullable=True) # Added for Push Notifications

class DiagnosisHistory(Base):
    __tablename__ = "diagnosis_history"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"))
    timestamp: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    crop_image_url: Mapped[str] = mapped_column(String(255), nullable=True)
    ai_diagnosis: Mapped[str] = mapped_column(String(2000), nullable=True)
    weather_at_time: Mapped[str] = mapped_column(String(500), nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"))
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"))
    started_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id"))
    role: Mapped[str] = mapped_column(String(20), nullable=False) # 'user' or 'model'
    content: Mapped[str] = mapped_column(String(2000), nullable=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)

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
            # We seed Ramesh with a dummy FCM token so the proactive loop targets him
            dummy_farmer = FarmerProfile(
                id=1, 
                name="Ramesh", 
                location="New Delhi", 
                primary_crop="Tomato", 
                latitude=28.6139, 
                longitude=77.2090, 
                fcm_token="dummy_device_token_123"
            )
            session.add(dummy_farmer)
            await session.commit()
