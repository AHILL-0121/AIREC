"""
Test script to verify Gemini API connectivity
Run this script to check if the Gemini API key is valid and if the API is accessible
"""

import os
import sys
import json
from pathlib import Path

# Add parent directory to path to access utils
sys.path.append(str(Path(__file__).parent.parent))
from utils.logger import setup_logger

# Set up logging
logger = setup_logger("gemini_test")

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

logger.info("Checking Gemini API connectivity...")

# Get API key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    sys.exit(1)

logger.info(f"GEMINI_API_KEY found: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")

try:
    import google.generativeai as genai
    logger.info("Successfully imported google.generativeai")

    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Configured Gemini with API key")
    
    # Get available models first to check what we have access to
    logger.info("Listing available models...")
    models = genai.list_models()
    model_names = [model.name for model in models]
    logger.info(f"Available models: {model_names}")
    
    # Find the first text generation model
    text_models = [m for m in models if "generateContent" in m.supported_generation_methods]
    
    if not text_models:
        logger.error("No text generation models available with your API key")
        sys.exit(1)
    
    # Use the first available text model
    model_name = text_models[0].name.split("/")[-1]  # Extract just the model name
    logger.info(f"Using model: {model_name}")
    
    # Try a simple request with the available model
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Say hello in JSON format")
    
    logger.info(f"Response received: {response.text[:100]}...")
    logger.info("Gemini API test successful!")
    
except ImportError as e:
    logger.error(f"Failed to import google.generativeai: {e}")
    logger.error("Please install the package with: pip install google-generativeai")
    
except Exception as e:
    logger.error(f"Error testing Gemini API: {e}")
    logger.error("Gemini API test failed")

print("\nTest completed. Check logs for details.")