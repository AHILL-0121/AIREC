"""
Environment variable utilities for the AI Job Matching Platform.
"""

import os
import re
from dotenv import load_dotenv
from pathlib import Path
from utils.logger import get_logger

# Get logger
logger = get_logger("env_utils")

# Root directory of the project
ROOT_DIR = Path(__file__).parent.parent

def load_environment_variables():
    """
    Load environment variables from .env file if exists.
    """
    env_path = ROOT_DIR / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"Loaded environment variables from {env_path}")
    else:
        logger.warning(f"No .env file found at {env_path}")

def get_api_key(key_name="GEMINI_API_KEY"):
    """
    Get API key from environment variables. Optionally validate format.
    """
    api_key = os.environ.get(key_name)
    
    if not api_key:
        logger.warning(f"{key_name} not found in environment variables")
        return None
    
    # Basic validation
    if len(api_key) < 8:  # Most API keys are longer than this
        logger.warning(f"{key_name} appears to be too short")
    
    # Detect API key type
    if key_name == "GEMINI_API_KEY":
        if api_key.startswith("sk-or-"):
            logger.info("Detected OpenRouter API key format")
        elif api_key.startswith("AIza"):
            logger.info("Detected Google API key format")
        else:
            logger.info("Unknown API key format")
    
    return api_key

def is_openrouter_key(api_key):
    """Check if the API key is an OpenRouter key (starts with sk-or-)"""
    return api_key and api_key.startswith('sk-or-')