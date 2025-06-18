from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from typing import List, Optional
from decimal import Decimal

from . import models, schemas # Assuming models.py now has LineaCredito and LineaCreditoUso

# --- CRUD for LineaCredito --- 
def get_linea_credito(db: Session, linea_credito_id: int) -> Optional[models.LineaCredito]:
    return db.query(models.LineaCredito).filter(models.LineaCredito.id == linea_credito_id).first()

def list_lineas_credito(db: Session, skip: int = 0, limit: int = 100) -> List[models.LineaCredito]:
    query = db.query(models.LineaCredito)
    return query.offset(skip).limit(limit).all()

def create_linea_credito(db: Session, linea_credito_data: schemas.LineaCreditoCreate) -> models.LineaCredito:
    # When creating, monto_disponible should typically equal monto_total_linea
    db_linea_credito = models.LineaCredito(
        nombre=linea_credito_data.nombre,
        fecha_inicio=linea_credito_data.fecha_inicio,
        monto_total_linea=Decimal(str(linea_credito_data.monto_total_linea)),
        monto_disponible=Decimal(str(linea_credito_data.monto_total_linea)), # Initially, available = total
        fecha_fin=linea_credito_data.fecha_fin,
        interest_rate=Decimal(str(linea_credito_data.interest_rate)) if linea_credito_data.interest_rate is not None else None,
        es_revolvente=linea_credito_data.es_revolvente,  # Deprecated, kept for backward compatibility
        tipo_linea=linea_credito_data.tipo_linea or "LINEA_CREDITO",  # New field with default
        cargos_apertura=Decimal(str(linea_credito_data.cargos_apertura)) if linea_credito_data.cargos_apertura is not None else None,
        
        # Nuevos campos específicos
        plazo_meses=linea_credito_data.plazo_meses,
        periodicidad_pago=linea_credito_data.periodicidad_pago,
        valor_activo=Decimal(str(linea_credito_data.valor_activo)) if linea_credito_data.valor_activo is not None else None,
        valor_residual=Decimal(str(linea_credito_data.valor_residual)) if linea_credito_data.valor_residual is not None else None,
        porcentaje_financiamiento=Decimal(str(linea_credito_data.porcentaje_financiamiento)) if linea_credito_data.porcentaje_financiamiento is not None else None,
        garantia_tipo=linea_credito_data.garantia_tipo,
        garantia_descripcion=linea_credito_data.garantia_descripcion,
        limite_sobregiro=Decimal(str(linea_credito_data.limite_sobregiro)) if linea_credito_data.limite_sobregiro is not None else None,
        moneda=linea_credito_data.moneda or "USD",
        beneficiario=linea_credito_data.beneficiario,
        banco_emisor=linea_credito_data.banco_emisor,
        documento_respaldo=linea_credito_data.documento_respaldo
    )
    db.add(db_linea_credito)
    db.commit()
    db.refresh(db_linea_credito)
    return db_linea_credito

def update_linea_credito(db: Session, linea_credito_id: int, linea_update_data: schemas.LineaCreditoUpdate) -> Optional[models.LineaCredito]:
    db_linea = get_linea_credito(db, linea_credito_id)
    if not db_linea:
        return None

    update_data = linea_update_data.model_dump(exclude_unset=True)
    
    # Recalculate monto_disponible if monto_total_linea changes
    # This requires knowing current monto_utilizado, which is monto_total_linea - monto_disponible
    if 'monto_total_linea' in update_data:
        current_monto_utilizado = db_linea.monto_total_linea - db_linea.monto_disponible
        new_monto_total = Decimal(str(update_data['monto_total_linea']))
        db_linea.monto_total_linea = new_monto_total
        db_linea.monto_disponible = new_monto_total - current_monto_utilizado
        # Ensure monto_disponible isn't negative after update
        if db_linea.monto_disponible < 0:
             db_linea.monto_disponible = Decimal('0.0') # Or handle as error

    for key, value in update_data.items():
        if key == 'monto_total_linea': continue # Already handled
        if value is not None:
             # Convert to Decimal if the model field is Numeric
            if hasattr(db_linea, key) and hasattr(db_linea.__table__.c, key) and isinstance(getattr(db_linea.__table__.c, key).type, models.Numeric):
                setattr(db_linea, key, Decimal(str(value)))
            else:
                setattr(db_linea, key, value)
    
    db.commit()
    db.refresh(db_linea)
    return db_linea

def delete_linea_credito(db: Session, linea_credito_id: int) -> Optional[models.LineaCredito]:
    db_linea = get_linea_credito(db, linea_credito_id)
    if db_linea:
        # Consider implications: what happens to usos? Handled by ON DELETE CASCADE in model.
        db.delete(db_linea)
        db.commit()
    return db_linea

