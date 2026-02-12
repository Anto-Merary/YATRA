import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
EXCEL_FILE = "d:/YATRA 2026/Yatra registered/Yatra Gen Pub - 12.02 Mrng.xlsx"

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Supabase credentials missing.")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Reading Excel file: {EXCEL_FILE}...")
    try:
        df = pd.read_excel(EXCEL_FILE)
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return

    print(f"Found {len(df)} rows.")

    # Column Mapping
    # 'Name' -> name
    # 'Email' -> email
    # 'Phone' -> phone
    # 'Amount' -> amount
    # 'Txn Id' -> txn_id
    
    # Logic:
    # Amount <= 500 -> "Single Day Pass"
    # Amount >= 850 -> "Combo Pass"
    
    success_count = 0
    skip_count = 0

    for index, row in df.iterrows():
        try:
            name = str(row.get('Name', '')).strip()
            email = str(row.get('Email', '')).strip()
            phone = str(row.get('Phone', '')).strip()
            amount_val = row.get('Amount', 0)
            txn_id = str(row.get('Txn Id', '')).strip()
            
            # Determine Pass Category
            try:
                amt = float(amount_val)
                if amt <= 500:
                    pass_category = "Single Day Pass"
                elif amt >= 850:
                    pass_category = "Combo Pass"
                else:
                    pass_category = "Unknown" # Should not happen based on user info, but safe fallback
            except:
                pass_category = "Unknown"

            # Basic validation
            if not email or email.lower() == 'nan':
                print(f"⚠️ Row {index+1}: Missing email, skipping.")
                skip_count += 1
                continue

            # Prepare data
            data = {
                "name": name,
                "email": email,
                "phone": phone,
                "amount": amount_val,
                "txn_id": txn_id,
                "payment_status": "paid", # Assumed valid as per checking
                "pass_category": pass_category,
                "ticket_sent": False
            }

            # Check for duplicates in the TARGET table
            existing = supabase.table("registeration_general_public").select("id").eq("email", email).execute()
            if existing.data:
                print(f"  - Skipping {email} (already in registeration_general_public)")
                skip_count += 1
                continue

            # Insert
            res = supabase.table("registeration_general_public").insert(data).execute()
            if res.data:
                print(f"✅ Imported: {email} ({pass_category})")
                success_count += 1
            else:
                print(f"❌ Failed to import: {email}")

        except Exception as e:
            print(f"❌ Error processing row {index+1}: {e}")

    print("\nIMPORT COMPLETE")
    print(f"Successfully imported: {success_count}")
    print(f"Skipped: {skip_count}")

if __name__ == "__main__":
    main()
