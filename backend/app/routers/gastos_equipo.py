from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud_gastos_equipo, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/api/gastos_equipo",
    tags=["gastos_equipo"],
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
def read_gastos_equipo(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    gastos_equipo = crud_gastos_equipo.get_gastos_equipo(db, skip=skip, limit=limit)
    return gastos_equipo

@router.get("/view", response_model=List[dict])
def read_gastos_equipo_with_totals(db: Session = Depends(get_db)):
    return crud_gastos_equipo.get_gastos_equipo_with_totals(db)

@router.get("/{gastos_equipo_id}", response_model=schemas.GastosEquipo)
def read_gastos_equipo_by_id(gastos_equipo_id: int, db: Session = Depends(get_db)):
    db_gastos_equipo = crud_gastos_equipo.get_gastos_equipo_by_id(db, gastos_equipo_id=gastos_equipo_id)
    if db_gastos_equipo is None:
        raise HTTPException(status_code=404, detail="Gastos de equipo not found")
    return db_gastos_equipo

@router.post("/", response_model=schemas.GastosEquipo)
def create_gastos_equipo(gastos_equipo: schemas.GastosEquipoCreate, db: Session = Depends(get_db)):
    return crud_gastos_equipo.create_gastos_equipo(db=db, gastos_equipo=gastos_equipo)

@router.put("/{gastos_equipo_id}", response_model=schemas.GastosEquipo)
def update_gastos_equipo(gastos_equipo_id: int, gastos_equipo: schemas.GastosEquipoUpdate, db: Session = Depends(get_db)):
    db_gastos_equipo = crud_gastos_equipo.update_gastos_equipo(db=db, gastos_equipo_id=gastos_equipo_id, gastos_equipo=gastos_equipo)
    if db_gastos_equipo is None:
        raise HTTPException(status_code=404, detail="Gastos de equipo not found")
    return db_gastos_equipo

@router.delete("/{gastos_equipo_id}")
def delete_gastos_equipo(gastos_equipo_id: int, db: Session = Depends(get_db)):
    success = crud_gastos_equipo.delete_gastos_equipo(db=db, gastos_equipo_id=gastos_equipo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Gastos de equipo not found")
    return {"ok": True} 