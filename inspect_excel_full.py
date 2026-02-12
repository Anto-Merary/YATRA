import pandas as pd
import sys

# Set encoding to utf-8 for output
sys.stdout.reconfigure(encoding='utf-8')

file_path = "Yatra registered/Personal mail id till 10 feb 2026.xlsx"

try:
    df = pd.read_excel(file_path)
    print("ALL COLUMNS:")
    for col in df.columns:
        print(f"  - {col}")
        
    print("\nSAMPLE DATA (First row, transposed):")
    print(df.iloc[0])
except Exception as e:
    print(f"Error reading excel: {e}")
