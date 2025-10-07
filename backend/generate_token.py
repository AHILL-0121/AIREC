"""
Quick API Test - Generate token and test endpoint
"""

from utils.auth import create_access_token

# Sarah's user ID from diagnostic
sarah_id = "f7035a19-a6af-42d6-900e-5d33668caaf1"

# Create token for Sarah
token = create_access_token(data={"sub": sarah_id, "role": "recruiter"})
print("Generated token for Sarah Johnson:")
print(f"Bearer {token}")
print("\nTest command:")
print(f'curl -H "Authorization: Bearer {token}" http://localhost:8000/api/jobs/recruiter/my-jobs')