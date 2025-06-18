from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud_miscelaneos, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/api/miscelaneos",
    tags=["miscelaneos"],
    responses={404: {"description": "Not found"}},
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.Miscelaneos])
def read_miscelaneos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    miscelaneos = crud_miscelaneos.get_miscelaneos(db, skip=skip, limit=limit)
    return miscelaneos

@router.get("/{miscelaneos_id}", response_model=schemas.Miscelaneos)
def read_miscelaneos_by_id(miscelaneos_id: int, db: Session = Depends(get_db)):
    db_miscelaneos = crud_miscelaneos.get_miscelaneos_by_id(db, miscelaneos_id=miscelaneos_id)
    if db_miscelaneos is None:
        raise HTTPException(status_code=404, detail="Miscelaneos not found")
    return db_miscelaneos

@router.post("/", response_model=schemas.Miscelaneos)
def create_miscelaneos(miscelaneos: schemas.MiscelaneosCreate, db: Session = Depends(get_db)):
    return crud_miscelaneos.create_miscelaneos(db=db, miscelaneos=miscelaneos)

@router.put("/{miscelaneos_id}", response_model=schemas.Miscelaneos)
def update_miscelaneos(miscelaneos_id: int, miscelaneos: schemas.MiscelaneosUpdate, db: Session = Depends(get_db)):
    db_miscelaneos = crud_miscelaneos.update_miscelaneos(db=db, miscelaneos_id=miscelaneos_id, miscelaneos=miscelaneos)
    if db_miscelaneos is None:
        raise HTTPException(status_code=404, detail="Miscelaneos not found")
    return db_miscelaneos

@router.delete("/{miscelaneos_id}")
def delete_miscelaneos(miscelaneos_id: int, db: Session = Depends(get_db)):
    success = crud_miscelaneos.delete_miscelaneos(db=db, miscelaneos_id=miscelaneos_id)
    if not success:
        raise HTTPException(status_code=404, detail="Miscelaneos not found")
    return {"ok": True} 