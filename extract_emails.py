"""
Batch Processor: Extract Emails from YATRA Registration Excel
Extracts email addresses where transaction status is 'Success'
"""

import pandas as pd
import sys
from datetime import datetime

# Configuration
INPUT_FILE = "YATRA REG LINK -26.xlsx"
OUTPUT_FILE = "successful_emails.txt"
STATUS_COLUMN = "Order Status"
EMAIL_COLUMN = "Billing Email"
SUCCESS_STATUS = "Success"


def extract_successful_emails(input_file: str, output_file: str) -> None:
    """
    Extract emails from Excel file where transaction status is successful.
    
    Args:
        input_file: Path to the input Excel file
        output_file: Path to save extracted emails
    """
    print(f"{'='*50}")
    print(f"YATRA Email Extractor")
    print(f"{'='*50}")
    print(f"Processing: {input_file}")
    
    try:
        # Read Excel file
        df = pd.read_excel(input_file)
        total_records = len(df)
        print(f"Total records found: {total_records}")
        
        # Check if required columns exist
        if STATUS_COLUMN not in df.columns:
            print(f"Error: Column '{STATUS_COLUMN}' not found in the file.")
            print(f"Available columns: {', '.join(df.columns.tolist()[:10])}...")
            sys.exit(1)
        
        if EMAIL_COLUMN not in df.columns:
            print(f"Error: Column '{EMAIL_COLUMN}' not found in the file.")
            print(f"Available columns: {', '.join(df.columns.tolist()[:10])}...")
            sys.exit(1)
        
        # Filter for successful transactions (case-insensitive)
        df[STATUS_COLUMN] = df[STATUS_COLUMN].astype(str).str.strip()
        successful_df = df[df[STATUS_COLUMN].str.lower() == SUCCESS_STATUS.lower()]
        
        # Extract emails
        emails = successful_df[EMAIL_COLUMN].dropna().unique().tolist()
        
        # Clean emails (remove whitespace, empty strings)
        emails = [str(email).strip() for email in emails if str(email).strip() and str(email).strip().lower() != 'nan']
        
        print(f"\nResults:")
        print(f"  - Successful transactions: {len(successful_df)}")
        print(f"  - Unique emails extracted: {len(emails)}")
        
        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            for email in sorted(emails):
                f.write(f"{email}\n")
        
        print(f"\n✓ Emails saved to: {output_file}")
        
        # Print summary of status distribution
        print(f"\n{'='*50}")
        print("Status Distribution:")
        print(f"{'='*50}")
        status_counts = df[STATUS_COLUMN].value_counts()
        for status, count in status_counts.items():
            marker = " ← extracted" if str(status).lower() == SUCCESS_STATUS.lower() else ""
            print(f"  {status}: {count}{marker}")
        
        # Print sample emails
        if emails:
            print(f"\n{'='*50}")
            print(f"Sample Emails (first 5):")
            print(f"{'='*50}")
            for email in emails[:5]:
                print(f"  - {email}")
            if len(emails) > 5:
                print(f"  ... and {len(emails) - 5} more")
                
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Allow command line arguments to override defaults
    input_path = sys.argv[1] if len(sys.argv) > 1 else INPUT_FILE
    output_path = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_FILE
    
    extract_successful_emails(input_path, output_path)
    print(f"\nDone! Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
