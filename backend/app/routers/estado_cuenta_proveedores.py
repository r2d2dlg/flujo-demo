from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud_estado_cuenta_proveedores, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/estado-cuenta-proveedores",
    tags=["Estado Cuenta Proveedores"],
)

@router.post("/", response_model=schemas.EstadoCuentaProveedores)
def create_proveedor(proveedor: schemas.EstadoCuentaProveedoresCreate, db: Session = Depends(get_db)):
    return crud_estado_cuenta_proveedores.create_estado_cuenta_proveedores(db=db, proveedor=proveedor)

@router.get("/view", response_model=List[schemas.EstadoCuentaProveedoresView])
def read_proveedores_view(db: Session = Depends(get_db)):
    return crud_estado_cuenta_proveedores.get_estado_cuenta_proveedores_view(db)

@router.get("/", response_model=List[schemas.EstadoCuentaProveedores])
def read_proveedores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    proveedores = crud_estado_cuenta_proveedores.get_estado_cuenta_proveedores(db, skip=skip, limit=limit)
    return proveedores

@router.get("/{proveedor_id}", response_model=schemas.EstadoCuentaProveedores)
def read_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    db_proveedor = crud_estado_cuenta_proveedores.get_estado_cuenta_proveedores_by_id(db, proveedor_id=proveedor_id)
    if db_proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor not found")
    return db_proveedor

@router.put("/{proveedor_id}", response_model=schemas.EstadoCuentaProveedores)
def update_proveedor(proveedor_id: int, proveedor: schemas.EstadoCuentaProveedoresUpdate, db: Session = Depends(get_db)):
    db_proveedor = crud_estado_cuenta_proveedores.update_estado_cuenta_proveedores(db, proveedor_id=proveedor_id, proveedor=proveedor)
    if db_proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor not found")
    return db_proveedor

@router.delete("/{proveedor_id}", status_code=204)
def delete_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    if not crud_estado_cuenta_proveedores.delete_estado_cuenta_proveedores(db, proveedor_id=proveedor_id):
        raise HTTPException(status_code=404, detail="Proveedor not found")
    return {"ok": True} 