from sqlalchemy.orm import Session
from sqlalchemy import text
from . import models, schemas

def get_costo_x_vivienda(db: Session, item_id: int):
    return db.query(models.CostoXVivienda).filter(models.CostoXVivienda.id == item_id).first()

def get_all_costo_x_vivienda(db: Session, proyecto: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.CostoXVivienda)
    if proyecto:
        query = query.filter(models.CostoXVivienda.proyecto == proyecto)
    return query.offset(skip).limit(limit).all()

def create_costo_x_vivienda(db: Session, item: schemas.CostoXViviendaCreate):
    db_item = models.CostoXVivienda(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_costo_x_vivienda(db: Session, item_id: int, item: schemas.CostoXViviendaUpdate):
    db_item = db.query(models.CostoXVivienda).filter(models.CostoXVivienda.id == item_id).first()
    if db_item:
        update_data = item.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_costo_x_vivienda(db: Session, item_id: int):
    db_item = db.query(models.CostoXVivienda).filter(models.CostoXVivienda.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

def get_costo_x_vivienda_view(db: Session, proyecto: str = None):
    sql = "SELECT * FROM costo_x_vivienda_view"
    if proyecto:
        sql = f"SELECT * FROM costo_x_vivienda_view WHERE proyecto = :proyecto"
        return db.execute(text(sql), {"proyecto": proyecto}).fetchall()
    return db.execute(text(sql)).fetchall() 