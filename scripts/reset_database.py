import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure project root is in path
sys.path.append(os.getcwd())

load_dotenv()

from sqlalchemy import text
from services.database import init_database, Base

async def reset_database():
    print("⚠️  WARNING: This will DELETE all data and reset the database! ⚠️")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not found in .env")
        return
    
    # Initialize the global engine
    init_database(db_url)
    
    from services.database import _engine
    
    if not _engine:
        print("❌ Could not initialize engine.")
        return

    try:
        async with _engine.begin() as conn:
            print("🗑️  Dropping all tables...")
            # We use metadata to drop all tables defined in our models
            await conn.run_sync(Base.metadata.drop_all)
            print("🏗️  Creating all tables from scratch...")
            await conn.run_sync(Base.metadata.create_all)
            
        print("✨ Database reset successfully! All tables are up to date.")
    except Exception as e:
        print(f"❌ Error during reset: {e}")

if __name__ == "__main__":
    confirm = input("Are you absolutely sure? This will delete EVERYTHING. (y/n): ")
    if confirm.lower() == 'y':
        asyncio.run(reset_database())
    else:
        print("Aborted.")
