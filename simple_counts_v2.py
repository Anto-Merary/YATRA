
import pandas as pd
df = pd.read_excel(r'd:\YATRA 2026\Yatra registered\College mail id till 11th feb 2026.xlsx')
df.columns = [c.strip() for c in df.columns]
col_college = "College Name"
col_status = "Order Status"

# Filter RIT
mask_rit = df[col_college].fillna('').astype(str).str.contains("RIT", case=False)
mask_alumni = df[col_college].fillna('').astype(str).str.contains("ALUMI", case=False)
rit_df = df[mask_rit & (~mask_alumni)]

print(f"Total RIT Students: {len(rit_df)}")
print("Status Counts:")
counts = rit_df[col_status].value_counts()
for status, count in counts.items():
    print(f"  - '{status}': {count}")
    
# Check specifically for Success/Paid
success_mask = rit_df[col_status].astype(str).str.lower().isin(['success', 'paid', 'transaction successful'])
print(f"Total 'Success' RIT Students: {len(rit_df[success_mask])}")
