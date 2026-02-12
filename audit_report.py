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
    all_regs = []
    offset = 0
    limit = 1000
    while True:
        r = client.table("registrations").select("id,email,name,payment_status").range(offset, offset+limit-1).execute()
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
    
    ticket_reg_ids = set(t['registration_id'] for t in all_tickets if t.get('registration_id'))
    
    unsent = []
    for reg in all_regs:
        if reg['payment_status'] != 'paid':
            continue
        if reg['id'] not in ticket_reg_ids:
            unsent.append(reg)
            
    with open("audit_report_final.txt", "w", encoding="utf-8") as f:
        f.write("AUDIT REPORT: UNSENT TICKETS\n")
        f.write("============================\n\n")
        f.write(f"Total Registrations: {len(all_regs)}\n")
        f.write(f"Total Tickets: {len(all_tickets)}\n")
        f.write(f"PENDING (Paid but No Ticket): {len(unsent)}\n\n")
        
        f.write("PENDING USERS LIST:\n")
        f.write("-------------------\n")
        for u in unsent:
            f.write(f"{u['email']} ({u.get('name', 'Unknown')})\n")
            
    print(f"Report written to audit_report_final.txt with {len(unsent)} pending users.")

if __name__ == "__main__":
    main()
