from sqlalchemy.orm import Session
from sqlalchemy import select, func, text
from . import models, schemas
from typing import List, Optional
from datetime import datetime

def get_miscelaneos(db: Session, skip: int = 0, limit: int = 100) -> List[models.MiscelaneosTable]:
    return db.query(models.MiscelaneosTable).offset(skip).limit(limit).all()

def get_miscelaneos_by_id(db: Session, miscelaneos_id: int) -> Optional[models.MiscelaneosTable]:
    return db.query(models.MiscelaneosTable).filter(models.MiscelaneosTable.id == miscelaneos_id).first()

def create_miscelaneos(db: Session, miscelaneos: schemas.MiscelaneosCreate) -> models.MiscelaneosTable:
    db_miscelaneos = models.MiscelaneosTable(**miscelaneos.model_dump())
    db.add(db_miscelaneos)
    db.commit()
    db.refresh(db_miscelaneos)
    return db_miscelaneos

def update_miscelaneos(db: Session, miscelaneos_id: int, miscelaneos: schemas.MiscelaneosUpdate) -> Optional[models.MiscelaneosTable]:
    db_miscelaneos = get_miscelaneos_by_id(db, miscelaneos_id)
    if not db_miscelaneos:
        return None
    
    for key, value in miscelaneos.model_dump(exclude_unset=True).items():
        setattr(db_miscelaneos, key, value)
    
    db.commit()
    db.refresh(db_miscelaneos)
    return db_miscelaneos

def delete_miscelaneos(db: Session, miscelaneos_id: int) -> bool:
    db_miscelaneos = get_miscelaneos_by_id(db, miscelaneos_id)
    if not db_miscelaneos:
        return False
    
    db.delete(db_miscelaneos)
    db.commit()
    return True 