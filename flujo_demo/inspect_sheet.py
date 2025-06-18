import openpyxl

# Load the workbook with formulas
wb = openpyxl.load_workbook('Excel/Flujo de Caja Grupo 11 2025 Abril.xlsx', data_only=False)
sheet = wb['Presupuesto Mercadeo Tanara']

print("Row | Values | Formulas")
for i, row in enumerate(sheet.iter_rows(values_only=False), 1):
    values = [cell.value for cell in row]
    formulas = [cell.value if cell.data_type == 'f' else None for cell in row]
    print(f"{i} | {values} | {formulas}")
    if i > 20:  # Print only the first 20 rows for brevity
        break
