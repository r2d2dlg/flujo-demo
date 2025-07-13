from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from ..database import get_db
from ..models import LineaCreditoProyecto, LineaCreditoProyectoUso, ScenarioProject, ProjectUnit
from ..schemas import (
    LineaCreditoProyecto as LineaCreditoProyectoSchema,
    LineaCreditoProyectoCreate,
    LineaCreditoProyectoUpdate,
    LineaCreditoProyectoUso as LineaCreditoProyectoUsoSchema,
    LineaCreditoProyectoUsoCreate,
    Msg
)

router = APIRouter()

# Project Credit Lines CRUD
@router.get("/scenario-projects/{project_id}/credit-lines", response_model=List[LineaCreditoProyectoSchema])
def get_project_credit_lines(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all credit lines for a specific project"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    credit_lines = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.scenario_project_id == project_id
    ).all()
    
    return credit_lines


@router.get("/scenario-projects/{project_id}/credit-lines/monthly-timeline")
async def get_credit_lines_monthly_timeline(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get monthly timeline showing credit line activity, interest, balances, and automatic payments from sales"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"=== CREDIT TIMELINE REQUEST for project {project_id} ===")
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all credit lines for the project
    credit_lines = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.scenario_project_id == project_id
    ).all()
    
    if not credit_lines:
        return {"timeline": [], "summary": {"total_lines": 0}}
    
    # Use the SAME enhanced cash flow data that powers "Flujo de Caja por Ventas (Proyección Activa)"
    try:
        logger.info(f"Fetching enhanced cash flow data for project {project_id}")
        
        # Import and call the same endpoint that the cash flow table uses
        from .scenario_projects import get_project_cash_flow_with_sales_projections
        enhanced_cash_flow_response = await get_project_cash_flow_with_sales_projections(project_id, db)
        
        if not enhanced_cash_flow_response.get("has_active_projection"):
            logger.info("No active sales projection found")
            return {"timeline": [], "summary": {"total_lines": 0, "error": "No active sales projection"}}
            
        enhanced_cash_flow_data = enhanced_cash_flow_response.get("cash_flow", [])
        logger.info(f"Found enhanced cash flow with {len(enhanced_cash_flow_data)} entries")
        
        # Get payment flows for automatic payment calculations
        projection_data = enhanced_cash_flow_response.get("projection_data", {})
        payment_flows = projection_data.get("payment_flows", [])
        logger.info(f"Found {len(payment_flows)} payment flows for automatic payment calculations")
        
    except Exception as e:
        logger.error(f"Error fetching enhanced cash flow data: {e}")
        import traceback
        traceback.print_exc()
        return {"timeline": [], "summary": {"total_lines": 0, "error": "Could not fetch enhanced cash flow data"}}
    
    # Get payment distribution configuration
    payment_config = project.payment_distribution_config or {}
    
    # Use the same timeline as the enhanced cash flow data ("Flujo de Caja por Ventas (Proyección Activa)")
    timeline = []
    
    # Initialize balances for each credit line
    credit_line_balances = {line.id: 0.0 for line in credit_lines}
    
    # Group enhanced cash flow data by period - SAME as Flujo de Caja por Ventas table
    cash_flow_by_period = {}
    for row in enhanced_cash_flow_data:
        period_label = row.get("period_label")
        if period_label not in cash_flow_by_period:
            cash_flow_by_period[period_label] = {
                "year": row.get("year"),
                "month": row.get("month"),
                "total_sales_revenue": 0.0,
                "separation_revenue": 0.0,
                "delivery_revenue": 0.0
            }
        
        # Accumulate revenues by type - EXACTLY matching cash flow table logic
        if row.get("row_type") == "INGRESO_POR_SEPARACION":
            cash_flow_by_period[period_label]["separation_revenue"] += float(row.get("ingresos_ventas", 0))
        elif row.get("row_type") == "INGRESO_POR_ENTREGA":
            cash_flow_by_period[period_label]["delivery_revenue"] += float(row.get("ingresos_ventas", 0))
        
        # Total sales revenue = separation + delivery (matching cash flow table)
        cash_flow_by_period[period_label]["total_sales_revenue"] = (
            cash_flow_by_period[period_label]["separation_revenue"] + 
            cash_flow_by_period[period_label]["delivery_revenue"]
        )
    
    logger.info(f"Processed enhanced cash flow into {len(cash_flow_by_period)} periods")
    
    # Calculate automatic payments from payment flows (same logic as sales simulation)
    monthly_automatic_payments = {}
    if payment_flows and payment_config:
        logger.info(f"Calculating automatic payments from {len(payment_flows)} payment flows")
        
        for flow in payment_flows:
            sale_month = flow.get("sale_month", 0)
            unit_number = flow.get("unit_number", "")
            
            # Calculate separation payment to credit lines
            separation_amount = Decimal(str(flow.get("separation_amount", 0)))
            credit_line_separation = Decimal(str(flow.get("credit_line_separation", 0)))
            
            # Calculate delivery payment to credit lines
            delivery_amount = Decimal(str(flow.get("delivery_amount", 0)))
            credit_line_delivery = Decimal(str(flow.get("credit_line_delivery", 0)))
            
            # Add separation payment in sale month
            if credit_line_separation > 0:
                if sale_month not in monthly_automatic_payments:
                    monthly_automatic_payments[sale_month] = 0.0
                monthly_automatic_payments[sale_month] += float(credit_line_separation)
            
            # Add delivery payment in delivery month (using same logic as enhanced cash flow)
            if credit_line_delivery > 0:
                # Use same delivery date calculation as enhanced cash flow
                delivery_month = sale_month + 12  # Fallback
                
                # Try to get actual delivery date if available
                if project.start_date:
                    units = db.query(ProjectUnit).filter(ProjectUnit.scenario_project_id == project_id).all()
                    for unit in units:
                        if unit.delivery_date and unit.unit_number == unit_number:
                            months_diff = ((unit.delivery_date.year - project.start_date.year) * 12) + (unit.delivery_date.month - project.start_date.month) + 1
                            delivery_month = months_diff
                            break
                    else:
                        # Use project delivery period logic if no specific date
                        if project.delivery_start_date and project.delivery_end_date:
                            delivery_start_month = ((project.delivery_start_date.year - project.start_date.year) * 12) + (project.delivery_start_date.month - project.start_date.month) + 1
                            delivery_end_month = ((project.delivery_end_date.year - project.start_date.year) * 12) + (project.delivery_end_date.month - project.start_date.month) + 1
                            
                            if sale_month < delivery_start_month:
                                delivery_month = delivery_start_month
                            elif sale_month > delivery_end_month:
                                delivery_month = sale_month
                            else:
                                # Distribute across delivery period
                                delivery_period_length = delivery_end_month - delivery_start_month + 1
                                unit_hash = hash(unit_number) if unit_number else hash(str(flow.get("unit_id", 0)))
                                delivery_offset = abs(unit_hash) % delivery_period_length
                                delivery_month = delivery_start_month + delivery_offset
                
                if delivery_month not in monthly_automatic_payments:
                    monthly_automatic_payments[delivery_month] = 0.0
                monthly_automatic_payments[delivery_month] += float(credit_line_delivery)
    
    # Convert month numbers to period labels for matching
    automatic_payments_by_period = {}
    if project.start_date:
        for month_num, payment_amount in monthly_automatic_payments.items():
            # Calculate period label from month number
            start_date = project.start_date
            target_date = date(start_date.year, start_date.month, 1)
            for _ in range(month_num - 1):
                if target_date.month == 12:
                    target_date = target_date.replace(year=target_date.year + 1, month=1)
                else:
                    target_date = target_date.replace(month=target_date.month + 1)
            
            period_label = f"{target_date.year}-{target_date.month:02d}"
            automatic_payments_by_period[period_label] = payment_amount
    
    # Process each period from enhanced cash flow
    for period_label, period_data in cash_flow_by_period.items():
        current_date = date(period_data["year"], period_data["month"], 1)
        
        timeline_month_data = {
            "year": period_data["year"],
            "month": period_data["month"],
            "period_label": period_label,
            "credit_lines": [],
            "total_withdrawals": 0.0,
            "total_payments": 0.0,
            "total_interest": 0.0,
            "total_balance": 0.0,
            "sales_revenue": period_data["total_sales_revenue"],  # MATCHES cash flow table exactly
            "automatic_payments": 0.0  # Will be calculated from individual line payments
        }
        
        logger.info(f"Period {period_label}: Sales revenue = {period_data['total_sales_revenue']}, Expected automatic payments = {automatic_payments_by_period.get(period_label, 0.0)}")
        
        for line in credit_lines:
            # Get usage records for this month and credit line
            month_start = current_date
            month_end = (current_date + relativedelta(months=1)) - timedelta(days=1)
            
            usage_records = db.query(LineaCreditoProyectoUso).filter(
                LineaCreditoProyectoUso.linea_credito_proyecto_id == line.id,
                LineaCreditoProyectoUso.fecha_uso >= month_start,
                LineaCreditoProyectoUso.fecha_uso <= month_end
            ).all()
            
            # Calculate monthly activity from manual usage records
            monthly_withdrawals = 0.0
            monthly_payments = 0.0
            monthly_transaction_charges = 0.0
            
            for usage in usage_records:
                amount = float(usage.monto_usado)
                if usage.tipo_transaccion == "DRAWDOWN":
                    monthly_withdrawals += amount
                    credit_line_balances[line.id] += amount
                elif usage.tipo_transaccion in ["PAYMENT", "ABONO_COBRO_CLIENTE"]:
                    monthly_payments += amount
                    credit_line_balances[line.id] -= amount
                
                # Add transaction charges if any
                if usage.cargo_transaccion:
                    monthly_transaction_charges += float(usage.cargo_transaccion)
            
            # Calculate automatic payment for this credit line from total automatic payments for this period
            automatic_payment_for_line = 0.0
            period_automatic_payments = automatic_payments_by_period.get(period_label, 0.0)
            if period_automatic_payments > 0 and credit_line_balances[line.id] > 0:
                total_outstanding = sum(max(0, balance) for balance in credit_line_balances.values())
                if total_outstanding > 0:
                    # Distribute payment proportionally based on outstanding balance
                    line_proportion = credit_line_balances[line.id] / total_outstanding
                    automatic_payment_for_line = period_automatic_payments * line_proportion
                    # Don't pay more than the outstanding balance
                    automatic_payment_for_line = min(automatic_payment_for_line, credit_line_balances[line.id])
                    
                    logger.debug(f"    Line {line.nombre}: balance={credit_line_balances[line.id]}, proportion={line_proportion}, payment={automatic_payment_for_line}")
                    
                    # Apply the automatic payment
                    monthly_payments += automatic_payment_for_line
                    credit_line_balances[line.id] -= automatic_payment_for_line
            
            # Calculate monthly interest on outstanding balance
            monthly_interest = 0.0
            if line.interest_rate and credit_line_balances[line.id] > 0:
                # Annual rate to monthly rate. Interest rate is stored as a decimal (e.g., 0.09 for 9%).
                monthly_rate = float(line.interest_rate) / 12
                monthly_interest = credit_line_balances[line.id] * monthly_rate
            
            # Add interest to balance (if not paid separately)
            credit_line_balances[line.id] += monthly_interest
            
            line_data = {
                "credit_line_id": line.id,
                "credit_line_name": line.nombre,
                "tipo_linea": line.tipo_linea,
                "withdrawals": monthly_withdrawals,
                "payments": monthly_payments,
                "automatic_payment": automatic_payment_for_line,
                "interest": monthly_interest,
                "transaction_charges": monthly_transaction_charges,
                "ending_balance": credit_line_balances[line.id],
                "available_credit": float(line.monto_total_linea) - credit_line_balances[line.id],
                "usage_records_count": len(usage_records)
            }
            
            timeline_month_data["credit_lines"].append(line_data)
            
            # Add to totals
            timeline_month_data["total_withdrawals"] += monthly_withdrawals
            timeline_month_data["total_payments"] += monthly_payments
            timeline_month_data["total_interest"] += monthly_interest
            timeline_month_data["automatic_payments"] += automatic_payment_for_line
        
        # Calculate total balance across all credit lines
        timeline_month_data["total_balance"] = sum(credit_line_balances.values())
        
        timeline.append(timeline_month_data)
    
    # Calculate summary statistics
    summary = {
        "total_lines": len(credit_lines),
        "total_credit_limit": sum(float(line.monto_total_linea) for line in credit_lines),
        "final_total_balance": sum(credit_line_balances.values()),
        "total_interest_projected": sum(month["total_interest"] for month in timeline),
        "total_withdrawals_projected": sum(month["total_withdrawals"] for month in timeline),
        "total_payments_projected": sum(month["total_payments"] for month in timeline),
        "total_automatic_payments_projected": sum(month["automatic_payments"] for month in timeline),
        "total_sales_revenue_projected": sum(month["sales_revenue"] for month in timeline),
        "timeline_months": len(timeline),
        "payment_distribution_config": payment_config,
        "project_info": {
            "project_start_date": project.start_date.isoformat() if project.start_date else None,
            "project_end_date": project.end_date.isoformat() if project.end_date else None,
            "delivery_start_date": project.delivery_start_date.isoformat() if project.delivery_start_date else None,
            "delivery_end_date": project.delivery_end_date.isoformat() if project.delivery_end_date else None
        },
        "credit_lines_detail": [
            {
                "id": line.id,
                "name": line.nombre,
                "total_limit": float(line.monto_total_linea),
                "final_balance": credit_line_balances[line.id],
                "available_credit": float(line.monto_total_linea) - credit_line_balances[line.id],
                "interest_rate": float(line.interest_rate) if line.interest_rate else 0.0
            }
            for line in credit_lines
        ]
    }
    
    return {
        "timeline": timeline,
        "summary": summary
    }

