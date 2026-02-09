"""Debug batch insert - verbose logging"""
from dotenv import load_dotenv
import os
import pandas as pd
load_dotenv()

from supabase import create_client
from datetime import datetime

# Read first 3 successful records
df = pd.read_excel("YATRA REG LINK -26.xlsx")
success_df = df[df['Order Status'].str.lower().str.strip() == 'success'].head(3)

client = create_client(os.getenv('VITE_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

for idx, row in success_df.iterrows():
    email = str(row.get('Billing Email', '')).lower().strip()
    name = row.get('Student Name') or row.get('Billing Name') or 'Unknown'
    college = row.get('College Name', 'Unknown')
    tracking = str(row.get('Tracking', '')).strip()
    phone = row.get('Billing Tel') or row.get('Phone', '')
    
    print(f"\n{'='*50}")
    print(f"Inserting: {email}")
    print(f"  Name: {name}")
    print(f"  College: {college}")
    print(f"  Tracking: {tracking}")
    print(f"  Phone: {phone}")
    
    reg_data = {
        "name": str(name) if name else "Unknown",
        "email": email,
        "phone": str(phone) if phone else None,
        "college": str(college) if college else "Unknown",
        "payment_status": "paid",
        "payment_utr": tracking,
        "payment_confirmed_at": datetime.utcnow().isoformat(),
        "ticket_email_sent": False,
        "ticket_generated": False,
    }
    
    try:
        result = client.table('registrations').insert(reg_data).execute()
        print(f"  Result: SUCCESS - {len(result.data)} row(s) inserted")
    except Exception as e:
        print(f"  Result: ERROR - {type(e).__name__}: {e}")

# Count
final = client.table('registrations').select('*', count='exact').eq('payment_status', 'paid').execute()
print(f"\n{'='*50}")
print(f"Final paid count: {final.count}")
