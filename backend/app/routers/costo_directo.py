from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session
from typing import List
from .. import crud_costo_directo, schemas
from ..database import get_db
from .. import models
from sqlalchemy import text
import logging

router = APIRouter(
    tags=["Costo Directo"]
)

@router.get("/", response_model=List[schemas.CostoDirecto])
def read_all_costos_directos(
    proyecto: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud_costo_directo.get_all_costo_directo(db, proyecto=proyecto, skip=skip, limit=limit)

@router.get("/view/", response_model=schemas.CostoDirectoView)
def get_costo_directo_view_endpoint(proyecto: str = None, db: Session = Depends(get_db)):
    return crud_costo_directo.get_costo_directo_view(db, proyecto=proyecto)

@router.get("/totales/", response_model=schemas.CostosDirectosTotales)
def read_costos_directos_totales(proyecto: str = None, db: Session = Depends(get_db)):
    return crud_costo_directo.get_costos_directos_totales(db, proyecto=proyecto)

@router.post("/", response_model=schemas.CostoDirecto, status_code=201)
def create_costo_directo_endpoint(costo_directo: schemas.CostoDirectoCreate, db: Session = Depends(get_db)):
    return crud_costo_directo.create_costo_directo(db=db, item=costo_directo)

@router.put("/{costo_directo_id}", response_model=schemas.CostoDirecto)
def update_costo_directo(costo_directo_id: int, costo_directo: schemas.CostoDirectoUpdate, db: Session = Depends(get_db)):
    db_costo_directo = crud_costo_directo.update_costo_directo(db, costo_directo_id, costo_directo)
    if db_costo_directo is None:
        raise HTTPException(status_code=404, detail="Costo directo not found")
    return db_costo_directo

@router.delete("/{costo_directo_id}")
def delete_costo_directo(costo_directo_id: int, db: Session = Depends(get_db)):
    success = crud_costo_directo.delete_costo_directo(db, costo_directo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Costo directo not found")
    return {"message": "Costo directo deleted successfully"}

@router.get("/x-vivienda", response_model=List[schemas.CostoXVivienda])
def read_all_costo_x_vivienda(
    proyecto: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return crud_costo_directo.get_all_costo_x_vivienda(db, proyecto=proyecto, skip=skip, limit=limit)

@router.get("/proyectos", response_model=List[str])
def get_distinct_proyectos(db: Session = Depends(get_db)):
    proyectos = db.query(models.CostoDirectoTable.proyecto).distinct().all()
    return [p[0] for p in proyectos]

@router.get("/proyectos-marketing", response_model=List[dict])
async def get_marketing_proyectos(request: Request, db: Session = Depends(get_db)):
    import sys
    print(f"[DEBUG] /proyectos-marketing called: {request.method} {request.url}", file=sys.stderr)
    # Use the new proyectos table instead of the old marketing_proyectos table
    proyectos = db.query(models.Proyecto).filter(models.Proyecto.is_active == True).order_by(models.Proyecto.display_name).all()
    return [{"keyword": proyecto.keyword, "display_name": proyecto.display_name} for proyecto in proyectos]

@router.get("/{costo_directo_id}", response_model=schemas.CostoDirecto)
def read_costo_directo_by_id(costo_directo_id: int, db: Session = Depends(get_db)):
    db_costo_directo = crud_costo_directo.get_costo_directo_by_id(db, costo_directo_id)
    if db_costo_directo is None:
        raise HTTPException(status_code=404, detail="Costo directo not found")
    return db_costo_directo

@router.post("/infraestructura-pagos/", response_model=schemas.InfraestructuraPagoOut)
def create_infraestructura_pago_endpoint(pago: schemas.InfraestructuraPagoCreate = Body(...), db: Session = Depends(get_db)):
    return crud_costo_directo.create_infraestructura_pago(db, pago)

@router.get("/infraestructura-pagos/", response_model=List[schemas.InfraestructuraPagoOut])
def get_infraestructura_pagos_endpoint(proyecto: str = None, db: Session = Depends(get_db)):
    return crud_costo_directo.get_infraestructura_pagos(db, proyecto=proyecto)

@router.delete("/infraestructura-pagos/{pago_id}/", response_model=schemas.InfraestructuraPagoOut)
def delete_infraestructura_pago_endpoint(pago_id: int, db: Session = Depends(get_db)):
    pago = db.query(models.InfraestructuraPago).filter(models.InfraestructuraPago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    db.delete(pago)
    db.commit()
    return pago

@router.post("/vivienda-pagos/", response_model=schemas.ViviendaPagoOut)
def create_vivienda_pago_endpoint(pago: schemas.ViviendaPagoCreate = Body(...), db: Session = Depends(get_db)):
    return crud_costo_directo.create_vivienda_pago(db, pago)

@router.get("/vivienda-pagos/", response_model=List[schemas.ViviendaPagoOut])
def get_vivienda_pagos_endpoint(proyecto: str = None, db: Session = Depends(get_db)):
    return crud_costo_directo.get_vivienda_pagos(db, proyecto=proyecto)

@router.delete("/vivienda-pagos/{pago_id}/", response_model=schemas.ViviendaPagoOut)
def delete_vivienda_pago_endpoint(pago_id: int, db: Session = Depends(get_db)):
    pago = db.query(models.ViviendaPago).filter(models.ViviendaPago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    db.delete(pago)
    db.commit()
    return pago

@router.post("/proyecto-variable-payroll/", response_model=schemas.ProyectoVariablePayrollOut)
def create_proyecto_variable_payroll_endpoint(data: schemas.ProyectoVariablePayrollCreate = Body(...), db: Session = Depends(get_db)):
    return crud_costo_directo.create_proyecto_variable_payroll(db, data)

@router.get("/proyecto-variable-payroll/", response_model=List[schemas.ProyectoVariablePayrollOut])
def get_proyecto_variable_payrolls_endpoint(proyecto: str = None, db: Session = Depends(get_db)):
    return crud_costo_directo.get_proyecto_variable_payrolls(db, proyecto=proyecto)

@router.patch("/proyecto-variable-payroll/{id}/", response_model=schemas.ProyectoVariablePayrollOut)
def update_proyecto_variable_payroll_endpoint(id: int, data: schemas.ProyectoVariablePayrollUpdate = Body(...), db: Session = Depends(get_db)):
    obj = crud_costo_directo.update_proyecto_variable_payroll(db, id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj

@router.delete("/proyecto-variable-payroll/{id}/", response_model=schemas.ProyectoVariablePayrollOut)
def delete_proyecto_variable_payroll_endpoint(id: int, db: Session = Depends(get_db)):
    obj = crud_costo_directo.delete_proyecto_variable_payroll(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj