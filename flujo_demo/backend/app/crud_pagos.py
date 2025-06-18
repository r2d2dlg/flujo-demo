from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from . import models, schemas
from .crud_lineas_de_credito import create_linea_credito_uso, get_linea_credito

def get_pago(db: Session, pago_id: int):
    return db.query(models.Pago).filter(models.Pago.id == pago_id).first()

def get_pagos(db: Session, skip: int = 0, limit: int = 100):
    # Join Pago with Cliente and select both entities
    results = db.query(models.Pago, models.Cliente).join(models.Cliente, models.Pago.cliente_id == models.Cliente.id).order_by(models.Pago.fecha_pago.desc()).offset(skip).limit(limit).all()
    
    # Process results to add cliente_nombre to each pago object
    pagos_with_cliente_nombre = []
    for pago, cliente in results:
        pago.cliente_nombre = cliente.nombre
        pagos_with_cliente_nombre.append(pago)
        
    return pagos_with_cliente_nombre

def create_pago(db: Session, pago: schemas.PagoCreate) -> models.Pago:
    # Start a transaction block implicitly, or can be made explicit if preferred for clarity
    # with db.begin_nested() or similar if using a more complex session setup.
    # For a single db session passed in, direct commit/rollback is fine.

    monto_total_abono_para_pago: Optional[Decimal] = None

    # First, determine if an abono will be made and its amount, to store it in the Pago record itself
    if pago.linea_credito_id_abono and pago.abono_porcentaje_linea_credito is not None:
        if not (0 < pago.abono_porcentaje_linea_credito <= 100):
            print(f"Advertencia: Porcentaje de abono ({pago.abono_porcentaje_linea_credito}%) fuera de rango (1-100). No se registrará el monto de abono en el pago.")
        else:
            # Ensure pago.monto is Decimal for calculation
            pago_monto_decimal = Decimal(str(pago.monto)) if not isinstance(pago.monto, Decimal) else pago.monto
            porcentaje_decimal = Decimal(str(pago.abono_porcentaje_linea_credito / 100.0))
            monto_total_abono_para_pago = pago_monto_decimal * porcentaje_decimal

    db_pago = models.Pago(
        cliente_id=pago.cliente_id,
        proyecto_keyword=pago.proyecto_keyword,
        monto=pago.monto, # This is the total amount of the payment received
        fecha_pago=pago.fecha_pago,
        metodo_pago=pago.metodo_pago,
        referencia=pago.referencia,
        notas=pago.notas,
        origen_pago=pago.origen_pago,
        monto_abono_linea_credito=monto_total_abono_para_pago # Store the calculated abono amount
    )
    db.add(db_pago)
    db.flush() # Flush to get db_pago.id if it's needed for descriptions, etc.

    created_linea_uso = None

    try:
        # Now, if an abono was calculated, create the LineaCreditoUso record
        if monto_total_abono_para_pago is not None and pago.linea_credito_id_abono:
            # This check ^ ensures we only proceed if monto_total_abono_para_pago was successfully calculated
            # and linea_credito_id_abono is available.
            
            # The existence of db_linea_credito check is still valuable if linea_credito_id_abono could be invalid
            db_linea_credito = get_linea_credito(db, pago.linea_credito_id_abono)
            if not db_linea_credito:
                # This situation should ideally be prevented by frontend validation or earlier checks.
                # If it occurs, the pago is created without an abono, and a warning is logged.
                print(f"Advertencia: Linea de credito ID {pago.linea_credito_id_abono} no encontrada. El pago ID {db_pago.id} se creó, pero no se realizará el abono.")
            else:
                # monto_usado for LineaCreditoUsoCreate should be negative for payments to the line
                monto_usado_for_schema = float(monto_total_abono_para_pago * Decimal('-1'))

                uso_credito_data = schemas.LineaCreditoUsoCreate(
                    fecha_uso=db_pago.fecha_pago,
                    monto_usado=monto_usado_for_schema, 
                    tipo_transaccion='ABONO_COBRO_CLIENTE',
                    descripcion=f"Abono del {pago.abono_porcentaje_linea_credito}% del pago ID {db_pago.id} (Cliente ID: {db_pago.cliente_id}) a línea de crédito.",
                    linea_credito_id=pago.linea_credito_id_abono,
                    pago_id=db_pago.id # Link the credit use to the payment
                )
                
                created_linea_uso = create_linea_credito_uso(db=db, uso_data=uso_credito_data, linea_credito_id=pago.linea_credito_id_abono)
                print(f"Abono de {monto_total_abono_para_pago:.2f} (registrado como {monto_usado_for_schema:.2f}) preparado para línea de crédito ID {pago.linea_credito_id_abono} para Pago ID {db_pago.id}.")

        db.commit()
        db.refresh(db_pago)
        if created_linea_uso: # If a uso was processed and committed
            db.refresh(created_linea_uso) # Refresh it to get its committed state (like ID)
            # The associated LineaCredito is part of the same session and its state is updated and committed.

    except HTTPException as e: # Catch HTTPExceptions from get_linea_credito or create_linea_credito_uso
        db.rollback()
        print(f"HTTPException durante el proceso de abono a línea de crédito: {e.detail}")
        # Re-raise the HTTPException to be handled by FastAPI
        raise e 
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error de SQLAlchemy al procesar el pago y/o abono: {e}")
        raise HTTPException(status_code=500, detail=f"Error de base de datos al procesar el pago: {str(e)}")
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        print(f"Error inesperado al procesar el pago y/o abono: {e}")
        raise HTTPException(status_code=500, detail=f"Error inesperado del servidor: {str(e)}")

    return db_pago

# Placeholder for update and delete later if needed
# def update_pago(db: Session, pago_id: int, pago_update: schemas.PagoUpdate) -> models.Pago:
#     db_pago = get_pago(db, pago_id)
#     if db_pago:
#         update_data = pago_update.model_dump(exclude_unset=True)
#         for key, value in update_data.items():
#             setattr(db_pago, key, value)
#         db.commit()
#         db.refresh(db_pago)
#     return db_pago

def delete_pago(db: Session, pago_id: int) -> models.Pago:
    """
    Deletes a payment and reverses any associated credit line transaction.
    """
    db_pago = get_pago(db, pago_id)
    if not db_pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    try:
        # Check if there is an associated credit line usage to reverse
        # The link is now explicit via pago_id
        associated_uso = db.query(models.LineaCreditoUso).filter(models.LineaCreditoUso.pago_id == pago_id).first()

        if associated_uso:
            # Get the parent credit line to update its balance
            linea_credito = db.query(models.LineaCredito).filter(models.LineaCredito.id == associated_uso.linea_credito_id).first()
            if linea_credito:
                # Reverse the transaction. Since 'ABONO_COBRO_CLIENTE' has a negative monto_usado,
                # subtracting it will correctly INCREASE the monto_disponible.
                monto_a_reversar = associated_uso.monto_usado
                linea_credito.monto_disponible -= monto_a_reversar # e.g., 500 - (-100) = 600
                db.add(linea_credito)

            # Delete the usage record itself
            db.delete(associated_uso)

        # Finally, delete the payment record
        db.delete(db_pago)
        
        db.commit()
        
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error de SQLAlchemy al eliminar el pago: {e}")
        raise HTTPException(status_code=500, detail=f"Error de base de datos al eliminar el pago: {str(e)}")
    except Exception as e:
        db.rollback()
        print(f"Error inesperado al eliminar el pago: {e}")
        raise HTTPException(status_code=500, detail=f"Error inesperado del servidor al eliminar el pago: {str(e)}")
    
    return db_pago

# def delete_pago(db: Session, pago_id: int) -> models.Pago:
#     db_pago = get_pago(db, pago_id)
#     if db_pago:
#         db.delete(db_pago)
#         db.commit()
#     return db_pago 