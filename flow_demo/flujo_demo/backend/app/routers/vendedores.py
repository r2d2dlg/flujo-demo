from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session

from .. import crud_vendedores, schemas, models # Adjusted imports
from ..database import get_db # Assuming get_db is in a top-level database.py

router = APIRouter(
    prefix="/api/vendedores",
    tags=["vendedores"],
)

@router.post("/", response_model=schemas.Vendedor)
def create_new_vendedor(vendedor: schemas.VendedorCreate, db: Session = Depends(get_db)):
    # Optional: Check if salesperson already exists by name to prevent duplicates
    # db_vendedor = db.query(models.Vendedor).filter(models.Vendedor.nombre == vendedor.nombre).first()
    # if db_vendedor:
    #     raise HTTPException(status_code=400, detail="Vendedor with this name already exists")
    return crud_vendedores.create_vendedor(db=db, vendedor=vendedor)

@router.get("/", response_model=List[schemas.Vendedor]) # Changed path from /list to / for RESTful convention
def read_all_vendedores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    vendedores = crud_vendedores.get_vendedores(db, skip=skip, limit=limit)
    return vendedores

@router.get("/{vendedor_id}", response_model=schemas.Vendedor)
def read_single_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    db_vendedor = crud_vendedores.get_vendedor(db, vendedor_id=vendedor_id)
    if db_vendedor is None:
        raise HTTPException(status_code=404, detail="Vendedor not found")
    return db_vendedor

@router.delete("/{vendedor_id}", response_model=schemas.Vendedor)
def delete_existing_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    db_vendedor = crud_vendedores.delete_vendedor(db, vendedor_id=vendedor_id)
    if db_vendedor is None:
        raise HTTPException(status_code=404, detail="Vendedor not found")
    return db_vendedor 