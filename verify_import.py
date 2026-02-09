"""Quick verification script for batch import results"""
from dotenv import load_dotenv
import os
load_dotenv()

from supabase import create_client

client = create_client(
    os.getenv('VITE_SUPABASE_URL'), 
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Count totals
result = client.table('registrations').select('*', count='exact').execute()
print(f"Total registrations: {result.count}")

# Count paid
paid = client.table('registrations').select('*', count='exact').eq('payment_status', 'paid').execute()
print(f"Paid registrations: {paid.count}")

# Count pending (paid but not sent)
pending = client.table('registrations').select('*', count='exact').eq('payment_status', 'paid').eq('ticket_email_sent', False).execute()
print(f"Pending emails (paid, not sent): {pending.count}")

# Recent entries
recent = client.table('registrations').select('email,payment_status,ticket_email_sent,created_at').order('created_at', desc=True).limit(10).execute()
print("\nRecent 10 registrations:")
for r in recent.data:
    print(f"  {r['email'][:35]:35} | paid={r['payment_status'] or 'N/A':8} | sent={r['ticket_email_sent']}")
