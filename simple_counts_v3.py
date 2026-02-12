
import pandas as pd
import time

print("Reading Excel...")
df = pd.read_excel(r'd:\YATRA 2026\Yatra registered\College mail id till 11th feb 2026.xlsx')
df.columns = [c.strip() for c in df.columns]
col_college = "College Name"
col_status = "Order Status"

# Filter RIT
mask_rit = df[col_college].fillna('').astype(str).str.contains("RIT", case=False)
mask_alumni = df[col_college].fillna('').astype(str).str.contains("ALUMI", case=False)
rit_df = df[mask_rit & (~mask_alumni)]

print(f"Total RIT Students: {len(rit_df)}")
counts = rit_df[col_status].value_counts()

print("Status Counts:")
for status, count in counts.items():
    print(f"  - '{status}': {count}")
    time.sleep(0.1) # small delay to help flush buffer?
