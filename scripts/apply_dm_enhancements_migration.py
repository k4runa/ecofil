
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def migrate():
    load_dotenv()
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found in .env")
        return
        
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    try:
        conn = await asyncpg.connect(url)
        print("Connected to database.")
        
        # Add columns to messages
        print("Migrating messages table...")
        try:
            await conn.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE")
            print("  - Added is_edited")
        except Exception as e:
            print(f"  - Error adding is_edited: {e}")
            
        try:
            await conn.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TEXT")
            print("  - Added edited_at")
        except Exception as e:
            print(f"  - Error adding edited_at: {e}")
        
        # Create conversations table
        print("Creating conversations table...")
        try:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    status TEXT DEFAULT 'PENDING',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    CONSTRAINT uq_user_pair UNIQUE (user1_id, user2_id)
                )
            """)
            print("  - Created conversations table")
        except Exception as e:
            print(f"  - Error creating conversations table: {e}")
            
        await conn.close()
        print("Migration complete.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
