from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud_costo_x_vivienda as crud
from .. import schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/costo_x_vivienda",
    tags=["Costo X Vivienda"]
)

@router.post("/", response_model=schemas.CostoXVivienda)
def create_costo_x_vivienda(item: schemas.CostoXViviendaCreate, db: Session = Depends(get_db)):
    return crud.create_costo_x_vivienda(db=db, item=item)

@router.get("/", response_model=List[schemas.CostoXVivienda])
def read_all_costo_x_vivienda(proyecto: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_costo_x_vivienda(db, proyecto=proyecto, skip=skip, limit=limit)

@router.get("/{item_id}", response_model=schemas.CostoXVivienda)
def read_costo_x_vivienda(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_costo_x_vivienda(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{item_id}", response_model=schemas.CostoXVivienda)
def update_costo_x_vivienda(item_id: int, item: schemas.CostoXViviendaUpdate, db: Session = Depends(get_db)):
    return crud.update_costo_x_vivienda(db=db, item_id=item_id, item=item)

@router.delete("/{item_id}", response_model=schemas.CostoXVivienda)
def delete_costo_x_vivienda(item_id: int, db: Session = Depends(get_db)):
    return crud.delete_costo_x_vivienda(db=db, item_id=item_id)

@router.get("/view/", response_model=List[schemas.CostoXViviendaView])
def get_costo_x_vivienda_view(proyecto: str = None, db: Session = Depends(get_db)):
    return crud.get_costo_x_vivienda_view(db, proyecto=proyecto) 