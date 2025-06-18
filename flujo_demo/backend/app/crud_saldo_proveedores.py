from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional

def get_saldo_proveedores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SaldoProveedores).offset(skip).limit(limit).all()

def get_saldo_proveedores_by_id(db: Session, proveedor_id: int):
    return db.query(models.SaldoProveedores).filter(models.SaldoProveedores.id == proveedor_id).first()

def create_saldo_proveedores(db: Session, proveedor: schemas.SaldoProveedoresCreate):
    db_proveedor = models.SaldoProveedores(**proveedor.model_dump())
    db.add(db_proveedor)
    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor

def update_saldo_proveedores(db: Session, proveedor_id: int, proveedor: schemas.SaldoProveedoresUpdate):
    db_proveedor = get_saldo_proveedores_by_id(db, proveedor_id)
    if db_proveedor:
        update_data = proveedor.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_proveedor, key, value)
        db.commit()
        db.refresh(db_proveedor)
    return db_proveedor

def delete_saldo_proveedores(db: Session, proveedor_id: int):
    db_proveedor = get_saldo_proveedores_by_id(db, proveedor_id)
    if db_proveedor:
        db.delete(db_proveedor)
        db.commit()
        return True
    return False 