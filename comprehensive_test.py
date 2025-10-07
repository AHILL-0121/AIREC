import requests
import json
import os

# Test the resume upload endpoint
url = "http://localhost:8000/api/resume/upload"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MGQ0ZjRlYy1lMGYyLTRjNDktOGJmZS1jMThkMWU2OTVlOTIiLCJyb2xlIjoiY2FuZGlkYXRlIiwiZXhwIjoxNzYwNDI3OTA5fQ.lFdjuKrVyXTOq9B8kPlJTxLZu-xevYbLNqx3TrPfQkU"
}

print("Testing Resume Upload Endpoint")
print("=" * 50)

# Test 1: No file
print("Test 1: No file provided")
try:
    response = requests.post(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
print()

# Test 2: Empty file
print("Test 2: Empty file")
try:
    files = {'file': ('', '', 'application/pdf')}
    response = requests.post(url, headers=headers, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
print()

# Test 3: Non-PDF file
print("Test 3: Non-PDF file")
try:
    files = {'file': ('test.txt', 'This is a text file', 'text/plain')}
    response = requests.post(url, headers=headers, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
print()

# Test 4: Valid PDF file
print("Test 4: Valid PDF file")
test_pdf = "test_resume.pdf"
if os.path.exists(test_pdf):
    try:
        with open(test_pdf, 'rb') as f:
            files = {'file': (test_pdf, f, 'application/pdf')}
            response = requests.post(url, headers=headers, files=files)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}...")  # Truncate long responses
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Test PDF not found: {test_pdf}")
print()

# Test 5: Test with .PDF extension (uppercase)
print("Test 5: PDF with uppercase extension")
if os.path.exists(test_pdf):
    try:
        with open(test_pdf, 'rb') as f:
            files = {'file': ('TEST_RESUME.PDF', f, 'application/pdf')}
            response = requests.post(url, headers=headers, files=files)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Test PDF not found: {test_pdf}")
print()

print("Testing complete!")