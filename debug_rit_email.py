
import pandas as pd
import requests
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE = r"Yatra registered\College mail id till 11th feb 2026.xlsx"
STATUS_COLUMN = "Order Status"
COLLEGE_COLUMN = "College Name"
EMAIL_COLUMN = "Billing Email"
SUCCESS_STATUS = "Success"
TARGET_COLLEGE = "RIT"

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def check_email(email):
    url = f"{supabase_url}/rest/v1/registrations"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    params = {
        "email": f"eq.{email}",
        "select": "*"
    }
    
    print(f"Checking email: {email}")
    try:
        response = requests.get(url, headers=headers, params=params)
        print(f"Status: {response.status_code}")
        data = response.json()
        if data:
            print("Found in DB:")
            print(data[0])
        else:
            print("Not found in DB.")
    except Exception as e:
        print(f"Error: {e}")

try:
    df = pd.read_excel(INPUT_FILE)
    df.columns = [c.strip() for c in df.columns]
    
    # Filter for RIT
    df[STATUS_COLUMN] = df[STATUS_COLUMN].astype(str).str.strip()
    df[COLLEGE_COLUMN] = df[COLLEGE_COLUMN].astype(str).str.strip()
    
    rit_students = df[
        (df[STATUS_COLUMN].str.lower() == SUCCESS_STATUS.lower()) &
        (df[COLLEGE_COLUMN] == TARGET_COLLEGE)
    ]
    
    if not rit_students.empty:
        first_email = rit_students.iloc[0][EMAIL_COLUMN]
        print(f"First RIT email to check: {first_email}")
        check_email(str(first_email).strip())
    else:
        print("No RIT students found in Excel.")
        
except Exception as e:
    print(f"Error: {e}")
