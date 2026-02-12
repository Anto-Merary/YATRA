"""
YATRA 2026 - Production Batch Email Sender
==========================================

Sends 2000 emails in 4 batches of 500 with 5-minute pauses between batches.
This script uses the final_ticket_sender.py infrastructure with batch control.

Features:
- Sends in batches of 500 emails
- 5-minute pause between batches  
- Marks sent/failed in Supabase DB
- Detailed progress reporting
- Safe failure handling

Usage:
    python send_production_batch_2000.py --dry-run    # Test run (no emails)
    python send_production_batch_2000.py --send       # ACTUAL SENDING
"""

import subprocess
import sys
import time
from datetime import datetime

BATCH_SIZE = 500
TOTAL_EMAILS = 2000
PAUSE_BETWEEN_BATCHES = 5 * 60  # 5 minutes in seconds

def print_banner(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def run_batch(batch_num, start_from, limit, is_dry_run=False):
    """Run a single batch of email sends"""
    print_banner(f"BATCH {batch_num}/4: Sending {limit} emails (starting from index {start_from})")
    
    cmd = [
        sys.executable,
        "final_ticket_sender.py",
        "--start-from", str(start_from),
        "--limit", str(limit),
        "--yes"  # Skip confirmation
    ]
    
    if not is_dry_run:
        cmd.append("--send")
    
    print(f"Command: {' '.join(cmd)}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    result = subprocess.run(cmd, capture_output=False, text=True)
    
    if result.returncode != 0:
        print(f"\n❌ ERROR: Batch {batch_num} failed with exit code {result.returncode}")
        return False
    
    print(f"\n✅ Batch {batch_num} completed successfully")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return True

def main():
    is_dry_run = "--dry-run" in sys.argv
    is_send = "--send" in sys.argv
    
    if not is_send and not is_dry_run:
        print("ERROR: Must specify either --dry-run or --send")
        print("\nUsage:")
        print("  python send_production_batch_2000.py --dry-run    # Test run")
        print("  python send_production_batch_2000.py --send       # ACTUAL SENDING")
        sys.exit(1)
    
    mode = "DRY RUN" if is_dry_run else "PRODUCTION SEND"
    
    print_banner(f"YATRA 2026 - PRODUCTION BATCH SENDER ({mode})")
    print(f"Total emails to send: {TOTAL_EMAILS}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Number of batches: {TOTAL_EMAILS // BATCH_SIZE}")
    print(f"Pause between batches: {PAUSE_BETWEEN_BATCHES // 60} minutes")
    
    if is_send:
        print("\n⚠️  WARNING: This will send REAL emails!")
        confirm = input("\nType 'SEND 2000' to confirm: ").strip()
        if confirm != "SEND 2000":
            print("Aborted by user.")
            sys.exit(0)
    
    start_time = datetime.now()
    num_batches = TOTAL_EMAILS // BATCH_SIZE
    
    for batch_num in range(1, num_batches + 1):
        start_from = (batch_num - 1) * BATCH_SIZE
        
        # Run the batch
        success = run_batch(batch_num, start_from, BATCH_SIZE, is_dry_run)
        
        if not success:
            print(f"\n❌ CRITICAL: Batch {batch_num} failed. Stopping execution.")
            print("Please check the logs and fix any issues before continuing.")
            sys.exit(1)
        
        # Pause between batches (except after the last batch)
        if batch_num < num_batches:
            print(f"\n⏸️  Pausing for {PAUSE_BETWEEN_BATCHES // 60} minutes before next batch...")
            print(f"Next batch ({batch_num + 1}/4) will start at: {datetime.now().strftime('%H:%M:%S')}")
            
            # Countdown timer
            for remaining in range(PAUSE_BETWEEN_BATCHES, 0, -60):
                mins = remaining // 60
                print(f"  ⏳ {mins} minute(s) remaining...", end='\r')
                time.sleep(60)
            print("\n")
    
    # Final summary
    end_time = datetime.now()
    duration = end_time - start_time
    
    print_banner("BATCH SENDING COMPLETE")
    print(f"Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Finished: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total duration: {duration}")
    print(f"\nTotal batches sent: {num_batches}")
    print(f"Target emails: {TOTAL_EMAILS}")
    
    if is_dry_run:
        print("\n✅ DRY RUN COMPLETE - No emails were sent")
    else:
        print("\n✅ PRODUCTION SEND COMPLETE")
        print("\n📊 To check results:")
        print("  1. Check Supabase 'registrations' table for 'ticket_email_sent' = true")
        print("  2. Check 'ticket_email_events' table for sent/failed status")
        print("  3. Review execution_log.txt for detailed logs")

if __name__ == "__main__":
    main()
