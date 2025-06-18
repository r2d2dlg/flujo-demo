from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime, date
from decimal import Decimal

from .. import crud_lineas_de_credito # Adjusted for router location
from .. import schemas # Adjusted for router location
from .. import models
from ..database import SessionLocal # Assuming SessionLocal is the way to get a session

router = APIRouter(
    prefix="/api/lineas-credito",
    tags=["Lineas de Credito"],
    responses={404: {"description": "Not found"}},
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.LineaCredito, status_code=201)
def create_linea_credito(
    linea_credito_data: schemas.LineaCreditoCreate,
    db: Session = Depends(get_db)
):
    return crud_lineas_de_credito.create_linea_credito(db=db, linea_credito_data=linea_credito_data)

@router.get("/", response_model=List[schemas.LineaCredito])
def list_lineas_credito(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_lineas_de_credito.list_lineas_credito(db=db, skip=skip, limit=limit)

@router.get("/ingresos-cashflow")
def get_ingresos_cashflow(db: Session = Depends(get_db)):
    """
    Get credit lines income cash flow projection for 39 months (3 before + 36 forward).
    Returns drawdowns (dispositions) by credit line and month for the Ingresos section.
    """
    try:
        # Get all credit lines with their uses
        lineas = crud_lineas_de_credito.list_lineas_credito(db=db, skip=0, limit=1000)
        
        # Generate 39 months: 3 before + 36 forward
        current_date = datetime.now()
        months = []
        
        # 3 months before
        for i in range(3, 0, -1):
            month_date = datetime(current_date.year, current_date.month, 1)
            if month_date.month - i <= 0:
                month_date = month_date.replace(year=month_date.year - 1, month=12 + (month_date.month - i))
            else:
                month_date = month_date.replace(month=month_date.month - i)
            months.append(month_date)
        
        # Current + 36 forward months
        for i in range(37):
            month_date = datetime(current_date.year, current_date.month, 1)
            if month_date.month + i > 12:
                years_ahead = (month_date.month + i - 1) // 12
                new_month = ((month_date.month + i - 1) % 12) + 1
                month_date = month_date.replace(year=month_date.year + years_ahead, month=new_month)
            else:
                month_date = month_date.replace(month=month_date.month + i)
            months.append(month_date)
        
        # Format month keys
        month_keys = [f"{month.year}_{month.month:02d}" for month in months]
        
        # Initialize result structure
        result = {
            "months": month_keys,
            "credit_lines": [],
            "totals_by_month": [0.0] * 39
        }
        
        # Calculate drawdowns for each credit line
        for linea in lineas:
            # Get uses for this credit line
            usos = crud_lineas_de_credito.list_linea_credito_usos(db=db, linea_credito_id=linea.id, skip=0, limit=1000)
            
            # Initialize monthly drawdowns for this credit line
            monthly_drawdowns = [0.0] * 39
            
            for month_idx, month_date in enumerate(months):
                # Ensure we don't go out of bounds
                if month_idx >= len(monthly_drawdowns):
                    break
                    
                # Process drawdowns for this month
                for uso in usos:
                    try:
                        uso_date = datetime.strptime(str(uso.fecha_uso), '%Y-%m-%d') if isinstance(uso.fecha_uso, str) else uso.fecha_uso
                        if (uso_date.year == month_date.year and uso_date.month == month_date.month and 
                            uso.tipo_transaccion == 'DRAWDOWN'):
                            monthly_drawdowns[month_idx] += float(uso.monto_usado)
                    except (ValueError, TypeError):
                        pass  # Skip if date parsing fails
            
            # Add to totals
            for i in range(39):
                if i < len(result["totals_by_month"]) and i < len(monthly_drawdowns):
                    result["totals_by_month"][i] += monthly_drawdowns[i]
            
            # Add credit line data to result
            result["credit_lines"].append({
                "id": linea.id,
                "nombre": linea.nombre,
                "monthly_drawdowns": monthly_drawdowns,
                "total": sum(monthly_drawdowns)
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating credit lines income: {str(e)}")

@router.get("/financial-costs-cashflow")
def get_financial_costs_cashflow(db: Session = Depends(get_db)):
    """
    Get financial costs cash flow projection for 39 months (3 before + 36 forward).
    Returns interest calculations and origination charges by month.
    """
    try:
        # Get all credit lines with their uses
        lineas = crud_lineas_de_credito.list_lineas_credito(db=db, skip=0, limit=1000)
        
        # Generate 39 months: 3 before + 36 forward
        current_date = datetime.now()
        months = []
        
        # 3 months before
        for i in range(3, 0, -1):
            month_date = datetime(current_date.year, current_date.month, 1)
            if month_date.month - i <= 0:
                month_date = month_date.replace(year=month_date.year - 1, month=12 + (month_date.month - i))
            else:
                month_date = month_date.replace(month=month_date.month - i)
            months.append(month_date)
        
        # Current + 36 forward months
        for i in range(37):
            month_date = datetime(current_date.year, current_date.month, 1)
            if month_date.month + i > 12:
                years_ahead = (month_date.month + i - 1) // 12
                new_month = ((month_date.month + i - 1) % 12) + 1
                month_date = month_date.replace(year=month_date.year + years_ahead, month=new_month)
            else:
                month_date = month_date.replace(month=month_date.month + i)
            months.append(month_date)
        
        # Initialize monthly data
        monthly_interest = [0.0] * 39
        monthly_origination_charges = [0.0] * 39
        monthly_client_payments = [0.0] * 39 # Specifically for ABONO_COBRO_CLIENTE
        
        # Calculate projections for each credit line
        for linea in lineas:
            # Get uses for this credit line
            usos = crud_lineas_de_credito.list_linea_credito_usos(db=db, linea_credito_id=linea.id, skip=0, limit=1000)
            
            # Track running balance for interest calculation - start at 0
            # Interest should only be calculated on actual outstanding balance from drawdowns
            running_balance = 0.0
            
            for month_idx, month_date in enumerate(months):
                # Ensure we don't go out of bounds
                if month_idx >= len(monthly_interest) or month_idx >= len(monthly_origination_charges):
                    break
                    
                # Process origination charges for this month
                try:
                    linea_inicio = datetime.strptime(str(linea.fecha_inicio), '%Y-%m-%d') if isinstance(linea.fecha_inicio, str) else linea.fecha_inicio
                    if (linea.cargos_apertura and float(linea.cargos_apertura) > 0 and 
                        linea_inicio.year == month_date.year and linea_inicio.month == month_date.month):
                        monthly_origination_charges[month_idx] += float(linea.cargos_apertura)
                except (ValueError, TypeError):
                    pass  # Skip if date parsing fails
                
                # Process uses for this month
                monthly_drawdowns = 0
                monthly_payments = 0 # This will include both PAYMENT and ABONO_COBRO_CLIENTE
                monthly_transaction_charges = 0
                
                for uso in usos:
                    try:
                        uso_date = datetime.strptime(str(uso.fecha_uso), '%Y-%m-%d') if isinstance(uso.fecha_uso, str) else uso.fecha_uso
                        if uso_date.year == month_date.year and uso_date.month == month_date.month:
                            if uso.tipo_transaccion == 'DRAWDOWN':
                                monthly_drawdowns += float(uso.monto_usado)
                                if uso.cargo_transaccion:
                                    monthly_transaction_charges += float(uso.cargo_transaccion)
                            elif uso.tipo_transaccion == 'PAYMENT' or uso.tipo_transaccion == 'ABONO_COBRO_CLIENTE':
                                # Abonos from clients are negative, take abs value. Payments are positive.
                                monthly_payments += abs(float(uso.monto_usado))
                                # Also add to the specific client payments list
                                if uso.tipo_transaccion == 'ABONO_COBRO_CLIENTE':
                                    if month_idx < len(monthly_client_payments):
                                        monthly_client_payments[month_idx] += abs(float(uso.monto_usado))

                    except (ValueError, TypeError):
                        pass  # Skip if date parsing fails
                
                # Calculate interest for the month on the BEGINNING balance (before this month's transactions)
                # Interest should only be charged on outstanding balance from previous months
                if linea.interest_rate and running_balance > 0:
                    monthly_rate = float(linea.interest_rate) / 100 / 12
                    interest_for_month = running_balance * monthly_rate
                    if month_idx < len(monthly_interest):
                        monthly_interest[month_idx] += interest_for_month
                
                # Update running balance after this month's transactions
                running_balance += monthly_drawdowns  # Add new drawdowns
                running_balance -= monthly_payments   # Subtract payments

        # Format month keys for the response
        month_keys = [f"{month.year}_{month.month:02d}" for month in months]

        return {
            "months": month_keys,
            "interest_costs": monthly_interest,
            "origination_charges": monthly_origination_charges,
            "client_payments": monthly_client_payments, # Return the specific client payments
            "totals": {
                "total_interest": sum(monthly_interest),
                "total_origination": sum(monthly_origination_charges),
                "total_client_payments": sum(monthly_client_payments)
            },
            # Aliases for frontend compatibility
            "intereses_bancarios": monthly_interest,
            "cargos_bancarios": monthly_origination_charges,
            "total_intereses": sum(monthly_interest),
            "total_cargos": sum(monthly_origination_charges)
        }
        
    except Exception as e:
        # It's good practice to log the exception
        # import logging
        # logging.exception("Error calculating financial costs cashflow")
        raise HTTPException(status_code=500, detail=f"Error calculating financial costs: {str(e)}")

@router.get("/{linea_id}", response_model=schemas.LineaCredito)
def get_linea_credito(linea_id: int, db: Session = Depends(get_db)):
    db_linea = crud_lineas_de_credito.get_linea_credito(db, linea_credito_id=linea_id)
    if db_linea is None:
        raise HTTPException(status_code=404, detail="Linea de credito no encontrada")
    return db_linea

@router.put("/{linea_id}", response_model=schemas.LineaCredito)
def update_linea_credito(
    linea_id: int,
    linea_update_data: schemas.LineaCreditoUpdate,
    db: Session = Depends(get_db)
):
    db_linea = crud_lineas_de_credito.update_linea_credito(db=db, linea_credito_id=linea_id, linea_update_data=linea_update_data)
    if db_linea is None:
        raise HTTPException(status_code=404, detail="Linea de credito no encontrada para actualizar")
    return db_linea

@router.delete("/{linea_id}", response_model=schemas.LineaCredito) # Or a simple Msg schema
def delete_linea_credito(
    linea_id: int,
    db: Session = Depends(get_db)
):
    db_linea = crud_lineas_de_credito.delete_linea_credito(db=db, linea_credito_id=linea_id)
    if db_linea is None:
        raise HTTPException(status_code=404, detail="Linea de credito no encontrada para eliminar")
    return db_linea # Returns the deleted object

@router.post("/{linea_id}/usos", response_model=schemas.LineaCreditoUso, status_code=201)
def record_linea_credito_uso(
    linea_id: int,
    uso_data: schemas.LineaCreditoUsoCreate,
    db: Session = Depends(get_db)
):
    try:
        db_uso = crud_lineas_de_credito.create_linea_credito_uso(
            db=db,
            uso_data=uso_data,
            linea_credito_id=linea_id
        )
        db.commit()
        db.refresh(db_uso)
        return db_uso
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        # It's good practice to log the error
        # import logging
        # logging.exception("Error recording credit line usage.")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@router.get("/{linea_id}/usos", response_model=List[schemas.LineaCreditoUso])
def list_linea_credito_usos(
    linea_id: int,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Check if linea_id exists first (optional, crud might do it)
    # db_linea = crud_lineas_de_credito.get_linea_credito(db, linea_credito_id=linea_id)
    # if db_linea is None:
    #     raise HTTPException(status_code=404, detail=f"Linea de credito con id {linea_id} no encontrada.")
    return crud_lineas_de_credito.list_linea_credito_usos(db=db, linea_credito_id=linea_id, skip=skip, limit=limit)

@router.delete("/usos/{uso_id}", response_model=schemas.LineaCreditoUso)
def delete_linea_credito_uso(
    uso_id: int,
    db: Session = Depends(get_db)
):
    """Delete a specific credit line usage by its ID"""
    db_uso = crud_lineas_de_credito.delete_linea_credito_uso(db=db, uso_id=uso_id)
    if db_uso is None:
        raise HTTPException(status_code=404, detail="Uso de línea de crédito no encontrado")
    return db_uso

# Endpoints will be added here 