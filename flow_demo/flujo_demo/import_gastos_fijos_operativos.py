import pandas as pd
from sqlalchemy import create_engine
import re

# Database connection string (update password if needed)
engine = create_engine('postgresql://arturodlg:Oc%d}c8lIm:9c2\\S@34.174.189.231:5432/grupo11flujo')

# Read the CSV file
csv_path = 'Excel/Contabilidad/gastos_fijos_operativos.csv'
df = pd.read_csv(csv_path)

# Drop the last two columns if they are not needed
df = df.iloc[:, :12]

# Print the actual columns before renaming
print("CSV columns:", list(df.columns))

# Rename columns to match DB schema if needed
expected_columns = [
    'nombre_empresa', 'detalle_pago', 'corriente', 'marzo', 'febrero', 'enero',
    'mas_de_120', 'total', 'monto_fijo', 'fecha_venc', 'no_cliente', 'forma_pago'
]
df.columns = expected_columns

def clean_number(val):
    if pd.isna(val) or val == '':
        return None
    # Remove all commas and periods except the last period (decimal point)
    s = str(val).replace(',', '')
    # If there are multiple periods, keep only the last as decimal
    if s.count('.') > 1:
        parts = s.split('.')
        s = ''.join(parts[:-1]) + '.' + parts[-1]
    try:
        return float(s)
    except ValueError:
        return None

for col in ['corriente', 'marzo', 'febrero', 'enero', 'mas_de_120', 'total', 'monto_fijo']:
    df[col] = df[col].apply(clean_number)

# Write to DB
df.to_sql('gastos_fijos_operativos', engine, if_exists='append', index=False)
print('Import complete!') 