@router.post("/scenario-projects/{project_id}/credit-lines", response_model=LineaCreditoProyectoSchema)
def create_project_credit_line(
    project_id: int,
    credit_line: LineaCreditoProyectoCreate,
    db: Session = Depends(get_db)
):
    """Create a new credit line for a project"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create the credit line
    credit_line_data = credit_line.dict(exclude={'scenario_project_id'})
    
    # Set monto_disponible to equal monto_total_linea initially
    credit_line_data['monto_disponible'] = credit_line_data['monto_total_linea']
    
    db_credit_line = LineaCreditoProyecto(
        scenario_project_id=project_id,
        **credit_line_data
    )
    
    # Set default values
    if not db_credit_line.tipo_linea:
        db_credit_line.tipo_linea = "LINEA_CREDITO"
    if not db_credit_line.moneda:
        db_credit_line.moneda = "USD"
    if not db_credit_line.estado:
        db_credit_line.estado = "ACTIVA"
    
    # For projects in DRAFT status, mark as simulation
    if db_credit_line.es_simulacion is None:
        db_credit_line.es_simulacion = (project.status in ["DRAFT", "PLANNING"])
    
    db.add(db_credit_line)
    db.commit()
    db.refresh(db_credit_line)
    
    return db_credit_line


@router.get("/scenario-projects/{project_id}/credit-lines/{credit_line_id}", response_model=LineaCreditoProyectoSchema)
def get_project_credit_line(
    project_id: int,
    credit_line_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific credit line for a project"""
    credit_line = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.id == credit_line_id,
        LineaCreditoProyecto.scenario_project_id == project_id
    ).first()
    
    if not credit_line:
        raise HTTPException(status_code=404, detail="Credit line not found")
    
    return credit_line


