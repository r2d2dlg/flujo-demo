from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from datetime import datetime, date
from ..database import get_db
from .. import crud_comisiones_ventas, schemas
import logging

router = APIRouter()



def create_comisiones_ventas_table_if_not_exists(db: Session):
    """Create the comisiones_ventas table if it doesn't exist"""
    try:
        # Simple table creation - start with basic structure
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS comisiones_ventas (
            id SERIAL PRIMARY KEY,
            concepto VARCHAR(255) NOT NULL,
            amount_2024_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_12 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_12 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_12 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_12 DECIMAL(15,2) DEFAULT 0.00,
            amount_2028_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2028_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2028_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2028_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2028_05 DECIMAL(15,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        db.execute(text(create_table_sql))
        db.commit()
        logging.info("Comisiones ventas table created or already exists")
    except Exception as e:
        db.rollback()
        logging.error(f"Error creating comisiones_ventas table: {e}")
        raise

@router.get("/", response_model=List[dict])
def read_comisiones_ventas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Ensure table exists
    create_comisiones_ventas_table_if_not_exists(db)
    comisiones_ventas = crud_comisiones_ventas.get_comisiones_ventas(db, skip=skip, limit=limit)
    return comisiones_ventas

@router.get("/view", response_model=List[dict])
def read_comisiones_ventas_with_totals(db: Session = Depends(get_db)):
    # Ensure table exists
    create_comisiones_ventas_table_if_not_exists(db)
    return crud_comisiones_ventas.get_comisiones_ventas_with_totals(db)

@router.get("/{comisiones_ventas_id}", response_model=schemas.ComisionesVentas)
def read_comisiones_ventas_by_id(comisiones_ventas_id: int, db: Session = Depends(get_db)):
    # Ensure table exists
    create_comisiones_ventas_table_if_not_exists(db)
    db_comisiones_ventas = crud_comisiones_ventas.get_comisiones_ventas_by_id(db, comisiones_ventas_id=comisiones_ventas_id)
    if db_comisiones_ventas is None:
        raise HTTPException(status_code=404, detail="Comisiones ventas not found")
    return db_comisiones_ventas

@router.post("/", response_model=schemas.ComisionesVentas)
def create_comisiones_ventas(comisiones_ventas: schemas.ComisionesVentasCreate, db: Session = Depends(get_db)):
    # Ensure table exists
    create_comisiones_ventas_table_if_not_exists(db)
    return crud_comisiones_ventas.create_comisiones_ventas(db=db, comisiones_ventas=comisiones_ventas)

@router.put("/{comisiones_ventas_id}", response_model=schemas.ComisionesVentas)
def update_comisiones_ventas(comisiones_ventas_id: int, comisiones_ventas: schemas.ComisionesVentasUpdate, db: Session = Depends(get_db)):
    # Ensure table exists
    create_comisiones_ventas_table_if_not_exists(db)
    db_comisiones_ventas = crud_comisiones_ventas.update_comisiones_ventas(db=db, comisiones_ventas_id=comisiones_ventas_id, comisiones_ventas=comisiones_ventas)
    if db_comisiones_ventas is None:
        raise HTTPException(status_code=404, detail="Comisiones ventas not found")
    return db_comisiones_ventas

@router.delete("/{comisiones_ventas_id}")
def delete_comisiones_ventas(comisiones_ventas_id: int, db: Session = Depends(get_db)):
    # Ensure table exists
    create_comisiones_ventas_table_if_not_exists(db)
    success = crud_comisiones_ventas.delete_comisiones_ventas(db=db, comisiones_ventas_id=comisiones_ventas_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comisiones ventas not found")
    return {"ok": True} 