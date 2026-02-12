"""
Database Verification Script for YATRA 2026
============================================

Checks the Supabase database for:
1. Duplicate unique IDs (code_6_digit)
2. Missing unique IDs
3. Overall database health

Usage:
    python verify_database.py
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
    
    print("="*70)
    print("  YATRA 2026 - DATABASE VERIFICATION")
    print("="*70)
    
    # Fetch all tickets
    print("\n📊 Fetching all tickets from database...")
    result = client.table("tickets").select("id,code_6_digit,email,registration_id").execute()
    
    if not result.data:
        print("⚠️  No tickets found in database")
        return
    
    tickets = result.data
    print(f"✅ Found {len(tickets)} tickets")
    
    # Check for duplicate codes
    print("\n🔍 Checking for duplicate unique IDs...")
    codes = [t.get("code_6_digit") for t in tickets if t.get("code_6_digit")]
    code_counts = {}
    
    for code in codes:
        code_counts[code] = code_counts.get(code, 0) + 1
    
    duplicates = {code: count for code, count in code_counts.items() if count > 1}
    
    if duplicates:
        print(f"❌ CRITICAL: Found {len(duplicates)} duplicate unique IDs:")
        for code, count in duplicates.items():
            print(f"   - Code {code}: appears {count} times")
            # Show which tickets have this code
            dupe_tickets = [t for t in tickets if t.get("code_6_digit") == code]
            for t in dupe_tickets:
                print(f"     → Ticket ID: {t['id']}, Email: {t.get('email', 'N/A')}")
    else:
        print("✅ No duplicate unique IDs found")
    
    # Check for missing codes
    print("\n🔍 Checking for missing unique IDs...")
    missing = [t for t in tickets if not t.get("code_6_digit")]
    
    if missing:
        print(f"⚠️  Found {len(missing)} tickets without unique IDs:")
        for t in missing[:10]:  # Show first 10
            print(f"   - Ticket ID: {t['id']}, Email: {t.get('email', 'N/A')}")
        if len(missing) > 10:
            print(f"   ... and {len(missing) - 10} more")
    else:
        print("✅ All tickets have unique IDs")
    
    # Check code format (should be 6 digits)
    print("\n🔍 Checking unique ID format (should be 6 digits)...")
    invalid_format = []
    
    for t in tickets:
        code = t.get("code_6_digit")
        if code:
            if not (isinstance(code, str) and code.isdigit() and len(code) == 6):
                invalid_format.append((t['id'], code, t.get('email', 'N/A')))
    
    if invalid_format:
        print(f"⚠️  Found {len(invalid_format)} tickets with invalid code format:")
        for ticket_id, code, email in invalid_format[:10]:
            print(f"   - Code: '{code}', Ticket ID: {ticket_id}, Email: {email}")
        if len(invalid_format) > 10:
            print(f"   ... and {len(invalid_format) - 10} more")
    else:
        print("✅ All unique IDs have valid format (6 digits)")
    
    # Summary
    print("\n" + "="*70)
    print("  SUMMARY")
    print("="*70)
    print(f"Total tickets: {len(tickets)}")
    print(f"Unique codes: {len(code_counts)}")
    print(f"Duplicate codes: {len(duplicates)}")
    print(f"Missing codes: {len(missing)}")
    print(f"Invalid format: {len(invalid_format)}")
    
    if duplicates or len(missing) > 0 or len(invalid_format) > 0:
        print("\n❌ DATABASE HAS ISSUES - Please fix before sending production emails")
        sys.exit(1)
    else:
        print("\n✅ DATABASE IS HEALTHY - Ready for production sending")

if __name__ == "__main__":
    main()
