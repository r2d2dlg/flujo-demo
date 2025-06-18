from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from sqlalchemy import text
from sqlalchemy.engine import Result
from ..auth import require_role, get_db
from ..database import engine
import pandas as pd
import io
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# List of relevant views/tables for Mercadeo
MERC_VIEW_NAMES = [
    'Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo',
    'Presupuesto_Mercadeo_Tanara_Gastos_Publicitarios',
    'Presupuesto_Mercadeo_Tanara_Ferias_Eventos',
    'Presupuesto_Mercadeo_Tanara_Redes_Sociales',
    'Presupuesto_Mercadeo_Tanara_Promociones_y_Bonos',
    'Presupuesto_Mercadeo_Tanara_Gastos_Tramites',
]

class GastosCasaModeloRow(BaseModel):
    actividad: str
    enero: Optional[float] = 0
    febrero: Optional[float] = 0
    marzo: Optional[float] = 0
    abril: Optional[float] = 0
    mayo: Optional[float] = 0
    junio: Optional[float] = 0
    julio: Optional[float] = 0
    agosto: Optional[float] = 0
    septiembre: Optional[float] = 0
    octubre: Optional[float] = 0
    noviembre: Optional[float] = 0
    diciembre: Optional[float] = 0
    total: Optional[float] = 0

@router.get("/dashboard")
def get_mercadeo_dashboard(user=Depends(require_role("Mercadeo"))):
    data = {}
    with engine.connect() as conn:
        for view in MERC_VIEW_NAMES:
            result: Result = conn.execute(text(f'SELECT * FROM "{view}"'))
            columns = result.keys()
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            data[view] = rows
    return data

@router.post("/upload_excel")
def upload_excel(
    file: UploadFile = File(...),
    user=Depends(require_role("Mercadeo"))
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an Excel file.")
    try:
        contents = file.file.read()
        excel_data = pd.ExcelFile(io.BytesIO(contents))
        for sheet_name in excel_data.sheet_names:
            if 'mercadeo' in sheet_name.lower():
                df = excel_data.parse(sheet_name)
                table_name = f'"{sheet_name}"'
                with engine.begin() as conn:
                    conn.execute(text(f'TRUNCATE TABLE {table_name}'))
                    for _, row in df.iterrows():
                        columns = ', '.join([f'"{col}"' for col in df.columns])
                        placeholders = ', '.join([f':{col}' for col in df.columns])
                        insert_sql = text(f'INSERT INTO {table_name} ({columns}) VALUES ({placeholders})')
                        params = {str(col): row[col] for col in df.columns}
                        conn.execute(insert_sql, params)
        return {"message": "Excel data uploaded and tables updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process Excel file: {e}")

# --- CRUD for Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo ---
TABLE_NAME = 'Presupuesto_Mercadeo_Tanara_Gastos_Casa_Modelo'

@router.post("/gastos_casa_modelo", dependencies=[Depends(require_role("Mercadeo"))])
def add_gastos_casa_modelo_row(row: GastosCasaModeloRow):
    with engine.begin() as conn:
        columns = ', '.join([f'"{col}"' for col in row.dict().keys()])
        placeholders = ', '.join([f':{col}' for col in row.dict().keys()])
        insert_sql = text(f'INSERT INTO "{TABLE_NAME}" ({columns}) VALUES ({placeholders})')
        conn.execute(insert_sql, row.dict())
    return {"message": "Row added successfully."}

@router.put("/gastos_casa_modelo/{actividad}", dependencies=[Depends(require_role("Mercadeo"))])
def update_gastos_casa_modelo_row(actividad: str, row: GastosCasaModeloRow):
    with engine.begin() as conn:
        set_clause = ', '.join([f'"{col}" = :{col}' for col in row.dict().keys() if col != 'actividad'])
        update_sql = text(f'UPDATE "{TABLE_NAME}" SET {set_clause} WHERE "actividad" = :actividad')
        conn.execute(update_sql, row.dict())
    return {"message": "Row updated successfully."}

@router.delete("/gastos_casa_modelo/{actividad}", dependencies=[Depends(require_role("Mercadeo"))])
def delete_gastos_casa_modelo_row(actividad: str):
    with engine.begin() as conn:
        delete_sql = text(f'DELETE FROM "{TABLE_NAME}" WHERE "actividad" = :actividad')
        conn.execute(delete_sql, {"actividad": actividad})
    return {"message": "Row deleted successfully."} 