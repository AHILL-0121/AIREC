"""
Enhanced Gemini API Test Script with detailed model inspection
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to access utils
sys.path.append(str(Path(__file__).parent.parent))
from utils.logger import setup_logger

# Set up logging
logger = setup_logger("gemini_test_detailed")

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

logger.info("Testing Gemini API with detailed model inspection...")

# Get API key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    sys.exit(1)

logger.info(f"GEMINI_API_KEY found: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    
    logger.info("Successfully imported google.generativeai")
    
    # Check the library version
    logger.info(f"google-generativeai version: {genai.__version__}")
    
    # Configure Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Configured Gemini with API key")
    
    # Get all available models
    logger.info("Listing available models...")
    models = genai.list_models()
    
    if not models:
        logger.error("No models available with your API key")
        sys.exit(1)
    
    logger.info(f"Found {len(models)} models")
    
    # Check each model's capabilities in detail
    text_generation_models = []
    embedding_models = []
    other_models = []
    
    for model in models:
        model_id = model.name.split('/')[-1]
        
        # Check if this model supports any generation method
        if hasattr(model, 'supported_generation_methods') and model.supported_generation_methods:
            methods = model.supported_generation_methods
            if 'generateContent' in methods:
                text_generation_models.append((model_id, methods))
            elif 'embedContent' in methods:
                embedding_models.append((model_id, methods))
            else:
                other_models.append((model_id, methods))
        else:
            other_models.append((model_id, []))
    
    # Log results by category
    logger.info(f"\nText generation models ({len(text_generation_models)}):")
    for model_id, methods in text_generation_models:
        logger.info(f"  - {model_id}: {methods}")
    
    logger.info(f"\nEmbedding models ({len(embedding_models)}):")
    for model_id, methods in embedding_models:
        logger.info(f"  - {model_id}: {methods}")
    
    logger.info(f"\nOther models ({len(other_models)}):")
    for model_id, methods in other_models:
        logger.info(f"  - {model_id}: {methods}")
    
    # Try the first 3 models to see if any work
    test_models = [m[0] for m in text_generation_models[:3]] if text_generation_models else [
        'gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro'
    ]
    
    if not text_generation_models:
        # Let's try some common model names
        common_models = ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro', 
                         'gemini-flash', 'gemini-2.0-pro', 'gemini-2.0-flash',
                         'gemini-pro-latest', 'gemini-flash-latest']
        
        logger.info("\nNo text generation models found. Trying common model names:")
        for model_name in common_models:
            logger.info(f"  - Testing {model_name}")
            test_models.append(model_name)
    
    # Test each model
    for model_name in test_models:
        logger.info(f"\nTrying model: {model_name}")
        
        try:
            model = genai.GenerativeModel(model_name)
            
            # Set safety settings to be more permissive for testing
            safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            }
            
            response = model.generate_content(
                "Return only the text 'TEST_SUCCESS' without any other text.",
                safety_settings=safety_settings,
                generation_config={'temperature': 0}
            )
            
            logger.info(f"Response from {model_name}: {response.text[:100]}")
            if "TEST_SUCCESS" in response.text:
                logger.info(f"✅ SUCCESS! Model {model_name} works correctly")
                
                # Now test with a resume prompt
                logger.info(f"Testing resume parsing with {model_name}...")
                resume_prompt = """Extract skills from this resume text:
                John Doe
                Software Engineer with 5 years of experience in Python, JavaScript, and React.
                
                Return only a JSON array of skills: ["skill1", "skill2"]
                """
                
                resume_response = model.generate_content(
                    resume_prompt,
                    safety_settings=safety_settings,
                    generation_config={'temperature': 0}
                )
                
                logger.info(f"Resume parsing result: {resume_response.text[:200]}")
                break  # Found a working model!
            else:
                logger.warning(f"Model {model_name} didn't return expected output")
                
        except Exception as e:
            logger.error(f"Error testing model {model_name}: {e}")
    
except ImportError as e:
    logger.error(f"Failed to import google.generativeai: {e}")
    logger.error("Please install the package with: pip install google-generativeai")
    
except Exception as e:
    logger.error(f"Error testing Gemini API: {e}")

print("\nDetailed test completed. Check logs for results.")