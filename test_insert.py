"""Test single record insert to debug batch processor"""
from dotenv import load_dotenv
import os
import uuid
load_dotenv()

from supabase import create_client

client = create_client(
    os.getenv('VITE_SUPABASE_URL'), 
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Test insert
test_data = {
    "name": "Test User Batch",
    "email": f"test-{uuid.uuid4().hex[:8]}@example.com",
    "phone": "1234567890",
    "college": "Test College",
    "payment_status": "paid",
    "payment_utr": f"TEST-{uuid.uuid4().hex[:8]}",
    "ticket_email_sent": False,
    "ticket_generated": False,
}

print("Inserting test record...")
print(f"Data: {test_data}")

try:
    result = client.table('registrations').insert(test_data).execute()
    print(f"\nSuccess! Inserted: {result.data}")
except Exception as e:
    print(f"\nError: {e}")
    print(f"Error type: {type(e)}")

# Verify
check = client.table('registrations').select('*', count='exact').eq('payment_status', 'paid').execute()
print(f"\nPaid registrations now: {check.count}")
