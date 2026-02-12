
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

url = f"{supabase_url}/rest/v1/registrations"
headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
    "Prefer": "count=exact"
}

# 1. Total Count
print(f"Checking total count...")
try:
    # head=true to just get headers (and count) without body
    response = requests.get(url, headers=headers, params={"select": "id", "limit": 1})
    print(f"Status: {response.status_code}")
    content_range = response.headers.get("Content-Range")
    print(f"Content-Range: {content_range}")
    if content_range:
        total = content_range.split('/')[-1]
        print(f"Total Registrations: {total}")
    else:
        print("No Content-Range header found.")
        print("Body:", response.text)
except Exception as e:
    print(f"Error: {e}")

# 2. Check for a specific RIT email
test_email = "rit.student@example.com" # Placeholder, I should use a real one
# I'll pick one from previous output if I had one, but I don't.
# I'll just search for *any* email containing 'rit'
print(f"\nSearching for emails containing 'rit'...")
try:
    params = {
        "email": "ilike.%rit%",
        "select": "email,payment_status",
        "limit": 5
    }
    response = requests.get(url, headers=headers, params=params)
    print(f"Status: {response.status_code}")
    print("Body:", response.json())
except Exception as e:
    print(f"Error: {e}")
