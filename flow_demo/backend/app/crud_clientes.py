from sqlalchemy.orm import Session
from sqlalchemy import func # For case-insensitive comparison
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from . import models, schemas

def get_cliente(db: Session, cliente_id: int):
    return db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

def get_cliente_by_nombre(db: Session, nombre: str):
    return db.query(models.Cliente).filter(func.lower(models.Cliente.nombre) == func.lower(nombre)).first()

def get_cliente_by_email(db: Session, email: str):
    if not email: # Don't query if email is empty
        return None
    return db.query(models.Cliente).filter(func.lower(models.Cliente.email) == func.lower(email)).first()

def get_cliente_by_ruc(db: Session, ruc: str):
    if not ruc: # Don't query if RUC is empty
        return None
    return db.query(models.Cliente).filter(models.Cliente.ruc == ruc).first()

def get_cliente_by_cedula(db: Session, numero_cedula: str):
    if not numero_cedula: # Don't query if cedula is empty
        return None
    return db.query(models.Cliente).filter(models.Cliente.numero_cedula == numero_cedula).first()

def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Cliente).order_by(models.Cliente.nombre).offset(skip).limit(limit).all()

def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    """
    Creates a new client in the database.
    Handles potential IntegrityError if a unique constraint (like name, ruc, or email) is violated.
    """
    db_cliente = models.Cliente(**cliente.model_dump())
    db.add(db_cliente)
    try:
        db.commit()
        db.refresh(db_cliente)
        return db_cliente
    except IntegrityError as e:
        db.rollback()
        # Extracting details can be tricky and DB-dependent.
        # This provides a more generic but helpful message.
        if "clientes_nombre_key" in str(e.orig):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con este nombre.")
        if "clientes_ruc_key" in str(e.orig):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con este RUC.")
        if "clientes_email_key" in str(e.orig):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con este email.")
        if "clientes_numero_cedula_key" in str(e.orig):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con este número de cédula.")
        
        raise HTTPException(
            status_code=400,
            detail=f"Error de integridad de la base de datos: {e.orig}"
        )

def update_cliente(db: Session, cliente_id: int, cliente_update: schemas.ClienteUpdate) -> models.Cliente:
    db_cliente = get_cliente(db, cliente_id)
    if not db_cliente:
        return None # Or raise HTTPException(status_code=404, detail="Cliente not found")

    update_data = cliente_update.model_dump(exclude_unset=True)

    # Check for uniqueness if relevant fields are being updated
    if 'nombre' in update_data and update_data['nombre'] != db_cliente.nombre:
        existing_cliente = get_cliente_by_nombre(db, nombre=update_data['nombre'])
        if existing_cliente and existing_cliente.id != cliente_id:
            raise HTTPException(status_code=400, detail=f"Otro cliente con nombre '{update_data['nombre']}' ya existe.")
    
    if 'email' in update_data and update_data['email'] and update_data['email'] != db_cliente.email:
        existing_cliente = get_cliente_by_email(db, email=update_data['email'])
        if existing_cliente and existing_cliente.id != cliente_id:
            raise HTTPException(status_code=400, detail=f"Otro cliente con email '{update_data['email']}' ya existe.")

    if 'ruc' in update_data and update_data['ruc'] and update_data['ruc'] != db_cliente.ruc:
        existing_cliente = get_cliente_by_ruc(db, ruc=update_data['ruc'])
        if existing_cliente and existing_cliente.id != cliente_id:
            raise HTTPException(status_code=400, detail=f"Otro cliente con RUC '{update_data['ruc']}' ya existe.")

    if 'numero_cedula' in update_data and update_data['numero_cedula'] and update_data['numero_cedula'] != db_cliente.numero_cedula:
        existing_cliente = get_cliente_by_cedula(db, numero_cedula=update_data['numero_cedula'])
        if existing_cliente and existing_cliente.id != cliente_id:
            raise HTTPException(status_code=400, detail=f"Otro cliente con Numero de Cedula '{update_data['numero_cedula']}' ya existe.")

    for key, value in update_data.items():
        setattr(db_cliente, key, value)
    
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def delete_cliente(db: Session, cliente_id: int):
    # TODO: Add check for references in PlantillaComisiones and Pagos before deleting.
    # For now, direct delete for simplicity.
    # Example check (conceptual):
    # related_pagos = db.query(models.Pago).filter(models.Pago.cliente_id == cliente_id).first()
    # if related_pagos:
    #     raise HTTPException(status_code=400, detail="Cliente no puede ser eliminado, tiene pagos asociados.")

    db_cliente = get_cliente(db, cliente_id)
    if not db_cliente:
        return None # Or raise HTTPException(status_code=404, detail="Cliente not found")
    
    db.delete(db_cliente)
    db.commit()
    return db_cliente # Return the deleted object or a success message 