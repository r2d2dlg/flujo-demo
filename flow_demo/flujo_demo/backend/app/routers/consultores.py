from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List
from .. import crud_consultores, schemas
from ..database import get_db

router = APIRouter(
    tags=["Consultores"],
    responses={404: {"description": "Not found"}},
)

@router.get("/nombres", response_model=List[schemas.NombresConsultores])
def get_nombres_consultores(db: Session = Depends(get_db)):
    return crud_consultores.get_nombres_consultores(db)

@router.post("/nombres", response_model=schemas.NombresConsultores)
def create_nombre_consultor(consultor: schemas.NombresConsultoresCreate, db: Session = Depends(get_db)):
    return crud_consultores.create_nombre_consultor(db, consultor)

@router.delete("/nombres/{nombre}")
def delete_nombre_consultor(nombre: str, db: Session = Depends(get_db)):
    if crud_consultores.delete_nombre_consultor(db, nombre):
        return {"message": "Consultor deleted successfully"}
    raise HTTPException(status_code=404, detail="Consultor not found")

@router.get("/costos", response_model=List[schemas.CostoConsultores])
def get_costo_consultores(
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    if start_date is None:
        start_date = date.today() - timedelta(days=90)  # 3 months ago
    if end_date is None:
        end_date = date.today() + timedelta(days=365)   # 12 months ahead
    return crud_consultores.get_costo_consultores(db, start_date, end_date)

@router.post("/costos", response_model=schemas.CostoConsultores)
def create_costo_consultor(costo: schemas.CostoConsultoresCreate, db: Session = Depends(get_db)):
    return crud_consultores.create_costo_consultor(db, costo)

@router.put("/costos/{consultor}/{fecha}", response_model=schemas.CostoConsultores)
def update_costo_consultor(
    consultor: str,
    fecha: date,
    costo_update: schemas.CostoConsultoresUpdate,
    db: Session = Depends(get_db)
):
    db_costo = crud_consultores.update_costo_consultor(db, consultor, fecha, costo_update)
    if db_costo is None:
        raise HTTPException(status_code=404, detail="Costo not found")
    return db_costo

@router.delete("/costos/{consultor}/{fecha}")
def delete_costo_consultor(consultor: str, fecha: date, db: Session = Depends(get_db)):
    if crud_consultores.delete_costo_consultor(db, consultor, fecha):
        return {"message": "Costo deleted successfully"}
    raise HTTPException(status_code=404, detail="Costo not found")

@router.get("/views/costos", response_model=List[schemas.VCostoConsultores])
def get_v_costo_consultores(
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    if start_date is None:
        start_date = date.today() - timedelta(days=90)  # 3 months ago
    if end_date is None:
        end_date = date.today() + timedelta(days=365)   # 12 months ahead
    return crud_consultores.get_v_costo_consultores(db, start_date, end_date) 