@router.put("/scenario-projects/{project_id}/credit-lines/{credit_line_id}", response_model=LineaCreditoProyectoSchema)
def update_project_credit_line(
    project_id: int,
    credit_line_id: int,
    credit_line_update: LineaCreditoProyectoUpdate,
    db: Session = Depends(get_db)
):
    """Update a project credit line"""
    credit_line = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.id == credit_line_id,
        LineaCreditoProyecto.scenario_project_id == project_id
    ).first()
    
    if not credit_line:
        raise HTTPException(status_code=404, detail="Credit line not found")
    
    # Update fields
    update_data = credit_line_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(credit_line, field, value)
    
    # Recalculate available amount if total amount changed
    if 'monto_total_linea' in update_data:
        # Calculate used amount from usage records
        used_amount = db.query(
            db.func.coalesce(db.func.sum(LineaCreditoProyectoUso.monto_usado), 0)
        ).filter(
            LineaCreditoProyectoUso.linea_credito_proyecto_id == credit_line_id
        ).scalar()
        
        credit_line.monto_disponible = credit_line.monto_total_linea - used_amount
    
    db.commit()
    db.refresh(credit_line)
    
    return credit_line


@router.delete("/scenario-projects/{project_id}/credit-lines/{credit_line_id}", response_model=Msg)
def delete_project_credit_line(
    project_id: int,
    credit_line_id: int,
    db: Session = Depends(get_db)
):
    """Delete a project credit line"""
    credit_line = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.id == credit_line_id,
        LineaCreditoProyecto.scenario_project_id == project_id
    ).first()
    
    if not credit_line:
        raise HTTPException(status_code=404, detail="Credit line not found")
    
    db.delete(credit_line)
    db.commit()
    
    return {"message": "Credit line deleted successfully"}


