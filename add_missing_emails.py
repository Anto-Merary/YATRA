import requests
import os
import sys
import uuid
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.")
    sys.exit(1)

# The 8 missing emails identified
# Format: (Original Email in Excel, Name, College, Corrected Email if needed)
MISSING_USERS = [
    ("manoj.s.2023.mech@ritchennai.edu.in", "Manoj S", "RIT", None),
    ("chinmayi.250015@cce.ritchennnai.edu.in", "Chinmayi B", "RIT", "chinmayi.250015@cce.ritchennai.edu.in"), # TYPO FIX
    ("jagadheswar.250038@cce.ritchennai.edu.in", "Jagadheswar S R", "RIT", None),
    ("rakesh.240119@ece.ritchennai.edu.in", "RakeshN", "RIT", None),
    ("hari.240123@cse.ritchennai.edu.in", "S HARI SHANKAR", "RIT", None),
    ("aditya.c.d.2023.exe@ritchennai.edu.in", "Aditya Cd", "RIT", None),
    ("supritha.250039@bt.ritchennai.edu.in", "SUPRITHA S", "RIT", None),
    ("nandakishore.s.2023.csbs@ritchennai.edu.in", "Nanda Kishore S", "RIT", None)
]

def add_users():
    url = f"{SUPABASE_URL}/rest/v1/registrations"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    print(f"Adding {len(MISSING_USERS)} missing users to Supabase...")
    
    users_to_insert = []
    
    for original_email, name, college, corrected_email in MISSING_USERS:
        final_email = corrected_email if corrected_email else original_email
        print(f"Preparing: {final_email} ({name})")
        
        users_to_insert.append({
            "name": name,
            "email": final_email,
            "college": college,
            "payment_status": "paid",
            "payment_utr": f"MANUAL-FIX-{uuid.uuid4().hex[:8].upper()}",
            "price": "0",
            "phone": "", # Phone not available in the missing report summary, leaving blank
            "is_rit_student": True # All seemed to be RIT
        })

    try:
        r = requests.post(url, headers=headers, json=users_to_insert)
        if r.status_code in [200, 201]:
            data = r.json()
            print(f"SUCCESS: Inserted {len(data)} users.")
            for user in data:
                print(f"  - {user['email']} (ID: {user['id']})")
        else:
            print(f"FAILED: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    add_users()
