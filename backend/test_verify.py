import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def check_endpoint(path):
    try:
        res = requests.get(f"{BASE_URL}{path}")
        print(f"\n--- GET {path} ---")
        print(json.dumps(res.json(), indent=2))
    except Exception as e:
        print(f"Error {path}: {e}")

check_endpoint("/dashboard/stats")
check_endpoint("/search?q=realtime")
