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
        r = client.table("tickets").select("registration_id").range(offset, offset+limit-1).execute()
        if not r.data: break
        all_tickets.extend(r.data)
        if len(r.data) < limit: break
        offset += limit
        print(f"  Fetched {len(all_tickets)} tickets...")
        
    print(f"Total Tickets: {len(all_tickets)}")
    
    ticket_reg_ids = set(t['registration_id'] for t in all_tickets if t.get('registration_id'))
    
    # helper for formatting
    no_ticket_regs = []
    for reg in all_regs:
        if reg['id'] not in ticket_reg_ids:
            no_ticket_regs.append(reg)
            
    with open("discrepancy_report.txt", "w", encoding="utf-8") as f:
        f.write("DISCREPANCY REPORT: REGISTRATIONS WITHOUT TICKETS\n")
        f.write("==================================================\n")
        f.write(f"COUNT: {len(no_ticket_regs)}\n")
        f.write("==================================================\n")
        
        if no_ticket_regs:
            f.write(f"{'EMAIL':<40} | {'STATUS':<15} | {'NAME'}\n")
            f.write("-" * 80 + "\n")
            for r in no_ticket_regs:
                f.write(f"{r.get('email', 'N/A'):<40} | {r.get('payment_status', 'N/A'):<15} | {r.get('name', 'N/A')}\n")
                
        # Also check for orphan tickets
        reg_ids = set(r['id'] for r in all_regs)
        orphan_tickets = [t for t in all_tickets if t['registration_id'] not in reg_ids]
        
        if orphan_tickets:
             f.write("\n" + "="*50 + "\n")
             f.write(f"ORPHAN TICKETS (No matching registration): {len(orphan_tickets)}\n")
             f.write("="*50 + "\n")
             
    print(f"Report written to discrepancy_report.txt. Found {len(no_ticket_regs)} registrations without tickets.")

if __name__ == "__main__":
    main()
