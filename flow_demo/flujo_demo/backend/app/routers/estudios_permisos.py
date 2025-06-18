from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud_estudios_permisos, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/api/estudios_disenos_permisos",
    tags=["estudios_disenos_permisos"],
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
def read_estudios_permisos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    estudios_permisos = crud_estudios_permisos.get_estudios_permisos(db, skip=skip, limit=limit)
    return estudios_permisos

@router.get("/view", response_model=List[dict])
def read_estudios_permisos_with_totals(db: Session = Depends(get_db)):
    return crud_estudios_permisos.get_estudios_permisos_with_totals(db)

@router.get("/{estudios_permisos_id}", response_model=schemas.EstudiosPermisos)
def read_estudios_permisos_by_id(estudios_permisos_id: int, db: Session = Depends(get_db)):
    db_estudios_permisos = crud_estudios_permisos.get_estudios_permisos_by_id(db, estudios_permisos_id=estudios_permisos_id)
    if db_estudios_permisos is None:
        raise HTTPException(status_code=404, detail="Estudios y permisos not found")
    return db_estudios_permisos

@router.post("/", response_model=schemas.EstudiosPermisos)
def create_estudios_permisos(estudios_permisos: schemas.EstudiosPermisosCreate, db: Session = Depends(get_db)):
    return crud_estudios_permisos.create_estudios_permisos(db=db, estudios_permisos=estudios_permisos)

@router.put("/{estudios_permisos_id}", response_model=schemas.EstudiosPermisos)
def update_estudios_permisos(estudios_permisos_id: int, estudios_permisos: schemas.EstudiosPermisosUpdate, db: Session = Depends(get_db)):
    db_estudios_permisos = crud_estudios_permisos.update_estudios_permisos(db=db, estudios_permisos_id=estudios_permisos_id, estudios_permisos=estudios_permisos)
    if db_estudios_permisos is None:
        raise HTTPException(status_code=404, detail="Estudios y permisos not found")
    return db_estudios_permisos

@router.delete("/{estudios_permisos_id}")
def delete_estudios_permisos(estudios_permisos_id: int, db: Session = Depends(get_db)):
    success = crud_estudios_permisos.delete_estudios_permisos(db=db, estudios_permisos_id=estudios_permisos_id)
    if not success:
        raise HTTPException(status_code=404, detail="Estudios y permisos not found")
    return {"ok": True} 