
import pandas as pd
try:
    df = pd.read_excel(r'd:\YATRA 2026\Yatra registered\College mail id till 11th feb 2026.xlsx')
    df.columns = [c.strip() for c in df.columns]
    
    col_amount = None
    for c in df.columns:
        if 'amount' in c.lower():
            col_amount = c
            break
            
    if col_amount:
        print(f"Using Amount Column: '{col_amount}'")
        print(df[col_amount].value_counts())
        count_500 = len(df[df[col_amount] == 500])
        print(f"\nCount of exactly 500: {count_500}")
        
        # Check intersection with RIT
        col_college = "College Name"
        mask_rit = df[col_college].fillna('').astype(str).str.contains("RIT", case=False)
        mask_alumni = df[col_college].fillna('').astype(str).str.contains("ALUMI", case=False)
        rit_df = df[mask_rit & (~mask_alumni)]
        
        rit_500 = len(rit_df[rit_df[col_amount] == 500])
        print(f"RIT Students with Amount 500: {rit_500}")
        
    else:
        print("Amount column not found.")
        print(df.columns.tolist())
except Exception as e:
    print(f"Error: {e}")
