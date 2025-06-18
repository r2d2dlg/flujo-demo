from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud_clientes, schemas, models
from ..database import SessionLocal

router = APIRouter(
    prefix="/api/clientes",
    tags=["clientes"],
    responses={404: {"description": "Not found"}},
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Cliente, status_code=201)
def create_new_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    # Uniqueness checks are handled in crud_clientes.create_cliente
    return crud_clientes.create_cliente(db=db, cliente=cliente)

@router.get("/", response_model=List[schemas.Cliente])
def read_all_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = crud_clientes.get_clientes(db, skip=skip, limit=limit)
    return clientes

@router.get("/{cliente_id}", response_model=schemas.Cliente)
def read_single_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = crud_clientes.get_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return db_cliente

@router.put("/{cliente_id}", response_model=schemas.Cliente)
def update_existing_cliente(cliente_id: int, cliente_update: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = crud_clientes.update_cliente(db=db, cliente_id=cliente_id, cliente_update=cliente_update)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    # Uniqueness violation for updated fields is handled in crud_clientes.update_cliente
    return db_cliente

@router.delete("/{cliente_id}", response_model=schemas.Cliente) # Or schemas.Msg for a simple message
def remove_cliente(cliente_id: int, db: Session = Depends(get_db)):
    # TODO: Implement proper check in crud_clientes.delete_cliente to prevent deletion if client is in use.
    # This will raise an HTTPException from CRUD if that logic is added there.
    db_cliente = crud_clientes.delete_cliente(db=db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return db_cliente # Returns the deleted client object 