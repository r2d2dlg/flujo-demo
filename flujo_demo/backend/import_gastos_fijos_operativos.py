import pandas as pd
from sqlalchemy import create_engine

# Update with your actual password
engine = create_engine('postgresql://arturodlg:Oc%d}c8lIm:9c2\\S@34.174.189.231:5432/grupo11flujo')

# Read the CSV (adjust the path if needed)
df = pd.read_csv("Excel\Contabilidad\gastos_fijos_operativos.csv")

# Optional: Rename columns to match DB if needed
df.columns = [
    'nombre_empresa', 'detalle_pago', 'corriente', 'marzo', 'febrero', 'enero',
    'mas_de_120', 'total', 'monto_fijo', 'fecha_venc', 'no_cliente', 'forma_pago'
]

# Write to DB
df.to_sql('gastos_fijos_operativos', engine, if_exists='append', index=False)
print("Import complete!")