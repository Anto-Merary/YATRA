
import pandas as pd
import sys

try:
    df = pd.read_excel(r'd:\YATRA 2026\Yatra registered\College mail id till 11th feb 2026.xlsx')
    print("Columns:", df.columns.tolist())
    if 'College Name' in df.columns:
        unique_colleges = sorted(df['College Name'].dropna().unique().tolist())
        print("\nUnique College Names:")
        for college in unique_colleges:
            print(f"  - {college}")
            
        # Check for RIT specifically
        rit_matches = [c for c in unique_colleges if 'rit' in str(c).lower() or 'rajiv' in str(c).lower()]
        print("\nPossible RIT matches:")
        for match in rit_matches:
            print(f"  -> {match}")
    else:
        print("Column 'College Name' not found!")
except Exception as e:
    print(f"Error: {e}")