# --- CRUD for LineaCreditoUso --- 
def list_linea_credito_usos(db: Session, linea_credito_id: int, skip: int = 0, limit: int = 100) -> List[models.LineaCreditoUso]:
    query = db.query(models.LineaCreditoUso).filter(models.LineaCreditoUso.linea_credito_id == linea_credito_id)
    return query.offset(skip).limit(limit).all()

def create_linea_credito_uso(db: Session, uso_data: schemas.LineaCreditoUsoCreate, linea_credito_id: int) -> models.LineaCreditoUso:
    db_linea_credito = get_linea_credito(db, linea_credito_id)
    if not db_linea_credito:
        raise HTTPException(status_code=404, detail=f"Línea de crédito con id {linea_credito_id} no encontrada.")

    monto_usado_decimal = Decimal(str(uso_data.monto_usado)) # From Pydantic float to Decimal

    db_uso = models.LineaCreditoUso(
        linea_credito_id=linea_credito_id,
        fecha_uso=uso_data.fecha_uso,
        monto_usado=monto_usado_decimal, # Stored as positive for drawdown, negative for payment
        tipo_transaccion=uso_data.tipo_transaccion,
        descripcion=uso_data.descripcion,
        cargo_transaccion=Decimal(str(uso_data.cargo_transaccion)) if uso_data.cargo_transaccion is not None else None
    )

    # Update monto_disponible on the parent LineaCredito
    # If monto_usado is positive (drawdown), it decreases monto_disponible.
    # If monto_usado is negative (payment/abono), it increases monto_disponible.
    new_monto_disponible = db_linea_credito.monto_disponible - monto_usado_decimal

    if new_monto_disponible < 0:
        # This check might be too simplistic if es_revolvente=True and a payment is made.
        # For ABONO_COBRO_CLIENTE, monto_usado is negative, so new_monto_disponible will be GREATER.
        # This condition as-is primarily prevents overdrawing.
        if uso_data.tipo_transaccion != 'ABONO_COBRO_CLIENTE' and uso_data.tipo_transaccion != 'PAYMENT': # Assuming PAYMENT is similar to ABONO_COBRO_CLIENTE
            raise HTTPException(status_code=400, detail=f"Fondos insuficientes en la línea de crédito. Disponible: {db_linea_credito.monto_disponible}, Intento de uso: {monto_usado_decimal}")
    
    # Cap monto_disponible at monto_total_linea unless it's a revolving line where balance can exceed original total through payments
    if not db_linea_credito.es_revolvente and new_monto_disponible > db_linea_credito.monto_total_linea:
        db_linea_credito.monto_disponible = db_linea_credito.monto_total_linea
    else:
        db_linea_credito.monto_disponible = new_monto_disponible
        
    # Removed transaction management (commit/rollback) from here.
    # The calling function will handle the transaction.
    db.add(db_uso)
    # db_linea_credito is already in session and tracked by SQLAlchemy for changes.
    # Explicitly adding it again is fine but usually not necessary if it was fetched from the same session.
    db.add(db_linea_credito) 
    # db.flush() # Optionally flush to get IDs if needed before commit, but usually not required here.
    return db_uso

# Add other CRUD operations for LineaCreditoUso if needed (get, update, delete) 

def get_linea_credito_uso(db: Session, uso_id: int) -> Optional[models.LineaCreditoUso]:
    """Get a specific credit line usage by its ID"""
    return db.query(models.LineaCreditoUso).filter(models.LineaCreditoUso.id == uso_id).first()

def delete_linea_credito_uso(db: Session, uso_id: int) -> Optional[models.LineaCreditoUso]:
    """Delete a specific credit line usage and update the available amount"""
    db_uso = get_linea_credito_uso(db, uso_id)
    if not db_uso:
        return None
    
    # Get the parent credit line to update monto_disponible
    db_linea_credito = get_linea_credito(db, db_uso.linea_credito_id)
    if not db_linea_credito:
        raise HTTPException(status_code=404, detail="Línea de crédito asociada no encontrada")
    
    # Revert the balance change caused by this uso
    # If it was a drawdown (positive monto_usado), removing it increases available amount
    # If it was a payment (negative monto_usado), removing it decreases available amount
    monto_usado_decimal = Decimal(str(db_uso.monto_usado))
    new_monto_disponible = db_linea_credito.monto_disponible + monto_usado_decimal
    
    # Ensure we don't exceed the total line amount (unless it's revolving)
    if not db_linea_credito.es_revolvente and new_monto_disponible > db_linea_credito.monto_total_linea:
        db_linea_credito.monto_disponible = db_linea_credito.monto_total_linea
    else:
        db_linea_credito.monto_disponible = new_monto_disponible
    
    # Delete the uso record
    db.delete(db_uso)
    db.add(db_linea_credito)  # Update the credit line
    db.commit()
    
    return db_uso 