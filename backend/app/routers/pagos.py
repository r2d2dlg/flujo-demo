from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud_pagos, models # Relative import for sibling modules
from .. import schemas as schemas_module # Alias to avoid conflict and ensure clarity
from ..database import SessionLocal # Relative import for database

router = APIRouter(
    prefix="/api/pagos",
    tags=["pagos"],
    responses={404: {"description": "Not found"}},
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas_module.Pago)
def create_new_pago(pago: schemas_module.PagoCreate, db: Session = Depends(get_db)):
    return crud_pagos.create_pago(db=db, pago=pago)

@router.get("/", response_model=List[schemas_module.Pago])
def read_pagos_list(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pagos = crud_pagos.get_pagos(db, skip=skip, limit=limit)
    return pagos

@router.get("/{pago_id}", response_model=schemas_module.Pago)
def read_single_pago(pago_id: int, db: Session = Depends(get_db)):
    db_pago = crud_pagos.get_pago(db, pago_id=pago_id)
    if db_pago is None:
        raise HTTPException(status_code=404, detail="Pago not found")
    return db_pago

@router.delete("/{pago_id}", response_model=schemas_module.Pago)
def delete_existing_pago(pago_id: int, db: Session = Depends(get_db)):
    db_pago = crud_pagos.delete_pago(db, pago_id=pago_id)
    return db_pago 