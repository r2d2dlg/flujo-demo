from sqlalchemy import create_engine, text

# Create the database engine
engine = create_engine('postgresql://postgres:40MGDY9l0~hxJ`%u@34.174.189.231:5432/grupo11flujo')

# SQL for creating the view
view_sql = """
DROP VIEW IF EXISTS v_presupuesto_gastos_fijos_operativos_resumen CASCADE;

CREATE VIEW v_presupuesto_gastos_fijos_operativos_resumen AS
SELECT 
    detalle_pgo as "CONCEPTO",
    SUM(enero) as "ENERO",
    SUM(febrero) as "FEBRERO",
    SUM(marzo) as "MARZO",
    SUM(corriente) as "CORRIENTE",
    SUM(monto_fijo) as "MONTO_FIJO",
    SUM(mas_de_120) as "MAS_DE_120",
    SUM(enero + febrero + marzo + corriente + monto_fijo + mas_de_120) as "TOTAL_ANUAL"
FROM presupuesto_gastos_fijos_operativos
GROUP BY detalle_pgo

UNION ALL

SELECT 
    'TOTAL' as "CONCEPTO",
    SUM(enero) as "ENERO",
    SUM(febrero) as "FEBRERO",
    SUM(marzo) as "MARZO",
    SUM(corriente) as "CORRIENTE",
    SUM(monto_fijo) as "MONTO_FIJO",
    SUM(mas_de_120) as "MAS_DE_120",
    SUM(enero + febrero + marzo + corriente + monto_fijo + mas_de_120) as "TOTAL_ANUAL"
FROM presupuesto_gastos_fijos_operativos;
"""

# Execute the SQL
with engine.connect() as conn:
    conn.execute(text(view_sql))
    conn.commit()

print("View created successfully!") 