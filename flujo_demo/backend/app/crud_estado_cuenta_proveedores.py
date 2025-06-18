from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional
from sqlalchemy import text

def get_estado_cuenta_proveedores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.EstadoCuentaProveedores).offset(skip).limit(limit).all()

def get_estado_cuenta_proveedores_by_id(db: Session, proveedor_id: int):
    return db.query(models.EstadoCuentaProveedores).filter(models.EstadoCuentaProveedores.id == proveedor_id).first()

def get_estado_cuenta_proveedores_view(db: Session):
    return db.execute(text("SELECT * FROM v_estado_cuenta_proveedores")).mappings().all()

def create_estado_cuenta_proveedores(db: Session, proveedor: schemas.EstadoCuentaProveedoresCreate):
    db_proveedor = models.EstadoCuentaProveedores(**proveedor.model_dump())
    db.add(db_proveedor)
    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor

def update_estado_cuenta_proveedores(db: Session, proveedor_id: int, proveedor: schemas.EstadoCuentaProveedoresUpdate):
    db_proveedor = get_estado_cuenta_proveedores_by_id(db, proveedor_id)
    if db_proveedor:
        update_data = proveedor.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_proveedor, key, value)
        db.commit()
        db.refresh(db_proveedor)
    return db_proveedor

def delete_estado_cuenta_proveedores(db: Session, proveedor_id: int):
    db_proveedor = get_estado_cuenta_proveedores_by_id(db, proveedor_id)
    if db_proveedor:
        db.delete(db_proveedor)
        db.commit()
        return True
    return False 