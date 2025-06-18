from sqlalchemy.orm import Session
from . import models, schemas

def get_vendedor(db: Session, vendedor_id: int):
    return db.query(models.Vendedor).filter(models.Vendedor.id == vendedor_id).first()

def get_vendedores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Vendedor).offset(skip).limit(limit).all()

def create_vendedor(db: Session, vendedor: schemas.VendedorCreate):
    db_vendedor = models.Vendedor(nombre=vendedor.nombre)
    db.add(db_vendedor)
    db.commit()
    db.refresh(db_vendedor)
    return db_vendedor

def delete_vendedor(db: Session, vendedor_id: int):
    db_vendedor = db.query(models.Vendedor).filter(models.Vendedor.id == vendedor_id).first()
    if db_vendedor:
        db.delete(db_vendedor)
        db.commit()
        return db_vendedor
    return None 