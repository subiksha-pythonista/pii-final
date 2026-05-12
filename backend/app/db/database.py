"""
Async SQLite database setup
"""
from __future__ import annotations
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.models import Base
from app.utils.logger import get_logger

logger = get_logger(__name__)

DATABASE_URL = "sqlite+aiosqlite:///./pii_system.db"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized — tables created.")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session