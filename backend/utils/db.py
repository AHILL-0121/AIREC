from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'job_matching_db')

def get_database():
    """Get MongoDB database instance"""
    return client[db_name]

def get_client():
    """Get MongoDB client instance"""
    return client
