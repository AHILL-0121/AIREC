#!/usr/bin/env python3
"""
Most basic FastAPI test to check if it's a FastAPI issue
"""

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")  
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting basic FastAPI server on port 8003...")
    uvicorn.run(app, host="0.0.0.0", port=8003)