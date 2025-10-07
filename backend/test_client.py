import asyncio
import httpx
import os

API = "http://localhost:8000/api"

async def run_tests():
    async with httpx.AsyncClient() as client:
        # Health check
        r = await client.get(f"{API}/")
        print('Health:', r.status_code, r.json())

if __name__ == '__main__':
    asyncio.run(run_tests())
