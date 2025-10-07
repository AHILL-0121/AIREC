import requests
import json

# Test the resume upload endpoint
url = "http://localhost:8000/api/resume/upload"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MGQ0ZjRlYy1lMGYyLTRjNDktOGJmZS1jMThkMWU2OTVlOTIiLCJyb2xlIjoiY2FuZGlkYXRlIiwiZXhwIjoxNzYwNDI3OTA5fQ.lFdjuKrVyXTOq9B8kPlJTxLZu-xevYbLNqx3TrPfQkU"
}

# Try with a test file
try:
    # First, let's see if we can hit the endpoint without a file
    response = requests.post(url, headers=headers)
    print(f"Response status: {response.status_code}")
    print(f"Response text: {response.text}")
    print(f"Response headers: {response.headers}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*50 + "\n")

# Try with an empty file parameter
try:
    files = {'file': ('', '', 'application/pdf')}
    response = requests.post(url, headers=headers, files=files)
    print(f"Response status (empty file): {response.status_code}")
    print(f"Response text: {response.text}")
except Exception as e:
    print(f"Error with empty file: {e}")

print("\n" + "="*50 + "\n")

# Check if any PDF files exist in uploads directory to test with
import os
uploads_dir = "backend/uploads"
if os.path.exists(uploads_dir):
    pdf_files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]
    print(f"Found PDF files: {pdf_files}")
    
    if pdf_files:
        test_file = os.path.join(uploads_dir, pdf_files[0])
        print(f"Testing with file: {test_file}")
        
        try:
            with open(test_file, 'rb') as f:
                files = {'file': (pdf_files[0], f, 'application/pdf')}
                response = requests.post(url, headers=headers, files=files)
                print(f"Response status (with PDF): {response.status_code}")
                print(f"Response text: {response.text}")
        except Exception as e:
            print(f"Error with PDF file: {e}")
else:
    print(f"Uploads directory not found: {uploads_dir}")

print("\n" + "="*50 + "\n")

# Also test with a non-PDF file to verify our validation
try:
    files = {'file': ('test.txt', 'hello world', 'text/plain')}
    response = requests.post(url, headers=headers, files=files)
    print(f"Response status (non-PDF): {response.status_code}")
    print(f"Response text: {response.text}")
except Exception as e:
    print(f"Error with non-PDF file: {e}")