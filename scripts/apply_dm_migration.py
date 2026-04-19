
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
        
        # Add columns to users
        print("Migrating users table...")
        try:
            await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS dm_notifications BOOLEAN DEFAULT TRUE")
            print("  - Added dm_notifications")
        except Exception as e:
            print(f"  - Error adding dm_notifications: {e}")
            
        try:
            await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS muted_users TEXT")
            print("  - Added muted_users")
        except Exception as e:
            print(f"  - Error adding muted_users: {e}")
        
        # Add columns to messages
        print("Migrating messages table...")
        try:
            await conn.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'")
            print("  - Added message_type")
        except Exception as e:
            print(f"  - Error adding message_type: {e}")
            
        try:
            await conn.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT")
            print("  - Added attachment_url")
        except Exception as e:
            print(f"  - Error adding attachment_url: {e}")
            
        try:
            await conn.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE")
            print("  - Added deleted_by_sender")
        except Exception as e:
            print(f"  - Error adding deleted_by_sender: {e}")
            
        try:
            await conn.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE")
            print("  - Added deleted_by_receiver")
        except Exception as e:
            print(f"  - Error adding deleted_by_receiver: {e}")
        
        await conn.close()
        print("Migration complete.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
