"""
YATRA 2026 - Direct Ticket Email Sender
========================================
Sends ticket emails directly by invoking the Supabase edge function.
Bypasses admin panel for batch email sending.

Usage:
    python send_tickets.py                  # Preview pending registrations
    python send_tickets.py --send           # Actually send tickets
    python send_tickets.py --send --limit 5 # Send to first 5 only
"""

import os
import sys
import argparse
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def get_pending_registrations(supabase_url: str, service_key: str) -> list:
    """Fetch registrations that are paid but haven't received ticket emails."""
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    # Query for paid registrations with pending ticket emails
    url = f"{supabase_url}/rest/v1/registrations"
    params = {
        "payment_status": "eq.paid",
        "ticket_email_sent": "eq.false",
        "select": "id,email,name,college,created_at"
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"Error fetching registrations: {response.status_code}")
        print(response.text)
        return []
    
    return response.json()


def invoke_issue_tickets_batch(supabase_url: str, anon_key: str, service_key: str, registration_ids: list) -> dict:
    """Invoke the issue_tickets_batch edge function."""
    # Edge function URL
    edge_url = f"{supabase_url}/functions/v1/issue_tickets_batch"
    
    headers = {
        "Authorization": f"Bearer {service_key}",  # Service key for admin access
        "Content-Type": "application/json",
        "apikey": anon_key
    }
    
    payload = {
        "registration_ids": registration_ids
    }
    
    response = requests.post(edge_url, headers=headers, json=payload, timeout=120)
    
    if response.status_code != 200:
        print(f"Error invoking edge function: {response.status_code}")
        print(response.text)
        return {"error": response.text}
    
    return response.json()


def main():
    parser = argparse.ArgumentParser(
        description="YATRA 2026 - Direct Ticket Email Sender",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--send",
        action="store_true",
        help="Actually send the ticket emails (default: preview only)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of tickets to send"
    )
    
    args = parser.parse_args()
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or service_key
    
    if not supabase_url or not service_key:
        print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
        sys.exit(1)
    
    print(f"\n{'#'*60}")
    print(f"#  YATRA 2026 - Direct Ticket Email Sender")
    print(f"#  Mode: {'SEND EMAILS' if args.send else 'PREVIEW ONLY'}")
    print(f"#  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}")
    
    # Fetch pending registrations
    print(f"\nFetching pending registrations from Supabase...")
    pending = get_pending_registrations(supabase_url, service_key)
    
    print(f"Found {len(pending)} registrations (paid, not sent)")
    
    if not pending:
        print("\nNo pending registrations to process.")
        sys.exit(0)
    
    # Apply limit
    if args.limit:
        pending = pending[:args.limit]
        print(f"Limited to {len(pending)} registrations")
    
    # Preview
    print(f"\n{'='*60}")
    print(f"Recipients ({len(pending)}):")
    print(f"{'='*60}")
    print(f"{'Email':<40} {'Name':<25}")
    print(f"{'-'*40} {'-'*25}")
    
    for reg in pending[:20]:
        email = (reg['email'][:37] + '...') if len(reg['email']) > 40 else reg['email']
        name = (reg['name'][:22] + '...') if reg['name'] and len(reg['name']) > 25 else (reg['name'] or 'N/A')
        print(f"{email:<40} {name:<25}")
    
    if len(pending) > 20:
        print(f"... and {len(pending) - 20} more")
    
    if not args.send:
        print(f"\n{'='*60}")
        print("PREVIEW ONLY - No emails sent")
        print(f"{'='*60}")
        print("To actually send tickets, run:")
        print("  python send_tickets.py --send")
        print("  python send_tickets.py --send --limit 10  # Send to 10 only")
        sys.exit(0)
    
    # Send tickets
    print(f"\n{'='*60}")
    print(f"Sending ticket emails to {len(pending)} recipients...")
    print(f"{'='*60}")
    
    registration_ids = [reg['id'] for reg in pending]
    
    result = invoke_issue_tickets_batch(supabase_url, anon_key, service_key, registration_ids)
    
    if "error" in result:
        print(f"\nError: {result['error']}")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print("RESULTS")
    print(f"{'='*60}")
    print(f"  Issued: {result.get('issued_count', 0)}")
    print(f"  Skipped: {result.get('skipped_count', 0)}")
    print(f"  Failed: {len(result.get('failed', []))}")
    
    if result.get('failed'):
        print(f"\nFailed registrations:")
        for fail in result['failed'][:5]:
            print(f"  - {fail.get('registration_id')}: {fail.get('reason')}")
    
    print(f"\nDone! {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
