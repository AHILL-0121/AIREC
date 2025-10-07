"""
Gemini Model Utility Test Script

This script helps diagnose issues with Gemini API integration:
1. Lists all available models with your API key
2. Tests text generation with the first available model
3. Shows detailed model capabilities and metadata
"""

import os
import sys
from pathlib import Path
from pprint import pprint
import json

# Add parent directory to path to access utils
sys.path.append(str(Path(__file__).parent.parent))
from utils.logger import setup_logger

# Set up logging
logger = setup_logger("gemini_models")

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

logger.info("Testing Gemini API models and capabilities...")

# Get API key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    sys.exit(1)

try:
    import google.generativeai as genai
    
    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Get all available models
    logger.info("Listing available models...")
    models = genai.list_models()
    
    # Show model names
    logger.info(f"Found {len(models)} models:")
    for i, model in enumerate(models):
        logger.info(f"  {i+1}. {model.name}")
    
    # Get text models
    text_models = [m for m in models if "generateContent" in m.supported_generation_methods]
    logger.info(f"\nFound {len(text_models)} models supporting text generation:")
    
    if text_models:
        # Get the first text model
        model = text_models[0]
        model_name = model.name.split("/")[-1]
        
        # Show detailed info for the first text model
        logger.info(f"\nDetails for model {model_name}:")
        logger.info(f"  Display name: {model.display_name}")
        logger.info(f"  Description: {model.description}")
        logger.info(f"  Generation methods: {model.supported_generation_methods}")
        logger.info(f"  Input token limit: {model.input_token_limit}")
        logger.info(f"  Output token limit: {model.output_token_limit}")
        
        # Try a sample prompt
        logger.info(f"\nTesting text generation with model {model_name}...")
        gen_model = genai.GenerativeModel(model_name)
        
        prompt = """Extract information from this sample resume snippet:
        
        John Doe
        Software Engineer
        
        Experience:
        - Senior Developer at Tech Corp (2020-2023)
        - Junior Developer at Startup Inc (2018-2020)
        
        Education:
        - B.S. Computer Science, University of Technology (2018)
        
        Skills: Python, JavaScript, React, Docker
        
        Return this data in JSON format only.
        """
        
        response = gen_model.generate_content(prompt)
        logger.info(f"\nSample response:\n{response.text}")
        
        # Check if response is valid JSON
        try:
            json_response = json.loads(response.text)
            logger.info("\nResponse is valid JSON!")
        except json.JSONDecodeError:
            logger.info("\nResponse is not valid JSON")
        
        logger.info("\nModel test completed successfully!")
    else:
        logger.error("No text generation models available with your API key")
        
except ImportError as e:
    logger.error(f"Failed to import google.generativeai: {e}")
    logger.error("Please install the package with: pip install google-generativeai")
    
except Exception as e:
    logger.error(f"Error testing Gemini API models: {e}")

print("\nTest completed. Check logs for details.")