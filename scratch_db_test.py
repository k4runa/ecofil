
import asyncio
import os
import sys
# Add current directory to path
sys.path.append(os.getcwd())

from services.deps import users_manager

async def main():
    print("Testing database connection...")
    try:
        # Initial admin from .env
        username = os.getenv("INITIAL_ADMIN_USERNAME", "galice")
        u = await users_manager.get_user_by_username(username)
        print(f"✅ Success! User found: {u['username']}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
