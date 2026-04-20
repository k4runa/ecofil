import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure project root is in path
sys.path.append(os.getcwd())

load_dotenv()

from sqlalchemy import text
from services.database import init_database

async def add_social_link_column():
    print("🚀 Initializing database connection...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not found in .env")
        return
    
    # Initialize the global engine and session maker
    init_database(db_url)
    
    from services.database import _session_maker
    
    print("🚀 Adding 'social_link' column to 'users' table...")
    async with _session_maker() as session:
        try:
            # Check if column exists first (PostgreSQL syntax)
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='social_link';
            """)
            result = await session.execute(check_sql)
            exists = result.scalar()
            
            if exists:
                print("✅ Column 'social_link' already exists.")
                return

            # Add the column
            add_sql = text("ALTER TABLE users ADD COLUMN social_link VARCHAR(255);")
            await session.execute(add_sql)
            await session.commit()
            print("✨ Successfully added 'social_link' column.")
        except Exception as e:
            print(f"❌ Error adding column: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(add_social_link_column())
