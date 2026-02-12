
"""
Send Tickets to RIT Students
============================
Reads 'Yatra registered/College mail id till 11th feb 2026.xlsx',
filters for 'RIT' students with 'Success' status,
and sends them ticket emails via Supabase edge function.

Usage:
    python send_rit_tickets.py              # Dry run (default)
    python send_rit_tickets.py --send       # Actually send emails
"""

import pandas as pd
import requests
import os
import sys
import argparse
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE = r"Yatra registered\College mail id till 11th feb 2026.xlsx"
STATUS_COLUMN = "Order Status"
COLLEGE_COLUMN = "College Name"
EMAIL_COLUMN = "Billing Email"
SUCCESS_STATUS = "Success"
TARGET_COLLEGE = "RIT"

def get_supabase_config():
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or service_key
    
    if not supabase_url or not service_key:
        print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        sys.exit(1)
        
    return supabase_url, service_key, anon_key

def get_registrations_by_emails(supabase_url, service_key, emails):
    """Fetch registration IDs for a list of emails."""
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    # Supabase allows filtering by a list using the 'in' operator
    # url = f"{supabase_url}/rest/v1/registrations?email=in.({','.join(emails)})&select=id,email,name"
    # However, URL length might be an issue if there are many emails.
    # Better to fetch all paid registrations and filter in memory if the list is huge,
    # or chunk the requests. For ~3000 rows, chunking is safer.
    
    # Let's fetch all paid registrations to avoid URL limits and ensure we match correctly
    # Check if there are too many; if so, we might need a better strategy. 
    # But for now, let's just fetch all paid registrations and map them.
    
    url = f"{supabase_url}/rest/v1/registrations"
    params = {
        "payment_status": "eq.paid",
        "select": "id,email,name,college,payment_status"
    }
    
    # Handle pagination if needed? default Supabase limit is usually 1000.
    # We should probably use range headers or just assume we can get them all if < 1000.
    # Let's use a generator or simple loop to get all.
    
    all_regs = []
    offset = 0
    limit = 1000
    
    while True:
        headers["Range"] = f"{offset}-{offset + limit - 1}"
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error fetching registrations: {response.status_code}")
            print(response.text)
            sys.exit(1)
            
        data = response.json()
        if not data:
            break
            
        all_regs.extend(data)
        if len(data) < limit:
            break
        offset += limit
        
    print(f"Fetched {len(all_regs)} paid registrations from Supabase.")
    return {r['email'].lower(): r for r in all_regs}

def invoke_issue_tickets_batch(supabase_url, anon_key, service_key, registration_ids):
    """Invoke the issue_tickets_batch edge function."""
    edge_url = f"{supabase_url}/functions/v1/issue_tickets_batch"
    
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "apikey": anon_key
    }
    
    # Process in chunks of 50 to verify progress and avoid timeouts
    chunk_size = 50
    total_issued = 0
    total_skipped = 0
    all_failed = []
    
    for i in range(0, len(registration_ids), chunk_size):
        chunk = registration_ids[i:i + chunk_size]
        print(f"Sending batch {i//chunk_size + 1} ({len(chunk)} tickets)...")
        
        payload = {"registration_ids": chunk}
        
        try:
            response = requests.post(edge_url, headers=headers, json=payload, timeout=60)
            
            if response.status_code != 200:
                print(f"  Error invoking edge function: {response.status_code}")
                # We count these as failed
                for rid in chunk:
                    all_failed.append({"registration_id": rid, "reason": f"HTTP {response.status_code}"})
                continue
            
            result = response.json()
            total_issued += result.get('issued_count', 0)
            total_skipped += result.get('skipped_count', 0)
            if result.get('failed'):
                all_failed.extend(result['failed'])
                
        except Exception as e:
            print(f"  Exception invoking batch: {e}")
            for rid in chunk:
                all_failed.append({"registration_id": rid, "reason": str(e)})

    return {
        "issued_count": total_issued, 
        "skipped_count": total_skipped, 
        "failed": all_failed
    }

