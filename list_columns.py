
import pandas as pd
import sys

try:
    df = pd.read_excel(r'd:\YATRA 2026\Yatra registered\College mail id till 11th feb 2026.xlsx')
    cols = df.columns.tolist()
    print("COLUMNS FOUND:")
    for c in cols:
        print(f"  - '{c}'")
        
    print("\nSAMPLE ROW:")
    if not df.empty:
        print(df.iloc[0].to_dict())
        
except Exception as e:
    print(f"Error: {e}")
