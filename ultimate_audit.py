import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Error: Supabase credentials missing.")

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def fetch_all(table, query_params=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{query_params}"
    headers = get_headers()
    records = []
    offset = 0
    limit = 1000
    
    while True:
        # manual pagination to be safe
        paged_url = f"{url}&limit={limit}&offset={offset}"
        if "?" not in url:
            paged_url = f"{url}?limit={limit}&offset={offset}"
            
        r = requests.get(paged_url, headers=headers)
        if r.status_code != 200:
            print(f"Error fetching {table}: {r.text}")
            break
            
        chunk = r.json()
        if not chunk:
            break
            
        records.extend(chunk)
        if len(chunk) < limit:
            break
        offset += limit
        
    return records

def audit():
    print("="*50)
    print("ULTIMATE YATRA 2026 TICKET AUDIT")
    print("="*50)
    
    # 1. Main Registrations Table
    print("\n--- Main 'registrations' Table ---")
    # Fetch all paid registrations
    all_regs = fetch_all("registrations", "payment_status=eq.paid&select=id,email,name,ticket_generated,ticket_email_sent")
    total_regs = len(all_regs)
    sent_regs = sum(1 for r in all_regs if r.get('ticket_email_sent') is True)
    unsent_regs_list = [r for r in all_regs if r.get('ticket_email_sent') is not True]
    
    print(f"Total PAID Registrations: {total_regs}")
    print(f"Emails Sent:              {sent_regs}")
    print(f"Pending/Unsent:           {len(unsent_regs_list)}")
    
    # 2. Personal Mail Table
    print("\n--- 'registration_personal_mail' Table ---")
    pm_regs = fetch_all("registration_personal_mail", "select=id,email,ticket_sent")
    total_pm = len(pm_regs)
    sent_pm = sum(1 for r in pm_regs if r.get('ticket_sent') is True)
    unsent_pm = [r for r in pm_regs if r.get('ticket_sent') is not True]
    print(f"Total Imported:           {total_pm}")
    print(f"Emails Sent:              {sent_pm}")
    print(f"Pending:                  {len(unsent_pm)}")

    # 3. Recent Registrations (12th Feb)
    print("\n--- 'registeration_recent' Table ---")
    recent_regs = fetch_all("registeration_recent", "payment_status=neq.Invalid&select=id,email,ticket_sent")
    total_recent = len(recent_regs)
    sent_recent = sum(1 for r in recent_regs if r.get('ticket_sent') is True)
    unsent_recent = [r for r in recent_regs if r.get('ticket_sent') is not True]
    print(f"Total Valid Imported:     {total_recent}")
    print(f"Emails Sent:              {sent_recent}")
    print(f"Pending:                  {len(unsent_recent)}")

    # 4. General Public (12th Feb)
    print("\n--- 'registeration_general_public' Table ---")
    gen_regs = fetch_all("registeration_general_public", "select=id,email,ticket_sent")
    total_gen = len(gen_regs)
    sent_gen = sum(1 for r in gen_regs if r.get('ticket_sent') is True)
    unsent_gen = [r for r in gen_regs if r.get('ticket_sent') is not True]
    print(f"Total Imported:           {total_gen}")
    print(f"Emails Sent:              {sent_gen}")
    print(f"Pending:                  {len(unsent_gen)}")


    # 5. CONSOLIDATED UNSENT LIST
    print("\n" + "="*50)
    print("CONSOLIDATED UNSENT EMAILS LIST")
    print("="*50)
    
    # We need to be careful. usage tables (pm, recent, gen) usually sync to 'registrations'.
    # So if it is sent in 'registrations', it might be fine even if flag in sub-table is false (though unlikely with my scripts).
    # But let's trust the 'registrations' table as source of truth for "Does this email have a ticket?"
    
    # Let's verify ticket existence for the unsent ones from main table
    
    final_pending_emails = set()
    
    # Add from main table unsent
    for r in unsent_regs_list:
        final_pending_emails.add(r['email'])
        
    # Check sub-tables just in case they have emails NOT in main table (shouldn't happen if scripts ran)
    # But if they failed to sync, they might be here.
    
    for r in unsent_pm:
        final_pending_emails.add(r['email'])
    for r in unsent_recent:
        final_pending_emails.add(r['email'])
    for r in unsent_gen:
        final_pending_emails.add(r['email'])
        
    # Now, for every email in this potential pending list, check if they ACTUALLY have a sent ticket in 'registrations' 
    # (Maybe the sync happened but local flag wasn't updated?)
    
    truly_pending = []
    
    check_url = f"{SUPABASE_URL}/rest/v1/registrations?select=email,ticket_email_sent"
    # optimizing this check is hard without batching, so let's just re-fetch the specific emails or rely on the all_regs map
    
    # Map of email -> ticket_sent status from MAIN registrations table
    main_status_map = {r['email']: r.get('ticket_email_sent', False) for r in all_regs}
    
    for email in final_pending_emails:
        # If email exists in main table and is sent, then it is NOT pending.
        if main_status_map.get(email) is True:
            continue
            
        # If email exists in main table and is NOT sent, it IS pending.
        if email in main_status_map:
            truly_pending.append(email)
            continue
            
        # If email is NOT in main table at all, it defines a critical sync failure (Pending Import)
        truly_pending.append(f"{email} (Not in Registrations Table!)")

    print(f"Total Unique Emails needing attention: {len(truly_pending)}")
    
    if truly_pending:
        print("\nList of Pending Emails:")
        for idx, e in enumerate(truly_pending):
            print(f"{idx+1}. {e}")
            
    # Save to file
    with open("ultimate_audit_result.txt", "w", encoding="utf-8") as f:
        f.write("ULTIMATE AUDIT RESULT\n")
        f.write(f"Total Paid/Valid Registrations (Main Table): {total_regs}\n")
        f.write(f"Total Sent (Main Table): {sent_regs}\n")
        f.write("-" * 30 + "\n")
        f.write(f"Total Unique Pending Emails: {len(truly_pending)}\n")
        f.write("-" * 30 + "\n")
        for e in truly_pending:
            f.write(f"{e}\n")
            
    print("\nAudit results saved to 'ultimate_audit_result.txt'")

if __name__ == "__main__":
    audit()
