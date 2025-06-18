from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud_saldo_proveedores, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/saldo-proveedores",
    tags=["Saldo Proveedores"],
)

@router.post("/", response_model=schemas.SaldoProveedores)
def create_saldo_proveedor(proveedor: schemas.SaldoProveedoresCreate, db: Session = Depends(get_db)):
    return crud_saldo_proveedores.create_saldo_proveedores(db=db, proveedor=proveedor)

@router.get("/", response_model=List[schemas.SaldoProveedores])
def read_saldo_proveedores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    proveedores = crud_saldo_proveedores.get_saldo_proveedores(db, skip=skip, limit=limit)
    return proveedores

@router.get("/{proveedor_id}", response_model=schemas.SaldoProveedores)
def read_saldo_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    db_proveedor = crud_saldo_proveedores.get_saldo_proveedores_by_id(db, proveedor_id=proveedor_id)
    if db_proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor not found")
    return db_proveedor

@router.put("/{proveedor_id}", response_model=schemas.SaldoProveedores)
def update_saldo_proveedor(proveedor_id: int, proveedor: schemas.SaldoProveedoresUpdate, db: Session = Depends(get_db)):
    db_proveedor = crud_saldo_proveedores.update_saldo_proveedores(db, proveedor_id=proveedor_id, proveedor=proveedor)
    if db_proveedor is None:
        raise HTTPException(status_code=404, detail="Proveedor not found")
    return db_proveedor

@router.delete("/{proveedor_id}", status_code=204)
def delete_saldo_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    if not crud_saldo_proveedores.delete_saldo_proveedores(db, proveedor_id=proveedor_id):
        raise HTTPException(status_code=404, detail="Proveedor not found")
    return {"ok": True} 