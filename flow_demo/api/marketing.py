from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

router = APIRouter(prefix="/api/marketing", tags=["marketing"])

# Tables for Chepo project
CHEPO_TABLES = [
    "presupuesto_mercadeo_chepo_casa_modelo",
    "presupuesto_mercadeo_chepo_feria_eventos",
    "presupuesto_mercadeo_chepo_gastos_publicitarios",
    "presupuesto_mercadeo_chepo_gastos_tramites",
    "presupuesto_mercadeo_chepo_promociones_y_bonos",
    "presupuesto_mercadeo_chepo_redes_sociales",
    "presupuesto_mercadeo_chepo_gastos_casa_modelo"
]

# Tables for Tanara project
TANARA_TABLES = [
    "presupuesto_mercadeo_tanara_casa_modelo",
    "presupuesto_mercadeo_tanara_ferias_eventos",
    "presupuesto_mercadeo_tanara_gastos_publicitarios",
    "presupuesto_mercadeo_tanara_gastos_tramites",
    "presupuesto_mercadeo_tanara_promociones_y_bonos",
    "presupuesto_mercadeo_tanara_redes_sociales"
]

# Get all tables for Chepo project
@router.get("/chepo/tables")
async def get_chepo_tables():
    return {"tables": CHEPO_TABLES}

# Get all tables for Tanara project
@router.get("/tanara/tables")
async def get_tanara_tables():
    return {"tables": TANARA_TABLES}

# Get table data for Chepo project
@router.get("/chepo/table/{table_name}")
async def get_chepo_table_data(table_name: str):
    if table_name not in CHEPO_TABLES:
        raise HTTPException(status_code=400, detail="Invalid table name for Chepo project")
    
    try:
        with engine.connect() as connection:
            # Get column names first
            result = connection.execute(text(f"SELECT * FROM {table_name} LIMIT 1"))
            columns = list(result.keys())
            
            # Get all data
            result = connection.execute(text(f"SELECT * FROM {table_name}"))
            data = []
            for row in result:
                # Convert each row to a dictionary
                row_dict = {}
                for i, value in enumerate(row):
                    row_dict[columns[i]] = value
                data.append(row_dict)
                
            return {"data": data, "columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get table data for Tanara project
@router.get("/tanara/table/{table_name}")
async def get_tanara_table_data(table_name: str):
    if table_name not in TANARA_TABLES:
        raise HTTPException(status_code=400, detail="Invalid table name for Tanara project")
    
    try:
        with engine.begin() as connection:
            # Get table data
            result = connection.execute(text(f'SELECT * FROM "{table_name}" ORDER BY actividad'))
            data = [dict(row._mapping) for row in result]
            
            # Get column names
            if data:
                columns = list(data[0].keys())
            else:
                # If no data, get columns from table schema
                result = connection.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}' ORDER BY ordinal_position"))
                columns = [row[0] for row in result]
            
            return {"data": data, "columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update table row
class RowUpdate(BaseModel):
    data: Dict[str, Any]

# Update Chepo table row
@router.put("/chepo/table/{table_name}/{actividad}")
async def update_chepo_table_row(table_name: str, actividad: str, row_update: RowUpdate):
    if table_name not in CHEPO_TABLES:
        raise HTTPException(status_code=400, detail="Invalid table name for Chepo project")
    
    try:
        with engine.begin() as connection:
            # Get table columns to validate
            result = connection.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'"))
            valid_columns = [row[0] for row in result.fetchall()]
            
            # Filter and validate data
            update_data = {k: v for k, v in row_update.data.items() if k in valid_columns and k != 'actividad'}
            
            if not update_data:
                return {"message": "No valid fields to update"}
                
            # Build and execute update query
            set_clause = ", ".join([f"{k} = :{k}" for k in update_data.keys()])
            query = f"""
                UPDATE {table_name}
                SET {set_clause}
                WHERE actividad = :actividad
                RETURNING *
            """
            
            result = connection.execute(
                text(query),
                {**update_data, "actividad": actividad}
            )
            
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Row not found")
                
            updated_row = dict(zip(result.keys(), result.fetchone()))
            return {"message": "Row updated successfully", "data": updated_row}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update Tanara table row
@router.put("/tanara/table/{table_name}/{actividad}")
async def update_tanara_table_row(table_name: str, actividad: str, row_update: RowUpdate):
    if table_name not in TANARA_TABLES:
        raise HTTPException(status_code=400, detail="Invalid table name for Tanara project")
    
    try:
        with engine.begin() as connection:
            # Get table columns to validate
            result = connection.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'"))
            valid_columns = [row[0] for row in result.fetchall()]
            
            # Filter and validate data
            update_data = {k: v for k, v in row_update.data.items() if k in valid_columns and k != 'actividad'}
            
            if not update_data:
                return {"message": "No valid fields to update"}
                
            # Build and execute update query
            set_clause = ", ".join([f"{k} = :{k}" for k in update_data.keys()])
            query = f"""
                UPDATE {table_name}
                SET {set_clause}
                WHERE actividad = :actividad
                RETURNING *
            """
            
            result = connection.execute(
                text(query),
                {**update_data, "actividad": actividad}
            )
            
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Row not found")
                
            updated_row = dict(zip(result.keys(), result.fetchone()))
            return {"message": "Row updated successfully", "data": updated_row}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
