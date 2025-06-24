from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from . import models, schemas
from typing import List, Optional, Dict, Any
from datetime import datetime

def get_miscelaneos(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all miscelaneos with dynamic month columns and year totals"""
    
    # Base query with dynamic columns
    query = text("""
        SELECT 
            m.*,
            -- Year totals
            COALESCE(
                amount_2024_01 + amount_2024_02 + amount_2024_03 + amount_2024_04 + 
                amount_2024_05 + amount_2024_06 + amount_2024_07 + amount_2024_08 + 
                amount_2024_09 + amount_2024_10 + amount_2024_11 + amount_2024_12, 0
            ) as total_2024_2025,
            COALESCE(
                amount_2025_01 + amount_2025_02 + amount_2025_03 + amount_2025_04 + 
                amount_2025_05 + amount_2025_06 + amount_2025_07 + amount_2025_08 + 
                amount_2025_09 + amount_2025_10 + amount_2025_11 + amount_2025_12, 0
            ) as total_2025_2026,
            COALESCE(
                amount_2026_01 + amount_2026_02 + amount_2026_03 + amount_2026_04 + 
                amount_2026_05 + amount_2026_06 + amount_2026_07 + amount_2026_08 + 
                amount_2026_09 + amount_2026_10 + amount_2026_11 + amount_2026_12, 0
            ) as total_2026_2027,
            COALESCE(
                amount_2027_01 + amount_2027_02 + amount_2027_03 + amount_2027_04 + 
                amount_2027_05 + amount_2027_06 + amount_2027_07 + amount_2027_08 + 
                amount_2027_09 + amount_2027_10 + amount_2027_11 + amount_2027_12, 0
            ) as total_2027_2028
        FROM miscelaneos m
        ORDER BY m.id
        OFFSET :skip LIMIT :limit
    """)
    
    result = db.execute(query, {"skip": skip, "limit": limit})
    return [dict(row._mapping) for row in result.fetchall()]

def get_miscelaneos_by_id(db: Session, miscelaneos_id: int) -> Optional[Dict[str, Any]]:
    """Get a specific miscelaneos by ID with dynamic columns"""
    
    query = text("""
        SELECT 
            m.*,
            -- Year totals
            COALESCE(
                amount_2024_01 + amount_2024_02 + amount_2024_03 + amount_2024_04 + 
                amount_2024_05 + amount_2024_06 + amount_2024_07 + amount_2024_08 + 
                amount_2024_09 + amount_2024_10 + amount_2024_11 + amount_2024_12, 0
            ) as total_2024_2025,
            COALESCE(
                amount_2025_01 + amount_2025_02 + amount_2025_03 + amount_2025_04 + 
                amount_2025_05 + amount_2025_06 + amount_2025_07 + amount_2025_08 + 
                amount_2025_09 + amount_2025_10 + amount_2025_11 + amount_2025_12, 0
            ) as total_2025_2026,
            COALESCE(
                amount_2026_01 + amount_2026_02 + amount_2026_03 + amount_2026_04 + 
                amount_2026_05 + amount_2026_06 + amount_2026_07 + amount_2026_08 + 
                amount_2026_09 + amount_2026_10 + amount_2026_11 + amount_2026_12, 0
            ) as total_2026_2027,
            COALESCE(
                amount_2027_01 + amount_2027_02 + amount_2027_03 + amount_2027_04 + 
                amount_2027_05 + amount_2027_06 + amount_2027_07 + amount_2027_08 + 
                amount_2027_09 + amount_2027_10 + amount_2027_11 + amount_2027_12, 0
            ) as total_2027_2028
        FROM miscelaneos m
        WHERE m.id = :miscelaneos_id
    """)
    
    result = db.execute(query, {"miscelaneos_id": miscelaneos_id})
    row = result.fetchone()
    return dict(row._mapping) if row else None

def create_miscelaneos(db: Session, miscelaneos: schemas.MiscelaneosCreate) -> Dict[str, Any]:
    """Create a new miscelaneos record with dynamic columns"""
    
    # Convert schema to dict and filter out None values
    data = miscelaneos.model_dump(exclude_unset=True)
    
    # Build the INSERT query dynamically
    columns = list(data.keys())
    placeholders = [f":{col}" for col in columns]
    
    query = text(f"""
        INSERT INTO miscelaneos ({', '.join(columns)})
        VALUES ({', '.join(placeholders)})
        RETURNING id
    """)
    
    result = db.execute(query, data)
    new_id = result.fetchone()[0]
    db.commit()
    
    # Return the created record
    return get_miscelaneos_by_id(db, new_id)

def update_miscelaneos(db: Session, miscelaneos_id: int, miscelaneos: schemas.MiscelaneosUpdate) -> Optional[Dict[str, Any]]:
    """Update a miscelaneos record with dynamic columns"""
    
    # Check if record exists
    existing = get_miscelaneos_by_id(db, miscelaneos_id)
    if not existing:
        return None
    
    # Get update data
    data = miscelaneos.model_dump(exclude_unset=True)
    if not data:
        return existing
    
    # Build the UPDATE query dynamically
    set_clauses = [f"{col} = :{col}" for col in data.keys()]
    data['miscelaneos_id'] = miscelaneos_id
    
    query = text(f"""
        UPDATE miscelaneos 
        SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = :miscelaneos_id
    """)
    
    db.execute(query, data)
    db.commit()
    
    # Return the updated record
    return get_miscelaneos_by_id(db, miscelaneos_id)

def delete_miscelaneos(db: Session, miscelaneos_id: int) -> bool:
    """Delete a miscelaneos record"""
    
    # Check if record exists
    existing = get_miscelaneos_by_id(db, miscelaneos_id)
    if not existing:
        return False
    
    query = text("DELETE FROM miscelaneos WHERE id = :miscelaneos_id")
    db.execute(query, {"miscelaneos_id": miscelaneos_id})
    db.commit()
    
    return True 