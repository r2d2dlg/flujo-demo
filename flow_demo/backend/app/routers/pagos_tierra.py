from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud_pagos_tierra, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/api/pagos_tierra",
    tags=["pagos_tierra"],
    responses={404: {"description": "Not found"}},
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[dict])
def read_pagos_tierra(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pagos_tierra = crud_pagos_tierra.get_pagos_tierra(db, skip=skip, limit=limit)
    return pagos_tierra

@router.get("/view", response_model=List[dict])
def read_pagos_tierra_with_totals(db: Session = Depends(get_db)):
    return crud_pagos_tierra.get_pagos_tierra_with_totals(db)

@router.get("/{pagos_tierra_id}", response_model=schemas.PagosTierra)
def read_pagos_tierra_by_id(pagos_tierra_id: int, db: Session = Depends(get_db)):
    db_pagos_tierra = crud_pagos_tierra.get_pagos_tierra_by_id(db, pagos_tierra_id=pagos_tierra_id)
    if db_pagos_tierra is None:
        raise HTTPException(status_code=404, detail="Pagos a tierra not found")
    return db_pagos_tierra

@router.post("/", response_model=schemas.PagosTierra)
def create_pagos_tierra(pagos_tierra: schemas.PagosTierraCreate, db: Session = Depends(get_db)):
    return crud_pagos_tierra.create_pagos_tierra(db=db, pagos_tierra=pagos_tierra)

@router.put("/{pagos_tierra_id}", response_model=schemas.PagosTierra)
def update_pagos_tierra(pagos_tierra_id: int, pagos_tierra: schemas.PagosTierraUpdate, db: Session = Depends(get_db)):
    db_pagos_tierra = crud_pagos_tierra.update_pagos_tierra(db, pagos_tierra_id=pagos_tierra_id, pagos_tierra=pagos_tierra)
    if db_pagos_tierra is None:
        raise HTTPException(status_code=404, detail="Pagos a tierra not found")
    return db_pagos_tierra

@router.delete("/{pagos_tierra_id}")
def delete_pagos_tierra(pagos_tierra_id: int, db: Session = Depends(get_db)):
    success = crud_pagos_tierra.delete_pagos_tierra(db, pagos_tierra_id=pagos_tierra_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pagos a tierra not found")
    return {"ok": True} 