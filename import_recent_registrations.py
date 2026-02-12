import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
EXCEL_FILE = "d:/YATRA 2026/Yatra registered/yatra reg till 12th feb mrng.xlsx"

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
    # 'Student Name' -> name
    # 'Billing Email' -> email
    # 'Billing Tel' -> phone
    # 'College Name' -> college
    # 'Total Amount' -> amount
    # 'Order Status' -> payment_status

    success_count = 0
    skip_count = 0

    for index, row in df.iterrows():
        try:
            name = str(row.get('Student Name', '')).strip()
            email = str(row.get('Billing Email', '')).strip()
            phone = str(row.get('Billing Tel', '')).strip()
            college = str(row.get('College Name', '')).strip()
            amount_val = row.get('Total Amount', 0)
            payment_status = str(row.get('Order Status', '')).strip()

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
                "college": college,
                "amount": amount_val,
                "payment_status": payment_status,
                "ticket_sent": False
            }

            # Check for duplicates in the TARGET table to avoid re-inserting
            # (Optional: check existing registrations? No, instruction says "import all records from mentioned xl sheet")
            # We'll valid duplicate check ONLY within this specific table to allow re-runs of this script.
            
            existing = supabase.table("registeration_recent").select("id").eq("email", email).execute()
            if existing.data:
                print(f"  - Skipping {email} (already in registeration_recent)")
                skip_count += 1
                continue

            # Insert
            res = supabase.table("registeration_recent").insert(data).execute()
            if res.data:
                print(f"✅ Imported: {email}")
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
