
import pandas as pd
import sys

# Configuration
INPUT_FILE = r"Yatra registered\College mail id till 11th feb 2026.xlsx"
STATUS_COLUMN = "Order Status"
COLLEGE_COLUMN = "College Name"
TARGET_COLLEGE = "RIT"
EXCLUDE_KEYWORD = "ALUMI"
SUCCESS_VALUES = ["Success", "Paid", "Transaction Successful"]

def diagnose():
    try:
        df = pd.read_excel(INPUT_FILE)
        df.columns = [c.strip() for c in df.columns]
        
        print(f"Total Rows in Excel: {len(df)}")
        
        # 1. Status Distribution
        print(f"\n--- Order Status Distribution ---")
        print(df[STATUS_COLUMN].value_counts())
        
        # 2. College Name Distribution (Filter for RIT-like)
        print(f"\n--- College Name Distribution (containing 'RIT') ---")
        rit_all = df[df[COLLEGE_COLUMN].astype(str).str.contains(TARGET_COLLEGE, case=False, na=False)]
        print(rit_all[COLLEGE_COLUMN].value_counts())
        print(f"Total RIT-like rows (any status): {len(rit_all)}")
        
        # 3. Apply my current Logic
        df[STATUS_COLUMN] = df[STATUS_COLUMN].astype(str).str.strip()
        df[COLLEGE_COLUMN] = df[COLLEGE_COLUMN].fillna('').astype(str).str.strip()
        
        # Current Success Mask
        success_mask = df[STATUS_COLUMN].str.lower().isin([s.lower() for s in SUCCESS_VALUES])
        
        # Current College Mask
        mask_rit = df[COLLEGE_COLUMN].str.contains(TARGET_COLLEGE, case=False)
        mask_alumni = df[COLLEGE_COLUMN].str.contains(EXCLUDE_KEYWORD, case=False)
        college_mask = mask_rit & (~mask_alumni)
        
        current_selection = df[success_mask & college_mask]
        print(f"\nCurrent Logic Count: {len(current_selection)}")
        
        # 4. Check for 'Shipped'
        shipped_mask = df[STATUS_COLUMN].str.lower() == 'shipped'
        rit_shipped = df[shipped_mask & college_mask]
        print(f"RIT rows with 'Shipped' status: {len(rit_shipped)}")
        
        # 5. Check what makes up the difference to ~3017
        # Total RIT students regardless of status?
        rit_students_all_status = df[college_mask]
        print(f"Total RIT Students (excluding Alumni, ANY status): {len(rit_students_all_status)}")
        
        if len(rit_students_all_status) > len(current_selection):
             print("\n--- Statuses of RIT Students excluded ---")
             excluded = df[college_mask & (~success_mask)]
             print(excluded[STATUS_COLUMN].value_counts())

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diagnose()
