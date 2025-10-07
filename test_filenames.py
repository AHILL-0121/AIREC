import requests
import os

url = "http://localhost:8000/api/resume/upload"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MGQ0ZjRlYy1lMGYyLTRjNDktOGJmZS1jMThkMWU2OTVlOTIiLCJyb2xlIjoiY2FuZGlkYXRlIiwiZXhwIjoxNzYwNDI3OTA5fQ.lFdjuKrVyXTOq9B8kPlJTxLZu-xevYbLNqx3TrPfQkU"
}

test_pdf = "test_resume.pdf"
if os.path.exists(test_pdf):
    print("Testing different filename formats:")
    
    filenames_to_test = [
        "test.pdf",
        "test.PDF", 
        "TEST.PDF",
        "resume.pdf",
        "resume.PDF",
        "document.Pdf"
    ]
    
    for filename in filenames_to_test:
        print(f"\nTesting filename: {filename}")
        try:
            with open(test_pdf, 'rb') as f:
                files = {'file': (filename, f, 'application/pdf')}
                response = requests.post(url, headers=headers, files=files)
                print(f"Status: {response.status_code}")
                if response.status_code != 200:
                    print(f"Error: {response.text}")
                else:
                    print("Success!")
        except Exception as e:
            print(f"Exception: {e}")
else:
    print("Test PDF not found")