def main():
    parser = argparse.ArgumentParser(description="Send Tickets to RIT Students")
    parser.add_argument("--send", action="store_true", help="Actually send emails")
    args = parser.parse_args()
    
    print(f"{'='*60}")
    print(f"RIT TICKET SENDER")
    print(f"Mode: {'SENDING' if args.send else 'DRY RUN'}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

    # 1. Read Excel
    if not os.path.exists(INPUT_FILE):
        print(f"Error: File not found: {INPUT_FILE}")
        sys.exit(1)
        
    print(f"Reading {INPUT_FILE}...")
    try:
        df = pd.read_excel(INPUT_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        sys.exit(1)

    # 2. Filter RIT students
    print("Filtering for RIT students with Success status...")
    
    # Normalize columns
    df.columns = [c.strip() for c in df.columns]
    
    if STATUS_COLUMN not in df.columns or COLLEGE_COLUMN not in df.columns or EMAIL_COLUMN not in df.columns:
        print(f"Error: Missing columns. Found: {df.columns.tolist()}")
        sys.exit(1)
        
    # Clean and filter
    df[STATUS_COLUMN] = df[STATUS_COLUMN].astype(str).str.strip()
    df[COLLEGE_COLUMN] = df[COLLEGE_COLUMN].astype(str).str.strip()
    
    rit_students = df[
        (df[STATUS_COLUMN].str.lower() == SUCCESS_STATUS.lower()) &
        (df[COLLEGE_COLUMN] == TARGET_COLLEGE)
    ]
    
    print(f"Found {len(rit_students)} RIT students with successful payment.")
    
    excel_emails = rit_students[EMAIL_COLUMN].dropna().unique()
    excel_emails = [str(e).strip().lower() for e in excel_emails if str(e).strip()]
    
    print(f"Unique emails to process: {len(excel_emails)}")
    
    if not excel_emails:
        print("No emails found. Exiting.")
        sys.exit(0)

    # 3. Match with Supabase
    supabase_url, service_key, anon_key = get_supabase_config()
    print("Fetching registrations from Supabase...")
    
    supabase_map = get_registrations_by_emails(supabase_url, service_key, excel_emails)
    
    matched_ids = []
    missing_emails = []
    
    print("\nMatching emails...")
    for email in excel_emails:
        if email in supabase_map:
            matched_ids.append(supabase_map[email]['id'])
        else:
            missing_emails.append(email)
            
    print(f"Matched: {len(matched_ids)} registrations")
    print(f"Missing in Supabase: {len(missing_emails)}")
    
    if missing_emails:
        print("\nFirst 10 missing emails (in Excel but not in Supabase):")
        for e in missing_emails[:10]:
            print(f"  - {e}")
            
    if not matched_ids:
        print("No matches found in Supabase. Exiting.")
        sys.exit(0)

    # 4. Action
    if args.send:
        print(f"\nStarting to send tickets to {len(matched_ids)} recipients...")
        confirm = input(f"Type 'yes' to confirm sending {len(matched_ids)} emails: ")
        if confirm.lower() != 'yes':
            print("Aborted.")
            sys.exit(0)
            
        result = invoke_issue_tickets_batch(supabase_url, anon_key, service_key, matched_ids)
        
        print("\nFINAL RESULTS:")
        print(f"  Issued: {result['issued_count']}")
        print(f"  Skipped (already sent): {result['skipped_count']}")
        print(f"  Failed: {len(result['failed'])}")
        
        if result['failed']:
            print("Failed IDs:")
            for f in result['failed']:
                print(f"  {f}")
                
    else:
        print(f"\n[DRY RUN] Would send tickets to {len(matched_ids)} recipients.")
        print("Use --send to execute.")

if __name__ == "__main__":
    main()
