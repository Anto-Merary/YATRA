
import pandas as pd
try:
    df = pd.read_excel(r'd:\YATRA 2026\Yatra registered\College mail id till 11th feb 2026.xlsx')
    for c in df.columns:
        print(f"|{c}|")
except Exception as e:
    print(f"Error: {e}")
