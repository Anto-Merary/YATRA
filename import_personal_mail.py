import pandas as pd
import os
import sys
import numpy as np
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Configuration
FILE_PATH = "Yatra registered/Personal mail id till 10 feb 2026.xlsx"
TABLE_NAME = "registration_personal_mail"

def main():
    url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ ERROR: Missing Supabase credentials")
        sys.exit(1)
        
    client = create_client(url, key)
    
    print(f"Reading {FILE_PATH}...")
    try:
        df = pd.read_excel(FILE_PATH)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)
        
    print(f"Found {len(df)} rows.")
    
    # Map columns
    # 'Billing Email' -> email
    # 'Student Name' -> name
    # 'Billing Tel' -> phone
    # 'College Name' -> college
    # 'Amount' -> amount
    # 'Order Status' -> payment_status
    
    # Clean data
    df['Billing Email'] = df['Billing Email'].astype(str).str.strip().str.lower()
    df['Student Name'] = df['Student Name'].astype(str).str.strip()
    df['Billing Tel'] = df['Billing Tel'].astype(str).str.strip()
    df['College Name'] = df['College Name'].astype(str).str.strip()
    # Handle NaN in payment status if any, map to string
    if 'Order Status' in df.columns:
        df['Order Status'] = df['Order Status'].astype(str).str.strip()
    else:
        print("⚠️ Warning: 'Order Status' column not found, defaulting to 'unknown'")
        df['Order Status'] = 'unknown'

    records = []
    skipped = 0
    
    for _, row in df.iterrows():
        email = row.get('Billing Email')
        if not email or email == 'nan' or '@' not in email:
            skipped += 1
            print(f"Skipping invalid email: {email}")
            continue
            
        record = {
            "email": email,
            "name": row.get('Student Name', ''),
            "phone": row.get('Billing Tel', ''),
            "college": row.get('College Name', ''),
            "amount": float(row.get('Amount', 0)) if pd.notna(row.get('Amount')) else 0,
            "payment_status": row.get('Order Status', 'unknown'),
            "ticket_sent": False
        }
        records.append(record)
        
    print(f"Prepared {len(records)} records for insertion (skipped {skipped}).")
    
    if not records:
        print("No valid records to insert.")
        sys.exit(0)

    # Batch insert
    BATCH_SIZE = 100
    inserted = 0
    
    print("Inserting into Supabase...")
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i+BATCH_SIZE]
        try:
            r = client.table(TABLE_NAME).insert(batch).execute()
            inserted += len(r.data)
            print(f"  Inserted {inserted}/{len(records)}...")
        except Exception as e:
            print(f"❌ Error inserting batch {i}: {e}")
            
    print(f"\n✅ Import Complete. Inserted {inserted} records.")

if __name__ == "__main__":
    main()
