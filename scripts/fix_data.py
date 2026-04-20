import asyncio
import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from services.database import User, Base

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_data")

async def fix_missing_avatars():
    """
    Ensures all users have a valid avatar_url. 
    Fallback to DiceBear if none exists.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL environment variable not set.")
        return

    # Handle postgres:// vs postgresql+asyncpg://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        logger.info("Scanning for users with missing avatars...")
        stmt = select(User).where((User.avatar_url == None) | (User.avatar_url == ""))
        result = await session.execute(stmt)
        users = result.scalars().all()

        if not users:
            logger.info("No users found with missing avatars.")
            return

        logger.info(f"Found {len(users)} users needing avatar updates.")
        for user in users:
            # Using DiceBear avataaars as default
            dicebear_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}"
            user.avatar_url = dicebear_url
            logger.info(f"Updated user '{user.username}' with default DiceBear avatar.")

        try:
            await session.commit()
            logger.info("Successfully committed changes to database.")
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to commit changes: {str(e)}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_missing_avatars())
