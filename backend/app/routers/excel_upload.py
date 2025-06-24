from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import pandas as pd
import io
from datetime import datetime
import json

from .. import models, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/api/excel-upload",
    tags=["excel-upload"],
    responses={404: {"description": "Not found"}},
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Mapeo de tablas disponibles
AVAILABLE_TABLES = {
    "miscelaneos": {
        "model": models.MiscelaneosTable,
        "required_columns": ["concepto"],
        "table_name": "miscelaneos"
    },
    "estudios_permisos": {
        "model": models.EstudiosPermisosTable,
        "required_columns": ["actividad"],
        "table_name": "estudios_disenos_permisos"
    },
    "gastos_equipo": {
        "model": models.GastosEquipoTable,
        "required_columns": ["concepto"],
        "table_name": "gastos_equipo"
    }
}

def generate_month_columns():
    """Genera las columnas de meses dinámicas"""
    from datetime import date
    months = []
    
    # 3 meses anteriores + 36 meses futuros
    current_date = date.today()
    start_year = current_date.year
    start_month = current_date.month - 3
    
    for i in range(39):  # 3 + 36 meses
        year = start_year + (start_month + i - 1) // 12
        month = ((start_month + i - 1) % 12) + 1
        months.append(f"amount_{year}_{month:02d}")
    
    return months

@router.get("/tables")
async def get_available_tables():
    """Obtiene la lista de tablas disponibles para carga"""
    return {
        "tables": list(AVAILABLE_TABLES.keys()),
        "table_info": {
            name: {
                "required_columns": info["required_columns"],
                "table_name": info["table_name"]
            }
            for name, info in AVAILABLE_TABLES.items()
        }
    }