# Credit Line Usage CRUD
@router.get("/scenario-projects/{project_id}/credit-lines/{credit_line_id}/usage", response_model=List[LineaCreditoProyectoUsoSchema])
def get_credit_line_usage(
    project_id: int,
    credit_line_id: int,
    db: Session = Depends(get_db)
):
    """Get usage records for a credit line"""
    # Verify credit line exists and belongs to project
    credit_line = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.id == credit_line_id,
        LineaCreditoProyecto.scenario_project_id == project_id
    ).first()
    
    if not credit_line:
        raise HTTPException(status_code=404, detail="Credit line not found")
    
    usage_records = db.query(LineaCreditoProyectoUso).filter(
        LineaCreditoProyectoUso.linea_credito_proyecto_id == credit_line_id
    ).order_by(LineaCreditoProyectoUso.fecha_uso.desc()).all()
    
    return usage_records


@router.post("/scenario-projects/{project_id}/credit-lines/{credit_line_id}/usage", response_model=LineaCreditoProyectoUsoSchema)
def create_credit_line_usage(
    project_id: int,
    credit_line_id: int,
    usage: LineaCreditoProyectoUsoCreate,
    db: Session = Depends(get_db)
):
    """Create a new usage record for a credit line"""
    # Verify credit line exists and belongs to project
    credit_line = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.id == credit_line_id,
        LineaCreditoProyecto.scenario_project_id == project_id
    ).first()
    
    if not credit_line:
        raise HTTPException(status_code=404, detail="Credit line not found")
    
    # Convert amount to Decimal for database operations
    from decimal import Decimal
    monto_decimal = Decimal(str(usage.monto_usado))
    
    # Check if sufficient funds available for drawdown
    if usage.tipo_transaccion == "DRAWDOWN" and usage.monto_usado > 0:
        if monto_decimal > credit_line.monto_disponible:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient funds. Available: {credit_line.monto_disponible}, Requested: {monto_decimal}"
            )
    
    # Create usage record
    db_usage = LineaCreditoProyectoUso(
        linea_credito_proyecto_id=credit_line_id,
        **usage.dict(exclude={'linea_credito_proyecto_id'})
    )
    
    # Set simulation flag based on project status
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    db_usage.es_simulacion = (project.status == "DRAFT")
    
    db.add(db_usage)
    
    # Update available amount in credit line
    if usage.tipo_transaccion == "DRAWDOWN":
        credit_line.monto_disponible -= monto_decimal
    elif usage.tipo_transaccion == "PAYMENT":
        credit_line.monto_disponible += monto_decimal
    
    db.commit()
    db.refresh(db_usage)
    
    return db_usage


