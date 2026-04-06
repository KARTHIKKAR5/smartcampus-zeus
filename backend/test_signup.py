from fastapi.testclient import TestClient
from main import app
import traceback

client = TestClient(app)

try:
    print("Sending POST /auth/signup...")
    response = client.post(
        "/auth/signup",
        json={
            "email": "test-direct@sruniversity.edu",
            "password": "FakePassword123!",
            "name": "Test User",
            "role": "student",
            "phone": "9999999999",
            "location": "block_a"
        }
    )
    print("Status code:", response.status_code)
    print("Response data:", response.json())
except Exception as e:
    print("ERROR CAUGHT:")
    traceback.print_exc()
