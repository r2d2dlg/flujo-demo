from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal

from ..database import get_db
from ..models import LineaCreditoProyecto, LineaCreditoProyectoUso, ScenarioProject
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