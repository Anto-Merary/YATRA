"""
Find Unsent Registrations
=========================
Identifies registrations that do NOT have a corresponding ticket in the tickets table.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def main():
    url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ ERROR: Missing Supabase credentials")
        sys.exit(1)
    
    client = create_client(url, key)
    
    print("Fetching all registrations...")
    # Fetch all registrations (id, email, name, payment_status)
    # We need to page through because there are >3000
    all_regs = []
    offset = 0
    limit = 1000
    while True:
        r = client.table("registrations").select("id,email,name,payment_status,ticket_email_sent").range(offset, offset+limit-1).execute()
        if not r.data: break
        all_regs.extend(r.data)
        if len(r.data) < limit: break
        offset += limit
        print(f"  Fetched {len(all_regs)} regs...")
        
    print(f"Total Registrations: {len(all_regs)}")
    
    print("Fetching all tickets...")
    all_tickets = []
    offset = 0
    while True:
        r = client.table("tickets").select("registration_id,email").range(offset, offset+limit-1).execute()
        if not r.data: break
        all_tickets.extend(r.data)
        if len(r.data) < limit: break
        offset += limit
        print(f"  Fetched {len(all_tickets)} tickets...")
        
    print(f"Total Tickets: {len(all_tickets)}")
    
    # Create set of registration IDs that have tickets
    ticket_reg_ids = set(t['registration_id'] for t in all_tickets if t.get('registration_id'))
    
    # Identify unsent
    unsent = []
    skipped_payment = 0
    
    for reg in all_regs:
        if reg['payment_status'] != 'paid':
            skipped_payment += 1
            continue
            
        if reg['id'] not in ticket_reg_ids:
            unsent.append(reg)
            
    print("\n" + "="*50)
    print("ANALYSIS RESULT")
    print("="*50)
    print(f"Total Registrations: {len(all_regs)}")
    print(f"Skipped (Not Paid): {skipped_payment}")
    print(f"Already Have Ticket: {len(ticket_reg_ids)}")
    print(f"PENDING (Need Ticket): {len(unsent)}")
    
    # Show sample
    if unsent:
        print("\nSample Pending Users:")
        for u in unsent[:5]:
            print(f"  - {u['email']} ({u.get('name', 'Unknown')})")
            
    # Also check for discrepancy: Have ticket but ticket_email_sent is False
    print("\nChecking for flag mismatch (Have Ticket but ticket_email_sent=False)...")
    mismatch = []
    for reg in all_regs:
        if reg['id'] in ticket_reg_ids and not reg.get('ticket_email_sent'):
            mismatch.append(reg)
            
    print(f"Found {len(mismatch)} users with ticket but marked as NOT sent.")
    if mismatch:
        print("Sample mismatch users:")
        for u in mismatch[:5]:
            print(f"  - {u['email']}")

if __name__ == "__main__":
    main()
