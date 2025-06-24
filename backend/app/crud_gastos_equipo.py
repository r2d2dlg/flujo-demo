from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from . import models, schemas
from typing import List, Optional
from datetime import datetime

def get_gastos_equipo(db: Session, skip: int = 0, limit: int = 100) -> List[dict]:
    from sqlalchemy import text
    
    # Use raw SQL to get all columns including dynamic ones
    query = """
    SELECT * FROM gastos_equipo 
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

def get_gastos_equipo_with_totals(db: Session) -> List[dict]:
    """
    Get gastos_equipo data with calculated yearly totals.
    This function calculates totals for different year periods:
    - 2024-2025: From amount_2024_04 to amount_2025_05
    - 2025-2026: From amount_2025_06 to amount_2026_05  
    - 2026-2027: From amount_2026_06 to amount_2027_05
    - 2027-2028: From amount_2027_06 to amount_2028_05
    """
    from sqlalchemy import text
    
    query = """
    SELECT 
        *,
        COALESCE(amount_2024_04, 0) + COALESCE(amount_2024_05, 0) + COALESCE(amount_2024_06, 0) + 
        COALESCE(amount_2024_07, 0) + COALESCE(amount_2024_08, 0) + COALESCE(amount_2024_09, 0) + 
        COALESCE(amount_2024_10, 0) + COALESCE(amount_2024_11, 0) + COALESCE(amount_2024_12, 0) + 
        COALESCE(amount_2025_01, 0) + COALESCE(amount_2025_02, 0) + COALESCE(amount_2025_03, 0) + 
        COALESCE(amount_2025_04, 0) + COALESCE(amount_2025_05, 0) AS total_2024_2025,
        
        COALESCE(amount_2025_06, 0) + COALESCE(amount_2025_07, 0) + COALESCE(amount_2025_08, 0) + 
        COALESCE(amount_2025_09, 0) + COALESCE(amount_2025_10, 0) + COALESCE(amount_2025_11, 0) + 
        COALESCE(amount_2025_12, 0) + COALESCE(amount_2026_01, 0) + COALESCE(amount_2026_02, 0) + 
        COALESCE(amount_2026_03, 0) + COALESCE(amount_2026_04, 0) + COALESCE(amount_2026_05, 0) AS total_2025_2026,
        
        COALESCE(amount_2026_06, 0) + COALESCE(amount_2026_07, 0) + COALESCE(amount_2026_08, 0) + 
        COALESCE(amount_2026_09, 0) + COALESCE(amount_2026_10, 0) + COALESCE(amount_2026_11, 0) + 
        COALESCE(amount_2026_12, 0) + COALESCE(amount_2027_01, 0) + COALESCE(amount_2027_02, 0) + 
        COALESCE(amount_2027_03, 0) + COALESCE(amount_2027_04, 0) + COALESCE(amount_2027_05, 0) AS total_2026_2027,
        
        COALESCE(amount_2027_06, 0) + COALESCE(amount_2027_07, 0) + COALESCE(amount_2027_08, 0) + 
        COALESCE(amount_2027_09, 0) + COALESCE(amount_2027_10, 0) + COALESCE(amount_2027_11, 0) + 
        COALESCE(amount_2027_12, 0) + COALESCE(amount_2028_01, 0) + COALESCE(amount_2028_02, 0) + 
        COALESCE(amount_2028_03, 0) + COALESCE(amount_2028_04, 0) + COALESCE(amount_2028_05, 0) AS total_2027_2028
    FROM gastos_equipo 
    ORDER BY id
    """
    
    result = db.execute(text(query))
    rows = result.fetchall()
    
    # Convert to list of dictionaries
    data = []
    for row in rows:
        row_dict = dict(row._mapping)
        data.append(row_dict)
    
    return data

def get_gastos_equipo_by_id(db: Session, gastos_equipo_id: int) -> Optional[models.GastosEquipoTable]:
    return db.query(models.GastosEquipoTable).filter(models.GastosEquipoTable.id == gastos_equipo_id).first()

def create_gastos_equipo(db: Session, gastos_equipo: schemas.GastosEquipoCreate) -> models.GastosEquipoTable:
    from sqlalchemy import text
    
    # Build insert query using raw SQL for dynamic columns
    data = gastos_equipo.model_dump()
    
    # Separate static fields from dynamic amount fields
    static_fields = {}
    dynamic_fields = {}
    
    for key, value in data.items():
        if key in ['concepto']:  # Only known static fields
            static_fields[key] = value
        elif key.startswith('amount_'):
            dynamic_fields[key] = value
    
    # Build column list and values
    columns = list(static_fields.keys()) + list(dynamic_fields.keys())
    placeholders = [f":{col}" for col in columns]
    params = {**static_fields, **dynamic_fields}
    
    insert_query = f"""
    INSERT INTO gastos_equipo ({', '.join(columns)}, created_at, updated_at)
    VALUES ({', '.join(placeholders)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id
    """
    
    result = db.execute(text(insert_query), params)
    new_id = result.scalar()
    db.commit()
    
    # Return the created record
    return get_gastos_equipo_by_id(db, new_id)

def update_gastos_equipo(db: Session, gastos_equipo_id: int, gastos_equipo: schemas.GastosEquipoUpdate) -> Optional[models.GastosEquipoTable]:
    from sqlalchemy import text
    
    # Check if row exists
    check_query = "SELECT id FROM gastos_equipo WHERE id = :row_id"
    existing = db.execute(text(check_query), {"row_id": gastos_equipo_id}).fetchone()
    
    if not existing:
        return None
    
    # Build update query using raw SQL for dynamic columns
    set_clauses = []
    params = {"row_id": gastos_equipo_id}
    
    for key, value in gastos_equipo.model_dump(exclude_unset=True).items():
        if key == "concepto":
            set_clauses.append("concepto = :concepto")
            params["concepto"] = value
        elif key.startswith("amount_"):
            set_clauses.append(f"{key} = :{key}")
            params[key] = float(value) if value is not None else None
    
    if not set_clauses:
        return None
    
    update_query = f"""
    UPDATE gastos_equipo 
    SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
    WHERE id = :row_id
    """
    
    db.execute(text(update_query), params)
    db.commit()
    
    # Return the updated record
    return get_gastos_equipo_by_id(db, gastos_equipo_id)

def delete_gastos_equipo(db: Session, gastos_equipo_id: int) -> bool:
    from sqlalchemy import text
    
    # Check if row exists
    check_query = "SELECT id FROM gastos_equipo WHERE id = :row_id"
    existing = db.execute(text(check_query), {"row_id": gastos_equipo_id}).fetchone()
    
    if not existing:
        return False
    
    # Delete the row
    delete_query = "DELETE FROM gastos_equipo WHERE id = :row_id"
    db.execute(text(delete_query), {"row_id": gastos_equipo_id})
    db.commit()
    
    return True 