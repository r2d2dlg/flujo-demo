from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from . import models, schemas
from typing import List, Optional
from datetime import datetime

def get_estudios_permisos(db: Session, skip: int = 0, limit: int = 100) -> List[dict]:
    from sqlalchemy import text
    
    # Use raw SQL to get all columns including dynamic ones
    query = """
    SELECT * FROM estudios_disenos_permisos 
    ORDER BY id 
    OFFSET :skip LIMIT :limit
    """
    
    result = db.execute(text(query), {"skip": skip, "limit": limit})
    rows = result.fetchall()
    
    # Convert to list of dictionaries
    data = []
    for row in rows:
        row_dict = dict(row._mapping)
        data.append(row_dict)
    
    return data

def get_estudios_permisos_with_totals(db: Session) -> List[dict]:
    from sqlalchemy import text
    from datetime import datetime, timedelta
    from dateutil.relativedelta import relativedelta
    
    # Calculate dynamic period (3 months before + 36 months forward = 39 months)
    current_date = datetime.now()
    start_date = current_date - relativedelta(months=3)
    
    # Get base data with all columns
    query = "SELECT * FROM estudios_disenos_permisos ORDER BY id"
    result = db.execute(text(query))
    rows = result.fetchall()
    
    # Convert to list of dictionaries and calculate totals
    data = []
    for row in rows:
        row_dict = dict(row._mapping)
        
        # Transform column names from amount_YYYY_MM to YYYY_MM format (to match frontend expectations)
        transformed_row = {}
        total_2024_2025 = 0
        total_2025_2026 = 0
        total_2026_2027 = 0
        total_2027_2028 = 0
        
        for key, value in row_dict.items():
            if key.startswith('amount_') and value is not None:
                # Transform amount_2024_05 -> 2024_05
                year_month = key.replace('amount_', '')
                transformed_row[year_month] = float(value)
                
                # Calculate period totals
                year = int(year_month.split('_')[0])
                month = int(year_month.split('_')[1])
                
                if year == 2024 or (year == 2025 and month <= 6):
                    total_2024_2025 += float(value)
                elif (year == 2025 and month > 6) or (year == 2026 and month <= 6):
                    total_2025_2026 += float(value)
                elif (year == 2026 and month > 6) or (year == 2027 and month <= 6):
                    total_2026_2027 += float(value)
                elif (year == 2027 and month > 6) or (year == 2028 and month <= 5):
                    total_2027_2028 += float(value)
            elif not key.startswith('amount_'):
                # Keep non-amount columns as is
                transformed_row[key] = value
        
        # Add period totals
        transformed_row['total_2024_2025'] = total_2024_2025 if total_2024_2025 > 0 else None
        transformed_row['total_2025_2026'] = total_2025_2026 if total_2025_2026 > 0 else None
        transformed_row['total_2026_2027'] = total_2026_2027 if total_2026_2027 > 0 else None
        transformed_row['total_2027_2028'] = total_2027_2028 if total_2027_2028 > 0 else None
        
        data.append(transformed_row)
    
    return data

def get_estudios_permisos_by_id(db: Session, estudios_permisos_id: int) -> Optional[models.EstudiosPermisosTable]:
    return db.query(models.EstudiosPermisosTable).filter(models.EstudiosPermisosTable.id == estudios_permisos_id).first()

def create_estudios_permisos(db: Session, estudios_permisos: schemas.EstudiosPermisosCreate) -> models.EstudiosPermisosTable:
    from sqlalchemy import text
    
    # Build insert query using raw SQL for dynamic columns
    data = estudios_permisos.model_dump()
    
    # Separate static fields from dynamic amount fields
    static_fields = {}
    dynamic_fields = {}
    
    for key, value in data.items():
        if key in ['actividad']:  # Only known static fields
            static_fields[key] = value
        elif key.startswith('amount_'):
            dynamic_fields[key] = value
    
    # Build column list and values
    columns = list(static_fields.keys()) + list(dynamic_fields.keys())
    placeholders = [f":{col}" for col in columns]
    params = {**static_fields, **dynamic_fields}
    
    insert_query = f"""
    INSERT INTO estudios_disenos_permisos ({', '.join(columns)}, created_at, updated_at)
    VALUES ({', '.join(placeholders)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id
    """
    
    result = db.execute(text(insert_query), params)
    new_id = result.scalar()
    db.commit()
    
    # Return the created record
    return get_estudios_permisos_by_id(db, new_id)

def update_estudios_permisos(db: Session, estudios_permisos_id: int, estudios_permisos: schemas.EstudiosPermisosUpdate) -> Optional[models.EstudiosPermisosTable]:
    from sqlalchemy import text
    
    # Check if row exists
    check_query = "SELECT id FROM estudios_disenos_permisos WHERE id = :row_id"
    existing = db.execute(text(check_query), {"row_id": estudios_permisos_id}).fetchone()
    
    if not existing:
        return None
    
    # Build update query using raw SQL for dynamic columns
    set_clauses = []
    params = {"row_id": estudios_permisos_id}
    
    for key, value in estudios_permisos.model_dump(exclude_unset=True).items():
        if key == "actividad":
            set_clauses.append("actividad = :actividad")
            params["actividad"] = value
        elif key.startswith("amount_"):
            set_clauses.append(f"{key} = :{key}")
            params[key] = float(value) if value is not None else None
    
    if not set_clauses:
        return None
    
    update_query = f"""
    UPDATE estudios_disenos_permisos 
    SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
    WHERE id = :row_id
    """
    
    db.execute(text(update_query), params)
    db.commit()
    
    # Return the updated record
    return get_estudios_permisos_by_id(db, estudios_permisos_id)

def delete_estudios_permisos(db: Session, estudios_permisos_id: int) -> bool:
    db_estudios_permisos = get_estudios_permisos_by_id(db, estudios_permisos_id)
    if not db_estudios_permisos:
        return False
    
    db.delete(db_estudios_permisos)
    db.commit()
    return True 