@router.delete("/scenario-projects/{project_id}/credit-lines/{credit_line_id}/usage/{usage_id}", response_model=Msg)
def delete_credit_line_usage(
    project_id: int,
    credit_line_id: int,
    usage_id: int,
    db: Session = Depends(get_db)
):
    """Delete a specific usage record for a credit line"""
    # Verify credit line exists and belongs to project
    credit_line = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.id == credit_line_id,
        LineaCreditoProyecto.scenario_project_id == project_id
    ).first()
    
    if not credit_line:
        raise HTTPException(status_code=404, detail="Credit line not found")
    
    # Find the usage record
    usage_record = db.query(LineaCreditoProyectoUso).filter(
        LineaCreditoProyectoUso.id == usage_id,
        LineaCreditoProyectoUso.linea_credito_proyecto_id == credit_line_id
    ).first()
    
    if not usage_record:
        raise HTTPException(status_code=404, detail="Usage record not found")
    
    # Convert amount to Decimal for database operations
    from decimal import Decimal
    monto_decimal = Decimal(str(usage_record.monto_usado))
    
    # Reverse the effect on available amount
    if usage_record.tipo_transaccion == "DRAWDOWN":
        credit_line.monto_disponible += monto_decimal
    elif usage_record.tipo_transaccion == "PAYMENT":
        credit_line.monto_disponible -= monto_decimal
    
    # Delete the usage record
    db.delete(usage_record)
    db.commit()
    
    return {"message": "Usage record deleted successfully"}


