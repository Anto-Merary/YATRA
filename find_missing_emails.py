import pandas as pd
import requests
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE = r"Yatra registered\College mail id till 11th feb 2026.xlsx"
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "count=exact"
    }

def fetch_all_db_emails():
    url = f"{SUPABASE_URL}/rest/v1/registrations"
    headers = get_supabase_headers()
    all_emails = set()
    offset = 0
    limit = 1000
    
    print("Fetching emails from Supabase...")
    while True:
        headers["Range"] = f"{offset}-{offset+limit-1}"
        # We only need email to compare
        params = {"select": "email"}
        try:
            r = requests.get(url, headers=headers, params=params)
            if r.status_code not in (200, 206):
                print(f"Error fetching regs: {r.text}")
                sys.exit(1)
            data = r.json()
            if not data: break
            
            for row in data:
                if row.get('email'):
                    all_emails.add(str(row['email']).lower().strip())
            
            if len(data) < limit: break
            offset += limit
            print(f"  Fetched {offset} records...")
        except Exception as e:
            print(f"Exception fetching regs: {e}")
            break
            
    return all_emails

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.")
        sys.exit(1)

    print(f"Reading {INPUT_FILE}...")
    try:
        df = pd.read_excel(INPUT_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        sys.exit(1)

    # Normalize column names
    df.columns = [c.strip() for c in df.columns]
    
    # Find email column
    col_email = next((c for c in df.columns if 'billing email' in c.lower()), None) or \
                next((c for c in df.columns if 'email' in c.lower()), None)
    
    if not col_email:
        print("CRITICAL: Email column not found.")
        sys.exit(1)

    # Extract emails from Excel
    excel_emails = []
    excel_rows = []
    
    print(f"Total rows in Excel: {len(df)}")
    
    for idx, row in df.iterrows():
        raw_email = row.get(col_email)
        if pd.isna(raw_email):
            print(f"Row {idx+2}: Empty email found. Name: {row.get('Billing Name', 'Unknown')}")
            continue
            
        email = str(raw_email).strip().lower()
        if not email or email == 'nan':
            print(f"Row {idx+2}: Invalid email '{raw_email}'. Name: {row.get('Billing Name', 'Unknown')}")
            continue
            
        excel_emails.append(email)
        excel_rows.append({
            "row_num": idx + 2, # 1-based index + header
            "email": email,
            "name": row.get('Billing Name', row.get('Student Name', 'Unknown')),
            "college": row.get('College Name', 'Unknown')
        })

    unique_excel_emails = set(excel_emails)
    print(f"Found {len(excel_emails)} valid email entries in Excel.")
    print(f"Unique emails in Excel: {len(unique_excel_emails)}")
    if len(excel_emails) != len(unique_excel_emails):
        print(f"WARNING: There are {len(excel_emails) - len(unique_excel_emails)} duplicate emails in the Excel file.")

    # Fetch DB emails
    db_emails = fetch_all_db_emails()
    print(f"Found {len(db_emails)} emails in Database.")

    # Compare
    missing_in_db = []
    for row in excel_rows:
        if row['email'] not in db_emails:
            missing_in_db.append(row)

    print("\n" + "="*50)
    print(f"MISSING EMAILS REPORT ({len(missing_in_db)} found)")
    print("="*50)
    
    if not missing_in_db:
        print("Good news! All Excel emails are present in the database.")
    else:
        print(f"{'Row':<6} {'Email':<40} {'Name':<30} {'College'}")
        print("-" * 100)
        for missing in missing_in_db:
            print(f"{missing['row_num']:<6} {missing['email']:<40} {str(missing['name'])[:28]:<30} {str(missing['college'])[:30]}")

    # Check for duplicates in Excel causing the count mismatch
    if len(excel_emails) > len(db_emails) and not missing_in_db:
         print("\nNOTE: The count mismatch is likely due to duplicate emails in the Excel file.")
         import collections
         dupes = [item for item, count in collections.Counter(excel_emails).items() if count > 1]
         if dupes:
             print(f"Duplicate emails found in Excel ({len(dupes)}):")
             for d in dupes:
                 print(f"  - {d}")

if __name__ == "__main__":
    main()