@router.post("/preview/{table_name}")
async def preview_excel_data(
    table_name: str,
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None)
):
    """Vista previa de los datos del Excel antes de cargar"""
    
    if table_name not in AVAILABLE_TABLES:
        raise HTTPException(status_code=400, detail=f"Tabla '{table_name}' no disponible")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos Excel (.xlsx, .xls)")
    
    try:
        # Leer el archivo Excel
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents), sheet_name=sheet_name or 0)
        
        # Limpiar nombres de columnas
        df.columns = df.columns.str.strip().str.lower()
        
        # Obtener información de la tabla
        table_info = AVAILABLE_TABLES[table_name]
        required_cols = table_info["required_columns"]
        
        # Verificar columnas requeridas
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        # Función para convertir formato de mes a formato legible (para preview)
        def month_key_to_readable_preview(month_key):
            clean_key = month_key.replace("amount_", "")
            year, month = clean_key.split('_')
            month_names = {
                '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
                '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
                '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
            }
            return f"{month_names[month]}/{year}"
        
        # Generar columnas de meses disponibles
        month_columns = generate_month_columns()
        available_month_cols = []
        
        for month_col in month_columns:
            month_key = month_col.replace("amount_", "")
            readable_format = month_key_to_readable_preview(month_col)
            
            possible_keys = [
                month_col,                          # amount_2025_03
                month_key,                          # 2025_03
                month_key.replace("_", "/"),        # 2025/03
                readable_format,                    # Mar/2025
                readable_format.lower(),            # mar/2025
                readable_format.upper()             # MAR/2025
            ]
            
            if any(key in df.columns for key in possible_keys):
                available_month_cols.append(month_col)
        
        # Preparar vista previa
        preview_data = df.head(10).fillna(0).to_dict('records')
        
        return {
            "success": True,
            "preview": preview_data,
            "total_rows": len(df),
            "columns": list(df.columns),
            "required_columns": required_cols,
            "missing_columns": missing_cols,
            "month_columns_found": available_month_cols,
            "is_valid": len(missing_cols) == 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando archivo: {str(e)}")

@router.post("/upload/{table_name}")
async def upload_excel_data(
    table_name: str,
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    update_mode: str = Form("replace"),  # replace, append, update
    db: Session = Depends(get_db)
):
    """Carga masiva de datos desde Excel"""
    
    if table_name not in AVAILABLE_TABLES:
        raise HTTPException(status_code=400, detail=f"Tabla '{table_name}' no disponible")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos Excel (.xlsx, .xls)")
    
    try:
        # Leer el archivo Excel
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents), sheet_name=sheet_name or 0)
        
        # Limpiar nombres de columnas
        df.columns = df.columns.str.strip().str.lower()
        
        # Obtener información de la tabla
        table_info = AVAILABLE_TABLES[table_name]
        model = table_info["model"]
        table_name_db = table_info["table_name"]
        
        # Procesar según el modo
        results = {
            "processed": 0,
            "errors": [],
            "created": 0,
            "updated": 0,
            "skipped": 0
        }
        
        if update_mode == "replace":
            # Eliminar todos los registros existentes
            from sqlalchemy import text
            db.execute(text(f"DELETE FROM {table_name_db}"))
            db.commit()
        
        # Procesar cada fila
        for index, row in df.iterrows():
            try:
                # Preparar datos base
                row_data = {}
                
                # Agregar columna principal (concepto/actividad)
                if table_name == "miscelaneos" or table_name == "gastos_equipo":
                    row_data["concepto"] = str(row.get("concepto", f"Item {index + 1}"))
                elif table_name == "estudios_permisos":
                    row_data["actividad"] = str(row.get("actividad", f"Actividad {index + 1}"))
                
                # Función para convertir formato de mes a formato legible
                def month_key_to_readable(month_key):
                    # month_key viene como "amount_2025_03"
                    clean_key = month_key.replace("amount_", "")  # "2025_03"
                    year, month = clean_key.split('_')
                    month_names = {
                        '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
                        '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
                        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
                    }
                    return f"{month_names[month]}/{year}"
                
                # Función para convertir formato legible a month_key
                def readable_to_month_key(readable_format):
                    # readable_format viene como "Mar/2025"
                    try:
                        month_name, year = readable_format.split('/')
                        month_names_reverse = {
                            'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
                            'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
                            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
                        }
                        month_num = month_names_reverse.get(month_name, '01')
                        return f"amount_{year}_{month_num}"
                    except:
                        return None
                
                # Procesar columnas de meses
                month_columns = generate_month_columns()
                for month_col in month_columns:
                    # Buscar la columna en diferentes formatos
                    month_key = month_col.replace("amount_", "")
                    readable_format = month_key_to_readable(month_col)
                    
                    possible_keys = [
                        month_col,                          # amount_2025_03
                        month_key,                          # 2025_03
                        month_key.replace("_", "/"),        # 2025/03
                        readable_format,                    # Mar/2025
                        readable_format.lower(),            # mar/2025
                        readable_format.upper()             # MAR/2025
                    ]
                    
                    value = 0
                    for key in possible_keys:
                        if key in row and pd.notna(row[key]):
                            try:
                                value = float(row[key])
                                break
                            except:
                                continue
                    
                    row_data[month_col] = value
                
                # Insertar o actualizar registro
                if update_mode == "update":
                    # Buscar registro existente
                    if table_name == "miscelaneos":
                        existing = db.query(model).filter(model.concepto == row_data["concepto"]).first()
                    elif table_name == "gastos_equipo":
                        existing = db.query(model).filter(model.concepto == row_data["concepto"]).first()
                    elif table_name == "estudios_permisos":
                        existing = db.query(model).filter(model.actividad == row_data["actividad"]).first()
                    
                    if existing:
                        # Actualizar registro existente
                        for key, value in row_data.items():
                            setattr(existing, key, value)
                        results["updated"] += 1
                    else:
                        # Crear nuevo registro
                        new_record = model(**row_data)
                        db.add(new_record)
                        results["created"] += 1
                else:
                    # Crear nuevo registro (replace o append)
                    new_record = model(**row_data)
                    db.add(new_record)
                    results["created"] += 1
                
                results["processed"] += 1
                
            except Exception as e:
                results["errors"].append(f"Fila {index + 1}: {str(e)}")
                results["skipped"] += 1
                continue
        
        # Confirmar cambios
        db.commit()
        
        return {
            "success": True,
            "message": f"Archivo procesado exitosamente",
            "results": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error procesando archivo: {str(e)}")

@router.get("/template/{table_name}")
async def download_template(table_name: str):
    """Genera un template Excel para la tabla especificada"""
    
    if table_name not in AVAILABLE_TABLES:
        raise HTTPException(status_code=400, detail=f"Tabla '{table_name}' no disponible")
    
    try:
        # Generar columnas
        month_columns = generate_month_columns()
        table_info = AVAILABLE_TABLES[table_name]
        
        # Función para convertir formato de mes
        def format_month_header(month_key):
            # month_key viene como "amount_2025_03"
            clean_key = month_key.replace("amount_", "")  # "2025_03"
            year, month = clean_key.split('_')
            month_names = {
                '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
                '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
                '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
            }
            return f"{month_names[month]}/{year}"
        
        # Crear DataFrame con columnas base
        if table_name in ["miscelaneos", "gastos_equipo"]:
            columns = ["concepto"] + [format_month_header(col) for col in month_columns]
        elif table_name == "estudios_permisos":
            columns = ["actividad"] + [format_month_header(col) for col in month_columns]
        
        # Crear DataFrame vacío con ejemplo
        df = pd.DataFrame(columns=columns)
        
        # Agregar fila de ejemplo
        example_row = {}
        if table_name in ["miscelaneos", "gastos_equipo"]:
            example_row["concepto"] = "Ejemplo de concepto"
        elif table_name == "estudios_permisos":
            example_row["actividad"] = "Ejemplo de actividad"
        
        # Agregar valores de ejemplo para algunos meses
        for i, col in enumerate(columns[1:6]):  # Primeros 5 meses
            example_row[col] = 1000 * (i + 1)
        
        df = pd.concat([df, pd.DataFrame([example_row])], ignore_index=True)
        
        # Crear archivo Excel en memoria
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=f'Template_{table_name}', index=False)
        
        output.seek(0)
        
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            io.BytesIO(output.read()),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": f"attachment; filename=template_{table_name}.xlsx"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generando template: {str(e)}") 