@router.get("/scenario-projects/{project_id}/credit-lines/summary")
def get_project_credit_lines_summary(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get summary of all credit lines for a project"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    credit_lines = db.query(LineaCreditoProyecto).filter(
        LineaCreditoProyecto.scenario_project_id == project_id
    ).all()
    
    summary = {
        "total_lines": len(credit_lines),
        "total_credit_amount": sum(line.monto_total_linea for line in credit_lines),
        "total_available_amount": sum(line.monto_disponible for line in credit_lines),
        "total_used_amount": sum(line.monto_total_linea - line.monto_disponible for line in credit_lines),
        "lines_by_type": {},
        "lines_by_status": {}
    }
    
    # Group by type and status
    for line in credit_lines:
        # By type
        if line.tipo_linea not in summary["lines_by_type"]:
            summary["lines_by_type"][line.tipo_linea] = {
                "count": 0,
                "total_amount": 0,
                "available_amount": 0
            }
        summary["lines_by_type"][line.tipo_linea]["count"] += 1
        summary["lines_by_type"][line.tipo_linea]["total_amount"] += line.monto_total_linea
        summary["lines_by_type"][line.tipo_linea]["available_amount"] += line.monto_disponible
        
        # By status
        if line.estado not in summary["lines_by_status"]:
            summary["lines_by_status"][line.estado] = {
                "count": 0,
                "total_amount": 0,
                "available_amount": 0
            }
        summary["lines_by_status"][line.estado]["count"] += 1
        summary["lines_by_status"][line.estado]["total_amount"] += line.monto_total_linea
        summary["lines_by_status"][line.estado]["available_amount"] += line.monto_disponible
    
    return summary


@router.post("/scenario-projects/{project_id}/credit-lines/calculate-requirements")
def calculate_credit_requirements(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Calculate recommended credit line requirements based on project costs"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Calculate total project costs
    total_costs = sum(float(item.monto_proyectado or 0) for item in project.cost_items)
    
    # Calculate financing needs by category
    financing_needs = {
        "terreno": 0,
        "construccion": 0,
        "capital_trabajo": 0,
        "contingencia": 0
    }
    
    for item in project.cost_items:
        cost = float(item.monto_proyectado or 0)
        if item.categoria.lower() == "terreno":
            financing_needs["terreno"] += cost
        elif item.categoria.lower() in ["costos duros", "costos blandos"]:
            financing_needs["construccion"] += cost
        elif item.categoria.lower() == "contingencia":
            financing_needs["contingencia"] += cost
    
    # Calculate working capital (10% of construction costs)
    financing_needs["capital_trabajo"] = float(financing_needs["construccion"]) * 0.10
    
    # Recommend credit line structure
    recommendations = []
    
    # Land acquisition line (if needed)
    if financing_needs["terreno"] > 0:
        recommendations.append({
            "tipo_linea": "PRESTAMO_HIPOTECARIO",
            "proposito": "Adquisición de terreno",
            "monto_recomendado": financing_needs["terreno"],
            "plazo_meses": 60,  # 5 years
            "garantia_tipo": "Hipotecaria",
            "justificacion": "Línea específica para adquisición del terreno con garantía hipotecaria"
        })
    
    # Construction line
    if financing_needs["construccion"] > 0:
        recommendations.append({
            "tipo_linea": "LINEA_CREDITO",
            "proposito": "Financiamiento de construcción",
            "monto_recomendado": financing_needs["construccion"] + financing_needs["capital_trabajo"],
            "plazo_meses": 36,  # 3 years
            "garantia_tipo": "Proyecto en construcción",
            "justificacion": "Línea revolvente para financiar costos de construcción y capital de trabajo"
        })
    
    # Contingency line
    if financing_needs["contingencia"] > 0:
        recommendations.append({
            "tipo_linea": "SOBREGIRO",
            "proposito": "Contingencias e imprevistos",
            "monto_recomendado": financing_needs["contingencia"],
            "plazo_meses": 12,
            "garantia_tipo": "Garantía corporativa",
            "justificacion": "Línea de contingencia para cubrir imprevistos del proyecto"
        })
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_project_cost": total_costs,
        "financing_breakdown": financing_needs,
        "total_financing_needed": sum(financing_needs.values()),
        "recommended_credit_lines": recommendations,
        "financing_ratio": (sum(financing_needs.values()) / total_costs * 100) if total_costs > 0 else 0
    }