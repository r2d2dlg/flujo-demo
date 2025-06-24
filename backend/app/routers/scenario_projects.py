from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func, case
from typing import List, Optional, Dict, Any
from decimal import Decimal
import numpy as np
from datetime import datetime, date, timedelta
import math
import pandas as pd
import io
from pydantic import BaseModel

from ..database import get_db
from ..models import (
    ScenarioProject, CostCategory, ScenarioCostItem, 
    ScenarioCashFlow, SensitivityAnalysis, ProjectFinancialMetrics,
    ProjectUnit, ProjectStage, LineaCreditoProyecto
)
from ..schemas import (
    ScenarioProject as ScenarioProjectSchema,
    ScenarioProjectCreate, ScenarioProjectUpdate, ScenarioProjectWithDetails,
    ScenarioProjectsListResponse, ScenarioProjectSummary,
    CostCategory as CostCategorySchema, CostCategoryCreate,
    ScenarioCostItem as ScenarioCostItemSchema,
    ScenarioCostItemCreate, ScenarioCostItemUpdate,
    ProjectFinancialMetrics as ProjectFinancialMetricsSchema,
    FinancialCalculationRequest, FinancialCalculationResponse,
    SensitivityAnalysisRequest, SensitivityAnalysis as SensitivityAnalysisSchema,
    SalesSimulationRequest, SalesSimulationResponse, SalesScenarioConfig,
    SalesScenarioMetrics, CompanyLiquidityAnalysis,
    ProjectUnit as ProjectUnitSchema, ProjectUnitsStats,
    ProjectUnitCreateRequest, ProjectUnitUpdate, ProjectUnitsBulkCreate,
    LineaCreditoProyecto as LineaCreditoProyectoSchema, PaymentDistributionConfig,
    UnitSalesScenarioConfig, UnitSalesPaymentFlow, UnitSalesSimulationRequest,
    UnitSalesSimulationResponse, UnitSalesScenarioMetrics,
    ProjectStage as ProjectStageSchema, ProjectStageCreate, ProjectStageUpdate, ProjectStageWithSubStages, ProjectStageTemplateResponse, ProjectTimelineResponse,
    ProjectStatusTransitionsResponse, ProjectTransitionResponse, ProjectRejectionRequest
)
from ..crud_sales_projections import (
    create_sales_projection, get_sales_projections_by_project, 
    get_active_sales_projection, update_sales_projection, 
    delete_sales_projection, set_active_projection
)
from ..schemas import (
    SalesProjectionCreate, SalesProjection, SalesProjectionUpdate, 
    SalesProjectionWithImpact
)

router = APIRouter(
    prefix="/api/scenario-projects",
    tags=["scenario-projects"],
    responses={404: {"description": "Not found"}},
)

class CreateDefaultStagesRequest(BaseModel):
    project_type: str = 'RESIDENTIAL'

# --- Scenario Projects CRUD ---

# OPTIONS handlers for CORS preflight
@router.options("/")
async def options_list_projects():
    """Handle CORS preflight for list projects"""
    return {"message": "OK"}

@router.options("/{project_id}")
async def options_get_project(project_id: int):
    """Handle CORS preflight for get project"""
    return {"message": "OK"}



@router.get("/", response_model=ScenarioProjectsListResponse)
async def list_scenario_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Listar todos los proyectos de escenario con métricas básicas"""
    query = db.query(ScenarioProject)
    
    if status:
        query = query.filter(ScenarioProject.status == status)
    
    # Get projects with financial metrics
    projects = query.options(
        joinedload(ScenarioProject.cost_items),
    ).offset(skip).limit(limit).all()
    
    total = query.count()
    
    # Get financial metrics for each project
    project_summaries = []
    for project in projects:
        metrics = db.query(ProjectFinancialMetrics).filter(
            ProjectFinancialMetrics.scenario_project_id == project.id
        ).first()
        
        summary = ScenarioProjectSummary(
            id=project.id,
            name=project.name,
            description=project.description,
            location=project.location,
            status=project.status,
            total_units=project.total_units,
            target_price_per_m2=project.target_price_per_m2,
            npv=metrics.npv if metrics else None,
            irr=metrics.irr if metrics else None,
            created_at=project.created_at,
            updated_at=project.updated_at
        )
        project_summaries.append(summary)
    
    return ScenarioProjectsListResponse(projects=project_summaries, total=total)

@router.get("/consolidated/cash-flow-impact")
def get_consolidated_scenario_projects_cash_flow_impact(
    db: Session = Depends(get_db)
):
    """
    Obtener el impacto consolidado en el flujo de caja de todos los proyectos escenario aprobados.
    """
    try:
        # Get all active scenario projects (ACTIVE status)
        projects = db.query(ScenarioProject).filter(
            ScenarioProject.status == "ACTIVE"
        ).all()
        
        # Initialize consolidated data
        consolidated_ingresos = [0.0] * 39
        consolidated_egresos = [0.0] * 39
        total_ingresos = 0.0
        total_egresos = 0.0
        project_details = []
        
        # Process each active project
        for project in projects:
            try:
                # Get project cash flow impact
                project_cash_flows = db.query(ScenarioCashFlow).filter(
                    ScenarioCashFlow.scenario_project_id == project.id
                ).order_by(ScenarioCashFlow.year, ScenarioCashFlow.month).all()
                
                project_ingresos = [0.0] * 39
                project_egresos = [0.0] * 39
                
                for i, cash_flow in enumerate(project_cash_flows[:39]):
                    if cash_flow.total_ingresos and cash_flow.total_ingresos > 0:
                        project_ingresos[i] = float(cash_flow.total_ingresos)
                        consolidated_ingresos[i] += float(cash_flow.total_ingresos)
                        total_ingresos += float(cash_flow.total_ingresos)
                    
                    if cash_flow.total_egresos and cash_flow.total_egresos > 0:
                        project_egresos[i] = float(cash_flow.total_egresos)
                        consolidated_egresos[i] += float(cash_flow.total_egresos)
                        total_egresos += float(cash_flow.total_egresos)
                
                project_details.append({
                    "project_id": project.id,
                    "project_name": project.name,
                    "project_status": project.status,
                    "ingresos_by_month": project_ingresos,
                    "egresos_by_month": project_egresos,
                    "total_ingresos_proyecto": sum(project_ingresos),
                    "total_egresos_proyecto": sum(project_egresos)
                })
                
            except Exception as e:
                print(f"Error processing project {project.id}: {str(e)}")
                continue
        
        return {
            "projects": project_details,
            "consolidated_cash_flow": {
                "total_ingresos_by_month": consolidated_ingresos,
                "total_egresos_by_month": consolidated_egresos,
                "total_ingresos": total_ingresos,
                "total_egresos": total_egresos,
                "flujo_neto_total": total_ingresos - total_egresos,
                "projects_count": len(projects)
            }
        }
        
    except Exception as e:
        print(f"Error in consolidated cash flow impact: {str(e)}")
        # Return empty data structure on error
        return {
            "projects": [],
            "consolidated_cash_flow": {
                "total_ingresos_by_month": [0.0] * 39,
                "total_egresos_by_month": [0.0] * 39,
                "total_ingresos": 0.0,
                "total_egresos": 0.0,
                "flujo_neto_total": 0.0,
                "projects_count": 0
            }
        }



@router.post("/", response_model=ScenarioProjectSchema)
async def create_scenario_project(
    project: ScenarioProjectCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo proyecto de escenario"""
    db_project = ScenarioProject(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Initialize with default cost categories for Panama
    await initialize_default_cost_categories(db_project.id, db)
    
    return db_project

@router.get("/{project_id}", response_model=ScenarioProjectWithDetails)
async def get_scenario_project(project_id: int, db: Session = Depends(get_db)):
    """Obtener un proyecto de escenario específico con todos sus detalles"""
    project = db.query(ScenarioProject).options(
        joinedload(ScenarioProject.cost_items)
    ).filter(ScenarioProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get financial metrics
    metrics = db.query(ProjectFinancialMetrics).filter(
        ProjectFinancialMetrics.scenario_project_id == project_id
    ).first()
    
    project_data = ScenarioProjectWithDetails(
        id=project.id,
        name=project.name,
        description=project.description,
        location=project.location,
        status=project.status,
        total_area_m2=project.total_area_m2,
        buildable_area_m2=project.buildable_area_m2,
        total_units=project.total_units,
        avg_unit_size_m2=project.avg_unit_size_m2,
        target_price_per_m2=project.target_price_per_m2,
        expected_sales_period_months=project.expected_sales_period_months,
        discount_rate=project.discount_rate,
        inflation_rate=project.inflation_rate,
        contingency_percentage=project.contingency_percentage,
        created_by=project.created_by,
        created_at=project.created_at,
        updated_at=project.updated_at,
        cost_items=[ScenarioCostItemSchema.model_validate(item) for item in project.cost_items],
        total_investment=metrics.total_investment if metrics else None,
        total_revenue=metrics.total_revenue if metrics else None,
        npv=metrics.npv if metrics else None,
        irr=metrics.irr if metrics else None
    )
    
    return project_data

@router.put("/{project_id}")
def update_scenario_project(
    project_id: int,
    project_update: ScenarioProjectUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar proyecto de escenario"""
    db_project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, field, value)
    
    db_project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_project)
    
    return db_project

# --- Project Units Endpoints ---

@router.get("/{project_id}/units", response_model=List[ProjectUnitSchema])
def get_project_units(project_id: int, db: Session = Depends(get_db)):
    """
    Get all units for a specific scenario project.
    """
    units = db.query(ProjectUnit).filter(ProjectUnit.scenario_project_id == project_id).all()
    # No need to check for not units, an empty list is a valid response
    return units

@router.get("/{project_id}/units/stats", response_model=ProjectUnitsStats)
def get_project_units_stats(project_id: int, db: Session = Depends(get_db)):
    """
    Get statistics for the units of a specific scenario project.
    """
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto de escenario no encontrado")

    stats = db.query(
        func.count(ProjectUnit.id).label("total_units"),
        func.sum(case((ProjectUnit.status == 'SOLD', 1), else_=0)).label("sold_units"),
        func.sum(case((ProjectUnit.status == 'AVAILABLE', 1), else_=0)).label("available_units"),
        func.sum(case((ProjectUnit.status == 'RESERVED', 1), else_=0)).label("reserved_units"),
        func.sum(ProjectUnit.target_price_total).label("total_value"),
        func.sum(case((ProjectUnit.status == 'SOLD', ProjectUnit.sale_price), else_=ProjectUnit.target_price_total)).label("sold_value")
    ).filter(ProjectUnit.scenario_project_id == project_id).one()

    total_units = stats.total_units or 0
    sold_units = stats.sold_units or 0
    total_value = float(stats.total_value or 0)
    sold_value = float(stats.sold_value or 0)

    # Handle division by zero
    average_price = sold_value / sold_units if sold_units > 0 else 0

    return {
        "total_units": total_units,
        "sold_units": sold_units,
        "available_units": stats.available_units or 0,
        "reserved_units": stats.reserved_units or 0,
        "total_value": total_value,
        "sold_value": sold_value,
        "average_price": average_price
    }

@router.post("/{project_id}/units", response_model=ProjectUnitSchema)
def create_project_unit(
    project_id: int, 
    unit_data: ProjectUnitCreateRequest, 
    db: Session = Depends(get_db)
):
    """
    Create a new unit for a specific scenario project.
    """
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto de escenario no encontrado")
    
    # Create the unit
    unit_dict = unit_data.dict()
    unit_dict['scenario_project_id'] = project_id  # Set from URL parameter
    
    db_unit = ProjectUnit(**unit_dict)
    
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    
    return db_unit

@router.put("/{project_id}/units/{unit_id}", response_model=ProjectUnitSchema)
def update_project_unit(
    project_id: int,
    unit_id: int,
    unit_data: ProjectUnitUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a specific unit.
    """
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto de escenario no encontrado")
    
    # Get the unit
    db_unit = db.query(ProjectUnit).filter(
        ProjectUnit.id == unit_id,
        ProjectUnit.scenario_project_id == project_id
    ).first()
    
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    
    # Update the unit
    for field, value in unit_data.dict(exclude_unset=True).items():
        setattr(db_unit, field, value)
    
    db.commit()
    db.refresh(db_unit)
    
    return db_unit

@router.delete("/{project_id}/units/{unit_id}")
def delete_project_unit(
    project_id: int,
    unit_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a specific unit.
    """
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto de escenario no encontrado")
    
    # Get the unit
    db_unit = db.query(ProjectUnit).filter(
        ProjectUnit.id == unit_id,
        ProjectUnit.scenario_project_id == project_id
    ).first()
    
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    
    db.delete(db_unit)
    db.commit()
    
    return {"message": "Unidad eliminada exitosamente"}

@router.post("/{project_id}/units/bulk", response_model=List[ProjectUnitSchema])
def create_units_bulk(
    project_id: int,
    bulk_data: ProjectUnitsBulkCreate,
    db: Session = Depends(get_db)
):
    """
    Create multiple units at once for a scenario project.
    """
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto de escenario no encontrado")
    
    created_units = []
    
    for i in range(bulk_data.quantity):
        unit_number = f"{bulk_data.unit_prefix}{bulk_data.starting_number + i:03d}" if bulk_data.unit_prefix else f"Unit-{bulk_data.starting_number + i:03d}"
        
        db_unit = ProjectUnit(
            scenario_project_id=project_id,
            unit_number=unit_number,
            unit_type=bulk_data.unit_type,
            floor_number=bulk_data.floor_number,
            area_m2=bulk_data.area_m2,
            bedrooms=bulk_data.bedrooms,
            bathrooms=bulk_data.bathrooms,
            parking_spaces=bulk_data.parking_spaces,
            storage_included=bulk_data.storage_included,
            balcony_area_m2=bulk_data.balcony_area_m2,
            target_price_per_m2=bulk_data.target_price_per_m2,
            target_price_total=bulk_data.area_m2 * bulk_data.target_price_per_m2 if bulk_data.target_price_per_m2 else None,
            status='AVAILABLE',
            notes=bulk_data.notes
        )
        
        db.add(db_unit)
        created_units.append(db_unit)
    
    db.commit()
    
    # Refresh all units
    for unit in created_units:
        db.refresh(unit)
    
    return created_units

@router.post("/{project_id}/approve", response_model=ProjectTransitionResponse)
def approve_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Aprobar proyecto desde UNDER_REVIEW y crear línea base (baseline) de las proyecciones"""
    
    # Get project
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status == "APPROVED":
        raise HTTPException(status_code=400, detail="El proyecto ya está aprobado")
    
    if project.status != "UNDER_REVIEW":
        raise HTTPException(status_code=400, detail=f"Solo se pueden aprobar proyectos en estado UNDER_REVIEW. Estado actual: {project.status}")
    
    try:
        # 1. Create baseline snapshot of cost items
        cost_items = db.query(ScenarioCostItem).filter(
            ScenarioCostItem.scenario_project_id == project_id,
            ScenarioCostItem.is_active == True
        ).all()
        
        # Create baseline records for each cost item
        for item in cost_items:
            # Calculate actual projected cost based on type
            actual_projected_cost = item.monto_proyectado or 0
            if item.base_costo == 'por m²' and item.unit_cost and project.total_units and project.avg_unit_size_m2:
                actual_projected_cost = float(item.unit_cost) * float(project.total_units) * float(project.avg_unit_size_m2)
            elif item.base_costo == 'por unidad' and item.unit_cost and project.total_units:
                actual_projected_cost = float(item.unit_cost) * float(project.total_units)
            
            # Create baseline record
            baseline_item = ScenarioCostItem(
                scenario_project_id=project_id,
                categoria=item.categoria + " (BASELINE)",
                subcategoria=item.subcategoria,
                partida_costo=item.partida_costo + " - Proyección Inicial",
                base_costo="BASELINE",
                monto_proyectado=actual_projected_cost,
                unit_cost=item.unit_cost,
                quantity=item.quantity,
                percentage_of_base=item.percentage_of_base,
                base_reference=item.base_reference,
                start_month=item.start_month,
                duration_months=item.duration_months,
                notes=f"BASELINE creado al aprobar proyecto. Original: {item.notes or ''}",
                is_active=False,  # Baseline items are for reference only
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(baseline_item)
        
        # 2. Create baseline snapshot of cash flow
        cash_flows = db.query(ScenarioCashFlow).filter(
            ScenarioCashFlow.scenario_project_id == project_id
        ).all()
        
        for cf in cash_flows:
            baseline_cf = ScenarioCashFlow(
                scenario_project_id=project_id,
                year=cf.year,
                month=cf.month,
                period_label=cf.period_label + " (BASELINE)",
                ingresos_ventas=cf.ingresos_ventas,
                total_ingresos=cf.total_ingresos,
                costos_terreno=cf.costos_terreno,
                costos_duros=cf.costos_duros,
                costos_blandos=cf.costos_blandos,
                costos_financiacion=cf.costos_financiacion,
                costos_marketing=cf.costos_marketing,
                total_egresos=cf.total_egresos,
                flujo_neto=cf.flujo_neto,
                flujo_acumulado=cf.flujo_acumulado,
                flujo_descontado=cf.flujo_descontado,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(baseline_cf)
        
        # 3. Update project status to APPROVED
        project.status = "APPROVED"
        project.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Proyecto aprobado exitosamente. Línea base creada para seguimiento.",
            "project_id": project_id,
            "new_status": "APPROVED",
            "baseline_items_created": len(cost_items),
            "baseline_cashflow_created": len(cash_flows)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al aprobar proyecto: {str(e)}")

@router.post("/{project_id}/reject", response_model=ProjectTransitionResponse)
def reject_project(
    project_id: int,
    rejection_data: ProjectRejectionRequest,
    db: Session = Depends(get_db)
):
    """Rechazar proyecto desde UNDER_REVIEW de vuelta a DRAFT"""
    
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status != "UNDER_REVIEW":
        raise HTTPException(status_code=400, detail=f"Solo se pueden rechazar proyectos en estado UNDER_REVIEW. Estado actual: {project.status}")
    
    try:
        project.status = "DRAFT"
        project.updated_at = datetime.utcnow()
        
        # Agregar nota de rechazo si se proporciona
        if rejection_data.reason:
            existing_notes = project.description or ""
            rejection_note = f"\n\n[RECHAZADO - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}]: {rejection_data.reason}"
            project.description = existing_notes + rejection_note
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Proyecto rechazado y devuelto a DRAFT. {rejection_data.reason if rejection_data.reason else 'Sin razón específica.'}",
            "project_id": project_id,
            "new_status": "DRAFT"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al rechazar proyecto: {str(e)}")

@router.post("/{project_id}/activate", response_model=ProjectTransitionResponse)
def activate_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Activar proyecto aprobado - comenzar ejecución"""
    
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Solo se pueden activar proyectos APPROVED. Estado actual: {project.status}")
    
    try:
        project.status = "ACTIVE"
        project.updated_at = datetime.utcnow()
        
        # Cambiar todas las líneas de crédito de simulación a activas
        credit_lines = db.query(LineaCreditoProyecto).filter(
            LineaCreditoProyecto.scenario_project_id == project_id
        ).all()
        
        for cl in credit_lines:
            cl.es_simulacion = False
            cl.estado = "ACTIVA"
        
        db.commit()
        
        return {
            "success": True,
            "message": "Proyecto activado exitosamente. Las líneas de crédito ahora están activas y impactarán el cash flow consolidado.",
            "project_id": project_id,
            "new_status": "ACTIVE",
            "credit_lines_activated": len(credit_lines)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al activar proyecto: {str(e)}")

@router.get("/{project_id}/status-transitions", response_model=ProjectStatusTransitionsResponse)
def get_available_status_transitions(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Obtener las transiciones de estado disponibles para un proyecto"""
    
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    current_status = project.status
    transitions = []
    
    # Definir transiciones válidas según el estado actual
    if current_status == "PLANNING":
        transitions.append({
            "target_status": "DRAFT",
            "action": "transition-to-draft",
            "label": "Completar Planeación → DRAFT",
            "description": "Completar información básica y comenzar a agregar costos",
            "button_color": "blue",
            "requirements": ["Nombre del proyecto", "Ubicación", "Área total", "Número de unidades"]
        })
    
    elif current_status == "DRAFT":
        transitions.append({
            "target_status": "UNDER_REVIEW",
            "action": "transition-to-review",
            "label": "Enviar a Revisión",
            "description": "Enviar proyecto para revisión y aprobación de la dirección",
            "button_color": "purple",
                            "requirements": ["Items de costo", "Métricas financieras", "NPV positivo"]
        })
    
    elif current_status == "UNDER_REVIEW":
        transitions.extend([
            {
                "target_status": "APPROVED",
                "action": "approve",
                "label": "✓ Aprobar Proyecto",
                "description": "Aprobar proyecto y crear línea base para seguimiento",
                "button_color": "green",
                "requirements": ["Revisión completa", "Validación financiera"]
            },
            {
                "target_status": "DRAFT",
                "action": "reject",
                "label": "✗ Rechazar Proyecto",
                "description": "Rechazar proyecto y devolverlo a DRAFT para correcciones",
                "button_color": "red",
                "requirements": ["Razón del rechazo"]
            }
        ])
    
    elif current_status == "APPROVED":
        transitions.append({
            "target_status": "ACTIVE",
            "action": "activate",
            "label": "🚀 Activar Proyecto",
            "description": "Activar proyecto para ejecución - las líneas de crédito impactarán el cash flow consolidado",
            "button_color": "teal",
            "requirements": ["Confirmación de activación"]
        })
    
    # Validar si cumple requisitos para cada transición
    for transition in transitions:
        transition["can_transition"] = True
        transition["validation_errors"] = []
        
        if transition["action"] == "transition-to-draft":
            if not project.name or len(project.name.strip()) < 3:
                transition["can_transition"] = False
                transition["validation_errors"].append("Nombre del proyecto debe tener al menos 3 caracteres")
            
            if not project.location:
                transition["can_transition"] = False
                transition["validation_errors"].append("Ubicación del proyecto es obligatoria")
            
            if not project.total_area_m2 or project.total_area_m2 <= 0:
                transition["can_transition"] = False
                transition["validation_errors"].append("Área total debe ser mayor a 0")
            
            if not project.total_units or project.total_units <= 0:
                transition["can_transition"] = False
                transition["validation_errors"].append("Número de unidades debe ser mayor a 0")
        
        elif transition["action"] == "transition-to-review":
            # Verificar items de costo
            cost_items = db.query(ScenarioCostItem).filter(
                ScenarioCostItem.scenario_project_id == project_id,
                ScenarioCostItem.is_active == True
            ).count()
            
            if cost_items == 0:
                transition["can_transition"] = False
                transition["validation_errors"].append("Debe tener al menos un item de costo")
            
            # Verificar métricas
            metrics = db.query(ProjectFinancialMetrics).filter(
                ProjectFinancialMetrics.scenario_project_id == project_id
            ).first()
            
            if not metrics or not metrics.npv:
                transition["can_transition"] = False
                transition["validation_errors"].append("Debe calcular métricas financieras")
            elif float(metrics.npv) <= 0:
                transition["can_transition"] = False
                transition["validation_errors"].append("NPV debe ser positivo")
            
            # TIR bajo es solo una advertencia, no bloquea la transición
            if metrics and metrics.irr and float(metrics.irr) < 0.05:
                # Agregar como advertencia pero permitir continuar
                transition["validation_errors"].append("⚠️ ADVERTENCIA: TIR es menor al 5% recomendado")
    
    return {
        "project_id": project_id,
        "current_status": current_status,
        "available_transitions": transitions
    }

@router.get("/{project_id}/baseline-comparison")
def get_baseline_comparison(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Obtener comparación entre línea base (baseline) y valores actuales"""
    
    # Verify project exists and is approved
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status != "APPROVED":
        raise HTTPException(status_code=400, detail="El proyecto debe estar aprobado para ver comparaciones")
    
    try:
        # Get current (actual) cost items
        current_items = db.query(ScenarioCostItem).filter(
            ScenarioCostItem.scenario_project_id == project_id,
            ScenarioCostItem.is_active == True,
            ~ScenarioCostItem.categoria.contains("(BASELINE)")
        ).all()
        
        # Get baseline cost items
        baseline_items = db.query(ScenarioCostItem).filter(
            ScenarioCostItem.scenario_project_id == project_id,
            ScenarioCostItem.categoria.contains("(BASELINE)")
        ).all()
        
        # Create cost comparison by category
        cost_comparison = {}
        
        # Process baseline items
        for item in baseline_items:
            category = item.categoria.replace(" (BASELINE)", "")
            if category not in cost_comparison:
                cost_comparison[category] = {
                    "category": category,
                    "baseline_total": 0,
                    "actual_total": 0,
                    "variance": 0,
                    "variance_pct": 0,
                    "items": []
                }
            cost_comparison[category]["baseline_total"] += float(item.monto_proyectado or 0)
        
        # Process current items
        for item in current_items:
            category = item.categoria
            if category not in cost_comparison:
                cost_comparison[category] = {
                    "category": category,
                    "baseline_total": 0,
                    "actual_total": 0,
                    "variance": 0,
                    "variance_pct": 0,
                    "items": []
                }
            
            # Calculate actual cost
            actual_cost = item.monto_proyectado or 0
            if item.base_costo == 'por m²' and item.unit_cost and project.total_units and project.avg_unit_size_m2:
                actual_cost = float(item.unit_cost) * float(project.total_units) * float(project.avg_unit_size_m2)
            elif item.base_costo == 'por unidad' and item.unit_cost and project.total_units:
                actual_cost = float(item.unit_cost) * float(project.total_units)
            
            cost_comparison[category]["actual_total"] += float(actual_cost)
            
            # Add item details
            cost_comparison[category]["items"].append({
                "partida_costo": item.partida_costo,
                "baseline_amount": 0,  # Will be filled later
                "actual_amount": float(actual_cost),
                "variance": 0,  # Will be calculated later
                "base_costo": item.base_costo,
                "unit_cost": float(item.unit_cost or 0),
                "monto_real": float(item.monto_real or 0) if item.monto_real else None
            })
        
        # Calculate variances
        for category_data in cost_comparison.values():
            baseline = category_data["baseline_total"]
            actual = category_data["actual_total"]
            variance = actual - baseline
            variance_pct = (variance / baseline * 100) if baseline > 0 else 0
            
            category_data["variance"] = variance
            category_data["variance_pct"] = variance_pct
        
        # Get cash flow comparison
        baseline_cf = db.query(ScenarioCashFlow).filter(
            ScenarioCashFlow.scenario_project_id == project_id,
            ScenarioCashFlow.period_label.contains("(BASELINE)")
        ).all()
        
        current_cf = db.query(ScenarioCashFlow).filter(
            ScenarioCashFlow.scenario_project_id == project_id,
            ~ScenarioCashFlow.period_label.contains("(BASELINE)")
        ).all()
        
        # Create cash flow comparison
        cashflow_comparison = []
        for i, cf in enumerate(current_cf):
            baseline_cf_item = baseline_cf[i] if i < len(baseline_cf) else None
            
            comparison_item = {
                "period": cf.period_label,
                "year": cf.year,
                "month": cf.month,
                "baseline": {
                    "ingresos": float(baseline_cf_item.total_ingresos) if baseline_cf_item else 0,
                    "egresos": float(baseline_cf_item.total_egresos) if baseline_cf_item else 0,
                    "flujo_neto": float(baseline_cf_item.flujo_neto) if baseline_cf_item else 0,
                    "flujo_acumulado": float(baseline_cf_item.flujo_acumulado) if baseline_cf_item else 0
                },
                "actual": {
                    "ingresos": float(cf.total_ingresos),
                    "egresos": float(cf.total_egresos),
                    "flujo_neto": float(cf.flujo_neto),
                    "flujo_acumulado": float(cf.flujo_acumulado)
                }
            }
            
            # Calculate variances
            comparison_item["variance"] = {
                "ingresos": comparison_item["actual"]["ingresos"] - comparison_item["baseline"]["ingresos"],
                "egresos": comparison_item["actual"]["egresos"] - comparison_item["baseline"]["egresos"],
                "flujo_neto": comparison_item["actual"]["flujo_neto"] - comparison_item["baseline"]["flujo_neto"],
                "flujo_acumulado": comparison_item["actual"]["flujo_acumulado"] - comparison_item["baseline"]["flujo_acumulado"]
            }
            
            cashflow_comparison.append(comparison_item)
        
        # Summary totals
        total_baseline_cost = sum([cat["baseline_total"] for cat in cost_comparison.values()])
        total_actual_cost = sum([cat["actual_total"] for cat in cost_comparison.values()])
        total_variance = total_actual_cost - total_baseline_cost
        total_variance_pct = (total_variance / total_baseline_cost * 100) if total_baseline_cost > 0 else 0
        
        return {
            "project_id": project_id,
            "project_name": project.name,
            "approved_at": project.approved_at,
            "status": project.status,
            "cost_comparison": list(cost_comparison.values()),
            "cashflow_comparison": cashflow_comparison[:12],  # First 12 months
            "summary": {
                "total_baseline_cost": total_baseline_cost,
                "total_actual_cost": total_actual_cost,
                "total_variance": total_variance,
                "total_variance_pct": total_variance_pct,
                "has_baseline": len(baseline_items) > 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener comparación: {str(e)}")

@router.delete("/{project_id}")
async def delete_scenario_project(project_id: int, db: Session = Depends(get_db)):
    """Eliminar un proyecto de escenario"""
    db_project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    db.delete(db_project)
    db.commit()
    
    return {"message": "Proyecto eliminado exitosamente"}

# --- Cost Items Management ---

@router.get("/{project_id}/cost-items", response_model=List[ScenarioCostItemSchema])
async def get_project_cost_items(project_id: int, db: Session = Depends(get_db)):
    """Obtener todos los items de costo de un proyecto"""
    items = db.query(ScenarioCostItem).filter(
        ScenarioCostItem.scenario_project_id == project_id,
        ScenarioCostItem.is_active == True
    ).all()
    
    return items

@router.post("/{project_id}/cost-items", response_model=ScenarioCostItemSchema)
async def create_cost_item(
    project_id: int,
    cost_item: ScenarioCostItemCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo item de costo para el proyecto"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    cost_item.scenario_project_id = project_id
    db_cost_item = ScenarioCostItem(**cost_item.dict())
    db.add(db_cost_item)
    db.commit()
    db.refresh(db_cost_item)
    
    return db_cost_item

@router.get("/{project_id}/cost-items/{item_id}", response_model=ScenarioCostItemSchema)
async def get_cost_item(
    project_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    """Obtener un item de costo específico"""
    db_item = db.query(ScenarioCostItem).filter(
        and_(
            ScenarioCostItem.id == item_id,
            ScenarioCostItem.scenario_project_id == project_id
        )
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item de costo no encontrado")
    
    return db_item

@router.put("/{project_id}/cost-items/{item_id}", response_model=ScenarioCostItemSchema)
async def update_cost_item(
    project_id: int,
    item_id: int,
    item_update: ScenarioCostItemUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un item de costo"""
    db_item = db.query(ScenarioCostItem).filter(
        and_(
            ScenarioCostItem.id == item_id,
            ScenarioCostItem.scenario_project_id == project_id
        )
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item de costo no encontrado")
    
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db_item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    
    # Recalculate cash flows when cost items are updated
    try:
        project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
        if project:
            calculate_cash_flows(project, db)
    except Exception as e:
        # Log error but don't fail the cost item update
        print(f"Warning: Could not recalculate cash flows after cost update: {e}")
    
    return db_item

@router.delete("/{project_id}/cost-items/{item_id}")
async def delete_cost_item(project_id: int, item_id: int, db: Session = Depends(get_db)):
    """Eliminar un item de costo"""
    db_item = db.query(ScenarioCostItem).filter(
        and_(
            ScenarioCostItem.id == item_id,
            ScenarioCostItem.scenario_project_id == project_id
        )
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Item de costo no encontrado")
    
    db.delete(db_item)
    db.commit()
    
    return {"message": "Item de costo eliminado exitosamente"}

# --- Financial Calculations ---

@router.post("/{project_id}/calculate-financials", response_model=FinancialCalculationResponse)
async def calculate_project_financials(
    project_id: int,
    calculation_request: FinancialCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calcular todas las métricas financieras de un proyecto"""
    project = db.query(ScenarioProject).options(
        joinedload(ScenarioProject.cost_items)
    ).filter(ScenarioProject.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    try:
        # Calculate cash flows
        if calculation_request.recalculate_cash_flow:
            cash_flow_periods = calculate_cash_flows(project, db)
        else:
            cash_flow_periods = db.query(ScenarioCashFlow).filter(
                ScenarioCashFlow.scenario_project_id == project_id
            ).count()
        
        # Calculate financial metrics
        if calculation_request.recalculate_metrics:
            metrics = calculate_financial_metrics(project, db)
        else:
            metrics = db.query(ProjectFinancialMetrics).filter(
                ProjectFinancialMetrics.scenario_project_id == project_id
            ).first()
        
        return FinancialCalculationResponse(
            success=True,
            message="Cálculos financieros completados exitosamente",
            metrics=ProjectFinancialMetricsSchema.model_validate(metrics) if metrics else None,
            cash_flow_periods=cash_flow_periods
        )
        
    except Exception as e:
        return FinancialCalculationResponse(
            success=False,
            message=f"Error en los cálculos financieros: {str(e)}",
            metrics=None,
            cash_flow_periods=None
        )

@router.get("/{project_id}/cash-flow")
async def get_project_cash_flow(project_id: int, db: Session = Depends(get_db)):
    """Obtener el flujo de caja del proyecto"""
    cash_flows = db.query(ScenarioCashFlow).filter(
        ScenarioCashFlow.scenario_project_id == project_id
    ).order_by(ScenarioCashFlow.year, ScenarioCashFlow.month).all()
    
    return cash_flows

@router.get("/{project_id}/metrics", response_model=ProjectFinancialMetricsSchema)
async def get_project_metrics(project_id: int, db: Session = Depends(get_db)):
    """Obtener las métricas financieras del proyecto"""
    metrics = db.query(ProjectFinancialMetrics).filter(
        ProjectFinancialMetrics.scenario_project_id == project_id
    ).first()
    
    if not metrics:
        # Try to calculate metrics if they don't exist
        project = db.query(ScenarioProject).options(
            joinedload(ScenarioProject.cost_items)
        ).filter(ScenarioProject.id == project_id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        try:
            # Calculate cash flows first
            calculate_cash_flows(project, db)
            # Then calculate financial metrics
            metrics = calculate_financial_metrics(project, db)
        except Exception as e:
            # If calculation fails, return default/empty metrics
            metrics = ProjectFinancialMetrics(
                scenario_project_id=project_id,
                total_investment=Decimal('0'),
                total_revenue=Decimal('0'),
                npv=Decimal('0'),
                irr=0.0,
                payback_months=0
            )
            db.add(metrics)
            db.commit()
            db.refresh(metrics)
    
    return metrics

# --- Sensitivity Analysis ---

@router.post("/{project_id}/sensitivity-analysis", response_model=SensitivityAnalysisSchema)
async def run_sensitivity_analysis(
    project_id: int,
    analysis_request: SensitivityAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Ejecutar análisis de sensibilidad"""
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Perform sensitivity analysis
    results = perform_sensitivity_analysis(project, analysis_request, db)
    
    # Save results
    analysis = SensitivityAnalysis(
        scenario_project_id=project_id,
        analysis_name=f"Análisis de {analysis_request.variable_type}",
        variable_type=analysis_request.variable_type,
        base_value=get_base_value_for_variable(project, analysis_request.variable_type),
        min_variation_pct=analysis_request.min_variation_pct,
        max_variation_pct=analysis_request.max_variation_pct,
        steps=analysis_request.steps,
        results=results["scenarios"],
        base_npv=results["base_npv"],
        base_irr=results["base_irr"],
        base_payback_months=results["base_payback_months"]
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis

@router.get("/{project_id}/sensitivity-analyses", response_model=List[SensitivityAnalysisSchema])
async def get_project_sensitivity_analyses(project_id: int, db: Session = Depends(get_db)):
    """Obtener todos los análisis de sensibilidad de un proyecto"""
    analyses = db.query(SensitivityAnalysis).filter(
        SensitivityAnalysis.scenario_project_id == project_id
    ).order_by(desc(SensitivityAnalysis.created_at)).all()
    
    return analyses

# --- Cost Categories Management ---

@router.get("/cost-categories", response_model=List[CostCategorySchema])
async def get_cost_categories(db: Session = Depends(get_db)):
    """Obtener todas las categorías de costo disponibles"""
    categories = db.query(CostCategory).filter(CostCategory.is_active == True).all()
    return categories

@router.post("/cost-categories", response_model=CostCategorySchema)
async def create_cost_category(category: CostCategoryCreate, db: Session = Depends(get_db)):
    """Crear una nueva categoría de costo"""
    db_category = CostCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# --- Helper Functions ---

async def initialize_default_cost_categories(project_id: int, db: Session):
    """Inicializar categorías de costo por defecto para Panamá"""
    default_categories = [
        # Terreno
        {"categoria": "Terreno", "subcategoria": "Adquisición", "partida_costo": "Precio de Compra del Lote", "base_costo": "Monto Fijo"},
        {"categoria": "Terreno", "subcategoria": "Costos de Cierre", "partida_costo": "Honorarios Legales y Notariales", "base_costo": "Monto Fijo"},
        
        # Costos Duros
        {"categoria": "Costos Duros", "subcategoria": "Preparación del Sitio", "partida_costo": "Demolición y Excavación", "base_costo": "Monto Fijo / por m³"},
        {"categoria": "Costos Duros", "subcategoria": "Construcción", "partida_costo": "Estructura y Cimentación", "base_costo": "por m²"},
        {"categoria": "Costos Duros", "subcategoria": "Acabados", "partida_costo": "Pisos, Pintura, Carpintería", "base_costo": "por m²"},
        {"categoria": "Costos Duros", "subcategoria": "Sistemas", "partida_costo": "Eléctrico, Plomería, HVAC", "base_costo": "por unidad / por m²"},
        
        # Costos Blandos
        {"categoria": "Costos Blandos", "subcategoria": "Honorarios Profesionales", "partida_costo": "Arquitecto", "base_costo": "% Costos Duros"},
        {"categoria": "Costos Blandos", "subcategoria": "Honorarios Profesionales", "partida_costo": "Ingeniero Estructural", "base_costo": "Monto Fijo"},
        {"categoria": "Costos Blandos", "subcategoria": "Permisos y Tasas", "partida_costo": "Permiso de Construcción", "base_costo": "Calculado"},
        {"categoria": "Costos Blandos", "subcategoria": "Permisos y Tasas", "partida_costo": "Estudio de Impacto Ambiental", "base_costo": "Monto Fijo"},
        {"categoria": "Costos Blandos", "subcategoria": "Marketing y Ventas", "partida_costo": "Publicidad Digital", "base_costo": "Monto Fijo Mensual"},
        {"categoria": "Costos Blandos", "subcategoria": "Marketing y Ventas", "partida_costo": "Comisiones de Corredores", "base_costo": "% Ingresos por Venta"},
        
        # Financiación
        {"categoria": "Financiación", "subcategoria": "Intereses del Préstamo", "partida_costo": "Intereses del Préstamo", "base_costo": "Calculado"},
        {"categoria": "Financiación", "subcategoria": "Comisiones del Préstamo", "partida_costo": "Comisiones del Préstamo", "base_costo": "% Monto del Préstamo"},
        
        # Contingencia
        {"categoria": "Contingencia", "subcategoria": "Imprevistos", "partida_costo": "Reserva para Imprevistos", "base_costo": "% Costos Totales"},
    ]
    
    for cat_data in default_categories:
        cost_item = ScenarioCostItem(
            scenario_project_id=project_id,
            **cat_data,
            monto_proyectado=Decimal('0.00'),
            is_active=True
        )
        db.add(cost_item)
    
    db.commit()

def calculate_cash_flows(project: ScenarioProject, db: Session) -> int:
    """Calcular flujos de caja mensuales del proyecto"""
    # Clear existing cash flows
    db.query(ScenarioCashFlow).filter(
        ScenarioCashFlow.scenario_project_id == project.id
    ).delete()
    
    # Calculate for 5 years or project duration
    duration_months = project.expected_sales_period_months or 60
    current_year = datetime.now().year
    
    # Get cost items
    cost_items = db.query(ScenarioCostItem).filter(
        ScenarioCostItem.scenario_project_id == project.id,
        ScenarioCostItem.is_active == True
    ).all()
    
    accumulated_flow = Decimal('0.00')
    
    for month_offset in range(duration_months):
        year = current_year + (month_offset // 12)
        month = (month_offset % 12) + 1
        period_label = f"{year}-{month:02d}"
        
        # Calculate revenues (simplified sales projection)
        monthly_revenue = calculate_monthly_revenue(project, month_offset, duration_months)
        
        # Calculate costs for this month
        monthly_costs = calculate_monthly_costs(cost_items, month_offset, project)
        
        # Calculate net flow
        net_flow = monthly_revenue - monthly_costs["total"]
        accumulated_flow += net_flow
        
        # Calculate discounted flow for NPV
        discount_factor = (1 + float(project.discount_rate) / 12) ** (month_offset + 1)
        discounted_flow = net_flow / Decimal(str(discount_factor))
        
        # Create cash flow record
        cash_flow = ScenarioCashFlow(
            scenario_project_id=project.id,
            year=year,
            month=month,
            period_label=period_label,
            ingresos_ventas=monthly_revenue,
            total_ingresos=monthly_revenue,
            costos_terreno=monthly_costs.get("terreno", Decimal('0.00')),
            costos_duros=monthly_costs.get("costos_duros", Decimal('0.00')),
            costos_blandos=monthly_costs.get("costos_blandos", Decimal('0.00')),
            costos_financiacion=monthly_costs.get("financiacion", Decimal('0.00')),
            costos_marketing=monthly_costs.get("marketing", Decimal('0.00')),
            total_egresos=monthly_costs["total"],
            flujo_neto=net_flow,
            flujo_acumulado=accumulated_flow,
            flujo_descontado=discounted_flow
        )
        
        db.add(cash_flow)
    
    db.commit()
    return duration_months

def calculate_monthly_revenue(project: ScenarioProject, month_offset: int, total_months: int) -> Decimal:
    """Calcular ingresos mensuales basados en el patrón de ventas"""
    if not project.total_units or not project.target_price_per_m2 or not project.avg_unit_size_m2:
        return Decimal('0.00')
    
    total_revenue = project.total_units * project.target_price_per_m2 * project.avg_unit_size_m2
    
    # S-curve sales pattern: slow start, peak in middle, slow end
    progress = month_offset / total_months
    if progress <= 0.2:  # First 20% - slow start
        monthly_factor = progress * 0.5
    elif progress <= 0.8:  # Middle 60% - peak sales
        monthly_factor = 0.1 + (progress - 0.2) * 1.5
    else:  # Last 20% - slow end
        monthly_factor = 1.0 - (progress - 0.8) * 2.5
    
    return total_revenue * Decimal(str(monthly_factor)) / Decimal(str(total_months))

def calculate_monthly_costs(cost_items: List[ScenarioCostItem], month_offset: int, project: ScenarioProject = None) -> dict:
    """Calcular costos mensuales por categoría"""
    monthly_costs = {
        "terreno": Decimal('0.00'),
        "costos_duros": Decimal('0.00'),
        "costos_blandos": Decimal('0.00'),
        "financiacion": Decimal('0.00'),
        "marketing": Decimal('0.00'),
        "otros": Decimal('0.00'),
        "total": Decimal('0.00')
    }
    
    for item in cost_items:
        # Calculate actual cost based on base_costo type
        actual_cost = item.monto_proyectado
        
        # Handle different cost bases
        if "por m²" in item.base_costo and item.unit_cost and project:
            # Calculate cost per m² * total project area
            project_area = None
            if project.total_area_m2:
                project_area = project.total_area_m2
            elif project.total_units and project.avg_unit_size_m2:
                project_area = project.total_units * project.avg_unit_size_m2
            
            if project_area:
                actual_cost = item.unit_cost * Decimal(str(project_area))
        elif "por unidad" in item.base_costo and item.unit_cost and project and project.total_units:
            # Calculate cost per unit * total units
            actual_cost = item.unit_cost * Decimal(str(project.total_units))
        elif item.unit_cost and item.quantity:
            # Calculate unit_cost * quantity
            actual_cost = item.unit_cost * item.quantity
        
        if not actual_cost:
            continue
            
        # Determine when this cost occurs
        start_month = item.start_month if item.start_month is not None else 1
        # Handle start_month = 0 as month 1
        if start_month == 0:
            start_month = 1
        duration = item.duration_months or 1
        
        if start_month <= (month_offset + 1) <= (start_month + duration - 1):
            monthly_amount = actual_cost / Decimal(str(duration))
            
            # Categorize cost
            category_key = "otros"
            if "terreno" in item.categoria.lower():
                category_key = "terreno"
            elif "duros" in item.categoria.lower():
                category_key = "costos_duros"
            elif "blandos" in item.categoria.lower():
                category_key = "costos_blandos"
            elif "financiacion" in item.categoria.lower():
                category_key = "financiacion"
            elif "marketing" in item.categoria.lower():
                category_key = "marketing"
            
            monthly_costs[category_key] += monthly_amount
            monthly_costs["total"] += monthly_amount
    
    return monthly_costs

def calculate_financial_metrics(project: ScenarioProject, db: Session) -> ProjectFinancialMetrics:
    """Calcular métricas financieras del proyecto"""
    # Get cash flows
    cash_flows = db.query(ScenarioCashFlow).filter(
        ScenarioCashFlow.scenario_project_id == project.id
    ).order_by(ScenarioCashFlow.year, ScenarioCashFlow.month).all()
    
    if not cash_flows:
        raise ValueError("No hay flujos de caja calculados")
    
    # Calculate basic metrics
    total_investment = sum(cf.total_egresos for cf in cash_flows)
    total_revenue = sum(cf.total_ingresos for cf in cash_flows)
    total_profit = total_revenue - total_investment
    profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else Decimal('0.00')
    
    # Calculate NPV
    npv = sum(cf.flujo_descontado for cf in cash_flows)
    
    # Calculate IRR (simplified using approximation)
    irr = calculate_irr([float(cf.flujo_neto) for cf in cash_flows])
    
    # Calculate payback period
    payback_months = calculate_payback_period(cash_flows)
    
    # Per unit and per m² metrics
    cost_per_unit = total_investment / Decimal(str(project.total_units)) if project.total_units else None
    revenue_per_unit = total_revenue / Decimal(str(project.total_units)) if project.total_units else None
    profit_per_unit = total_profit / Decimal(str(project.total_units)) if project.total_units else None
    
    total_area = (project.total_units * project.avg_unit_size_m2) if (project.total_units and project.avg_unit_size_m2) else None
    cost_per_m2 = total_investment / total_area if total_area else None
    revenue_per_m2 = total_revenue / total_area if total_area else None
    profit_per_m2 = total_profit / total_area if total_area else None
    
    # Risk metrics
    max_drawdown = min(cf.flujo_acumulado for cf in cash_flows)
    break_even_units = calculate_break_even_units(project, total_investment)
    
    # Save or update metrics
    existing_metrics = db.query(ProjectFinancialMetrics).filter(
        ProjectFinancialMetrics.scenario_project_id == project.id
    ).first()
    
    metrics_data = {
        "scenario_project_id": project.id,
        "total_investment": total_investment,
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "profit_margin_pct": profit_margin,
        "npv": npv,
        "irr": Decimal(str(irr)) if irr else None,
        "payback_months": payback_months,
        "profitability_index": (npv / total_investment) if total_investment > 0 else None,
        "cost_per_unit": cost_per_unit,
        "revenue_per_unit": revenue_per_unit,
        "profit_per_unit": profit_per_unit,
        "cost_per_m2": cost_per_m2,
        "revenue_per_m2": revenue_per_m2,
        "profit_per_m2": profit_per_m2,
        "break_even_units": break_even_units,
        "break_even_price_per_m2": calculate_break_even_price_per_m2(project, total_investment),
        "max_drawdown": max_drawdown,
        "calculated_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    if existing_metrics:
        for field, value in metrics_data.items():
            setattr(existing_metrics, field, value)
        db.commit()
        db.refresh(existing_metrics)
        return existing_metrics
    else:
        new_metrics = ProjectFinancialMetrics(**metrics_data)
        db.add(new_metrics)
        db.commit()
        db.refresh(new_metrics)
        return new_metrics

def calculate_irr(cash_flows: List[float], initial_guess: float = 0.1) -> Optional[float]:
    """Calcular TIR usando método simplificado"""
    if not cash_flows or len(cash_flows) < 2:
        return None
    
    # Simplified IRR calculation using approximation
    try:
        # Simple approximation for IRR
        total_investment = sum(cf for cf in cash_flows if cf < 0)
        total_returns = sum(cf for cf in cash_flows if cf > 0)
        
        if total_investment == 0:
            return None
            
        return (total_returns / abs(total_investment)) ** (1 / len(cash_flows)) - 1
    except:
        return initial_guess

def calculate_payback_period(cash_flows: List[ScenarioCashFlow]) -> Optional[int]:
    """Calcular período de recuperación"""
    accumulated = Decimal('0.00')
    for i, cf in enumerate(cash_flows):
        accumulated += cf.flujo_neto
        if accumulated >= 0:
            return i + 1
    return None

def calculate_break_even_units(project: ScenarioProject, total_costs: Decimal) -> Optional[int]:
    """Calcular punto de equilibrio en unidades"""
    if not project.target_price_per_m2 or not project.avg_unit_size_m2:
        return None
    
    revenue_per_unit = project.target_price_per_m2 * project.avg_unit_size_m2
    cost_per_unit = total_costs / Decimal(str(project.total_units)) if project.total_units else None
    
    if cost_per_unit and revenue_per_unit > cost_per_unit:
        return int(total_costs / (revenue_per_unit - cost_per_unit))
    
    return None

def calculate_break_even_price_per_m2(project: ScenarioProject, total_costs: Decimal) -> Optional[Decimal]:
    """Calcular precio de equilibrio por m²"""
    if not project.total_units or not project.avg_unit_size_m2:
        return None
    
    total_area = project.total_units * project.avg_unit_size_m2
    return total_costs / total_area

def perform_sensitivity_analysis(
    project: ScenarioProject, 
    request: SensitivityAnalysisRequest, 
    db: Session
) -> dict:
    """Realizar análisis de sensibilidad"""
    base_value = get_base_value_for_variable(project, request.variable_type)
    
    scenarios = []
    steps = request.steps
    min_var = float(request.min_variation_pct) / 100
    max_var = float(request.max_variation_pct) / 100
    
    for i in range(steps):
        # Calculate variation percentage
        if steps == 1:
            variation_pct = 0
        else:
            variation_pct = min_var + (max_var - min_var) * i / (steps - 1)
        
        # Apply variation to base value
        new_value = base_value * (1 + Decimal(str(variation_pct)))
        
        # Create temporary project with modified value
        temp_project = apply_variable_change(project, request.variable_type, new_value)
        
        # Calculate metrics for this scenario
        temp_metrics = calculate_scenario_metrics(temp_project, db)
        
        scenarios.append({
            "variation_pct": variation_pct * 100,
            "variable_value": float(new_value),
            "npv": float(temp_metrics["npv"]),
            "irr": float(temp_metrics["irr"]) if temp_metrics["irr"] else None,
            "payback_months": temp_metrics["payback_months"],
            "profit_margin": float(temp_metrics["profit_margin"])
        })
    
    # Base scenario (0% variation)
    base_metrics = calculate_scenario_metrics(project, db)
    
    return {
        "scenarios": scenarios,
        "base_npv": float(base_metrics["npv"]),
        "base_irr": float(base_metrics["irr"]) if base_metrics["irr"] else None,
        "base_payback_months": base_metrics["payback_months"]
    }

def get_base_value_for_variable(project: ScenarioProject, variable_type: str) -> Decimal:
    """Obtener valor base para la variable de análisis"""
    if variable_type == "PRICE_PER_M2":
        return project.target_price_per_m2 or Decimal('1000')
    elif variable_type == "UNIT_SIZE":
        return project.avg_unit_size_m2 or Decimal('100')
    elif variable_type == "TOTAL_UNITS":
        return Decimal(str(project.total_units)) if project.total_units else Decimal('50')
    elif variable_type == "DISCOUNT_RATE":
        return project.discount_rate
    else:
        return Decimal('1000')  # Default base value

def apply_variable_change(project: ScenarioProject, variable_type: str, new_value: Decimal) -> ScenarioProject:
    """Aplicar cambio de variable al proyecto (copia temporal)"""
    temp_project = ScenarioProject(**{
        attr: getattr(project, attr) for attr in [
            'id', 'name', 'total_area_m2', 'buildable_area_m2', 'total_units',
            'avg_unit_size_m2', 'target_price_per_m2', 'expected_sales_period_months',
            'discount_rate', 'inflation_rate', 'contingency_percentage'
        ]
    })
    
    if variable_type == "PRICE_PER_M2":
        temp_project.target_price_per_m2 = new_value
    elif variable_type == "UNIT_SIZE":
        temp_project.avg_unit_size_m2 = new_value
    elif variable_type == "TOTAL_UNITS":
        temp_project.total_units = int(new_value)
    elif variable_type == "DISCOUNT_RATE":
        temp_project.discount_rate = new_value
    
    return temp_project

def calculate_scenario_metrics(project: ScenarioProject, db: Session) -> dict:
    """Calcular métricas para un escenario específico"""
    # This is a simplified version - in practice you'd want to recalculate cash flows
    if not project.total_units or not project.target_price_per_m2 or not project.avg_unit_size_m2:
        return {
            "npv": Decimal('0'),
            "irr": None,
            "payback_months": None,
            "profit_margin": Decimal('0')
        }
    
    # Simplified calculation for demonstration
    total_revenue = project.total_units * project.target_price_per_m2 * project.avg_unit_size_m2
    
    # Estimate costs as 70% of revenue (this should be calculated from actual cost items)
    estimated_costs = total_revenue * Decimal('0.7')
    profit = total_revenue - estimated_costs
    profit_margin = (profit / total_revenue * 100) if total_revenue > 0 else Decimal('0')
    
    # Simplified NPV calculation
    npv = profit / (1 + project.discount_rate) ** 2
    
    # Simplified IRR estimation
    irr = (profit / estimated_costs) if estimated_costs > 0 else Decimal('0')
    
    return {
        "npv": npv,
        "irr": irr,
        "payback_months": 24,  # Simplified
        "profit_margin": profit_margin
    }

# --- Sales Simulation Endpoints ---

@router.post("/{project_id}/simulate-sales", response_model=SalesSimulationResponse)
async def simulate_sales_scenarios(
    project_id: int,
    simulation_request: SalesSimulationRequest,
    db: Session = Depends(get_db)
):
    """Simular diferentes escenarios de ventas y su impacto en el flujo de caja"""
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    try:
        # Simular cada escenario
        scenarios = []
        cash_flow_comparison = []
        
        for scenario_config in [
            simulation_request.optimistic_scenario,
            simulation_request.realistic_scenario,
            simulation_request.conservative_scenario
        ]:
            # Crear copia temporal del proyecto con nuevo patrón de ventas
            temp_project = create_temp_project_with_sales_pattern(project, scenario_config)
            
            # Calcular métricas para este escenario
            metrics = calculate_scenario_metrics(temp_project, db)
            
            # Calcular exposición máxima de capital
            max_exposure = calculate_max_capital_exposure(temp_project, db)
            
            scenario_metrics = SalesScenarioMetrics(
                scenario_name=scenario_config.scenario_name,
                npv=Decimal(str(metrics.get('npv', 0))) if metrics.get('npv') else None,
                irr=Decimal(str(metrics.get('irr', 0))) if metrics.get('irr') else None,
                payback_months=metrics.get('payback_months'),
                max_exposure=max_exposure,
                total_revenue=Decimal(str(metrics.get('total_revenue', 0))) if 'total_revenue' in metrics else None,
                total_profit=Decimal(str(metrics.get('total_profit', 0))) if 'total_profit' in metrics else None
            )
            scenarios.append(scenario_metrics)
            
            # Generar datos para comparación de flujo de caja
            cash_flow_data = generate_cash_flow_comparison_data(temp_project, scenario_config.scenario_name, db)
            cash_flow_comparison.extend(cash_flow_data)
        
        # Analizar impacto en liquidez empresarial
        company_impact = analyze_company_liquidity_impact(scenarios, project)
        
        return SalesSimulationResponse(
            success=True,
            message="Simulación de escenarios completada exitosamente",
            scenarios=scenarios,
            cash_flow_comparison=cash_flow_comparison,
            company_impact=company_impact
        )
        
    except Exception as e:
        return SalesSimulationResponse(
            success=False,
            message=f"Error en la simulación: {str(e)}",
            scenarios=[],
            cash_flow_comparison=[],
            company_impact={}
        )

def create_temp_project_with_sales_pattern(project: ScenarioProject, scenario_config: SalesScenarioConfig) -> ScenarioProject:
    """Crear una copia temporal del proyecto con un patrón de ventas específico"""
    
    # Crear copia del proyecto original
    temp_project = ScenarioProject(
        id=project.id,
        name=f"{project.name} - {scenario_config.scenario_name}",
        description=project.description,
        location=project.location,
        status=project.status,
        total_area_m2=project.total_area_m2,
        buildable_area_m2=project.buildable_area_m2,
        total_units=project.total_units,
        avg_unit_size_m2=project.avg_unit_size_m2,
        target_price_per_m2=project.target_price_per_m2,
        expected_sales_period_months=project.expected_sales_period_months,
        discount_rate=project.discount_rate,
        inflation_rate=project.inflation_rate,
        contingency_percentage=project.contingency_percentage,
        created_by=project.created_by,
        created_at=project.created_at,
        updated_at=project.updated_at
    )
    
    # Agregar metadata del escenario de ventas para usar en cálculos
    temp_project._sales_scenario = scenario_config
    
    return temp_project

def calculate_max_capital_exposure(project: ScenarioProject, db: Session) -> Decimal:
    """Calcular la máxima exposición de capital durante el proyecto"""
    
    if not hasattr(project, '_sales_scenario') or not project.total_units or not project.target_price_per_m2 or not project.avg_unit_size_m2:
        return Decimal('8000000')  # Valor por defecto
    
    scenario = project._sales_scenario
    
    # Calcular ingresos totales
    total_revenue = (project.total_units or 0) * (project.target_price_per_m2 or 0) * (project.avg_unit_size_m2 or 0)
    
    # Distribución de ingresos por período
    revenue_6m = total_revenue * (scenario.period_0_6_months / 100)
    revenue_12m = total_revenue * (scenario.period_6_12_months / 100)
    revenue_18m = total_revenue * (scenario.period_12_18_months / 100)
    revenue_24m = total_revenue * (scenario.period_18_24_months / 100)
    
    # Estimar costos (simplificado - en implementación real usaría cost_items)
    estimated_total_costs = total_revenue * Decimal('0.75')  # Asumiendo 25% de margen
    
    # Calcular flujo acumulado mes a mes
    accumulated_flow = Decimal('0')
    min_flow = Decimal('0')
    
    for month in range(1, 37):  # 36 meses de simulación
        monthly_revenue = Decimal('0')
        monthly_costs = estimated_total_costs / 36  # Distribución uniforme de costos
        
        # Ingresos según el escenario
        if month <= 6:
            monthly_revenue = revenue_6m / 6
        elif month <= 12:
            monthly_revenue = revenue_12m / 6
        elif month <= 18:
            monthly_revenue = revenue_18m / 6
        elif month <= 24:
            monthly_revenue = revenue_24m / 6
        
        monthly_flow = monthly_revenue - monthly_costs
        accumulated_flow += monthly_flow
        
        if accumulated_flow < min_flow:
            min_flow = accumulated_flow
    
    return abs(min_flow)

def generate_cash_flow_comparison_data(project: ScenarioProject, scenario_name: str, db: Session) -> List[dict]:
    """Generar datos de comparación de flujo de caja para gráficos"""
    
    comparison_data = []
    
    # Generar datos simulados para el gráfico de comparación
    months = ['Mes 0', 'Mes 6', 'Mes 12', 'Mes 18', 'Mes 24', 'Mes 30']
    
    if hasattr(project, '_sales_scenario'):
        scenario = project._sales_scenario
        
        # Valores base para diferentes escenarios
        if scenario_name.lower() == 'optimista':
            values = [0, -2000000, 1200000, 4800000, 7200000, 8500000]
        elif scenario_name.lower() == 'realista':
            values = [0, -3500000, -800000, 2100000, 4500000, 6200000]
        else:  # conservador
            values = [0, -4500000, -2200000, -500000, 1800000, 3400000]
        
        for i, month in enumerate(months):
            comparison_data.append({
                'month': month,
                'scenario': scenario_name,
                'accumulated_flow': values[i]
            })
    
    return comparison_data



@router.get("/{project_id}/cash-flow-impact")
async def get_project_cash_flow_impact(project_id: int, db: Session = Depends(get_db)):
    """Obtener análisis del impacto del proyecto en el cash flow empresarial"""
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get project cash flows
    cash_flows = db.query(ScenarioCashFlow).filter(
        ScenarioCashFlow.scenario_project_id == project_id
    ).order_by(ScenarioCashFlow.year, ScenarioCashFlow.month).all()
    
    if not cash_flows:
        # Generate cash flows if they don't exist
        calculate_cash_flows(project, db)
        cash_flows = db.query(ScenarioCashFlow).filter(
            ScenarioCashFlow.scenario_project_id == project_id
        ).order_by(ScenarioCashFlow.year, ScenarioCashFlow.month).all()
    
    # Calculate impact metrics
    total_investment = sum(abs(float(cf.flujo_neto)) for cf in cash_flows if cf.flujo_neto < 0)
    max_negative_flow = min((float(cf.flujo_acumulado) for cf in cash_flows), default=0)
    break_even_month = next((i for i, cf in enumerate(cash_flows) if cf.flujo_acumulado > 0), None)
    
    # Prepare monthly impact data
    monthly_impact = []
    for cf in cash_flows[:24]:  # First 24 months
        flujo_neto_float = float(cf.flujo_neto)
        monthly_impact.append({
            "month": cf.period_label,
            "project_flow": flujo_neto_float,
            "accumulated_flow": float(cf.flujo_acumulado),
            "impact_on_company": flujo_neto_float * 0.85  # Assuming 85% impact on company cash flow
        })
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "analysis": {
            "total_investment_required": total_investment,
            "max_negative_exposure": abs(max_negative_flow),
            "break_even_month": break_even_month,
            "recommended_credit_line": abs(max_negative_flow) * 1.2,
            "liquidity_reserve_needed": total_investment * 0.15,
            "risk_level": "HIGH" if abs(max_negative_flow) > 1000000 else "MEDIUM" if abs(max_negative_flow) > 500000 else "LOW"
        },
        "monthly_impact": monthly_impact,
        "recommendations": [
            f"Establecer línea de crédito de al menos ${(abs(max_negative_flow) * 1.2):,.0f}",
            f"Mantener reserva de liquidez de ${(total_investment * 0.15):,.0f}",
            "Monitorear cash flow mensualmente durante los primeros 18 meses",
            "Considerar ventas pre-construcción para reducir exposición"
        ]
    }

@router.get("/{project_id}/credit-requirements")
async def get_project_credit_requirements(project_id: int, db: Session = Depends(get_db)):
    """Obtener análisis de requerimientos de crédito para el proyecto"""
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get cost items
    cost_items = db.query(ScenarioCostItem).filter(
        ScenarioCostItem.scenario_project_id == project_id,
        ScenarioCostItem.is_active == True
    ).all()
    
    # Calculate total project cost
    total_cost = sum(float(item.monto_proyectado or 0) for item in cost_items)
    
    # Calculate financing breakdown
    financing_breakdown = {
        "terreno": sum(float(item.monto_proyectado or 0) for item in cost_items if item.categoria.lower() == 'terreno'),
        "construccion": sum(float(item.monto_proyectado or 0) for item in cost_items if item.categoria.lower() == 'costos duros'),
        "capital_trabajo": sum(float(item.monto_proyectado or 0) for item in cost_items if item.categoria.lower() == 'costos blandos'),
        "contingencia": sum(float(item.monto_proyectado or 0) for item in cost_items if item.categoria.lower() == 'contingencia')
    }
    
    # Calculate total financing needed (assuming 80% financing ratio)
    financing_ratio = 0.80
    total_financing_needed = total_cost * financing_ratio
    
    # Generate recommended credit lines
    recommended_credit_lines = [
        {
            "tipo_linea": "credito_construccion",
            "proposito": "Financiamiento de la construcción del proyecto",
            "monto_recomendado": financing_breakdown["construccion"] * 0.9,
            "plazo_meses": 24,
            "garantia_tipo": "hipotecaria",
            "justificacion": "Línea principal para costos de construcción"
        },
        {
            "tipo_linea": "linea_capital_trabajo",
            "proposito": "Capital de trabajo para gastos operativos",
            "monto_recomendado": financing_breakdown["capital_trabajo"],
            "plazo_meses": 18,
            "garantia_tipo": "personal",
            "justificacion": "Cobertura de gastos blandos y operativos"
        }
    ]
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_project_cost": total_cost,
        "financing_breakdown": financing_breakdown,
        "total_financing_needed": total_financing_needed,
        "recommended_credit_lines": recommended_credit_lines,
        "financing_ratio": financing_ratio
    }

def analyze_company_liquidity_impact(scenarios: List[SalesScenarioMetrics], project: ScenarioProject) -> dict:
    """Analizar el impacto en la liquidez empresarial"""
    
    # Encontrar el escenario más conservador para análisis de riesgo
    conservative_scenario = None
    for scenario in scenarios:
        if scenario.scenario_name.lower() == 'conservador':
            conservative_scenario = scenario
            break
    
    if not conservative_scenario or not conservative_scenario.max_exposure:
        return {
            'min_liquidity_required': 10000000,
            'recommended_credit_line': 12000000,
            'liquidity_risk_level': 'MEDIO',
            'critical_month': 14,
            'recommendations': [
                "Asegurar línea de crédito antes del inicio",
                "Acelerar ventas en primeros 6 meses",
                "Implementar escenario de preventa del 30% mínimo"
            ]
        }
    
    # Calcular métricas de liquidez
    max_exposure = conservative_scenario.max_exposure
    min_liquidity_required = max_exposure * Decimal('1.1')  # 10% buffer
    recommended_credit_line = max_exposure * Decimal('1.2')  # 20% buffer
    
    # Determinar nivel de riesgo
    if max_exposure > Decimal('10000000'):  # >$10M
        risk_level = 'ALTO'
    elif max_exposure > Decimal('5000000'):  # >$5M
        risk_level = 'MEDIO'
    else:
        risk_level = 'BAJO'
    
    # Generar recomendaciones
    recommendations = [
        f"Asegurar línea de crédito de ${recommended_credit_line/1000000:.1f}M antes del inicio",
        "Acelerar ventas en primeros 6 meses con incentivos",
        "Implementar escenario de preventa del 30% mínimo",
        "Monitorear flujo semanal durante primeros 18 meses"
    ]
    
    return {
        'min_liquidity_required': float(min_liquidity_required),
        'recommended_credit_line': float(recommended_credit_line),
        'liquidity_risk_level': risk_level,
        'critical_month': 14,  # Mes crítico estimado
        'recommendations': recommendations
    }

# --- Unit Sales Simulation with Payment Distribution ---

@router.post("/{project_id}/simulate-unit-sales", response_model=UnitSalesSimulationResponse)
async def simulate_unit_sales_with_payment_distribution(
    project_id: int,
    simulation_request: UnitSalesSimulationRequest,
    db: Session = Depends(get_db)
):
    """Simular escenarios de ventas por unidades con distribución de pagos y líneas de crédito"""
    
    try:
        # Verify project exists
        project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Get project units
        units = db.query(ProjectUnit).filter(
            ProjectUnit.scenario_project_id == project_id,
            ProjectUnit.is_active == True
        ).all()
        
        if not units:
            raise HTTPException(status_code=400, detail="El proyecto no tiene unidades configuradas")
        
        # Get project credit lines
        credit_lines = db.query(LineaCreditoProyecto).filter(
            LineaCreditoProyecto.scenario_project_id == project_id,
            LineaCreditoProyecto.estado == "ACTIVA"
        ).all()
        
        # Default payment distribution if not provided
        payment_config = simulation_request.payment_distribution or PaymentDistributionConfig()
        
        # Calculate scenarios
        scenarios = []
        all_payment_flows = []
        
        for scenario_config in [
            simulation_request.optimistic_scenario,
            simulation_request.realistic_scenario,
            simulation_request.conservative_scenario
        ]:
            # Calculate payment flows for this scenario
            payment_flows = calculate_unit_payment_flows(
                units, scenario_config, payment_config, credit_lines
            )
            
            # Calculate metrics for this scenario
            scenario_metrics = calculate_unit_sales_scenario_metrics(
                scenario_config, payment_flows, project, db
            )
            
            scenarios.append(scenario_metrics)
            all_payment_flows.extend(payment_flows)
            
            # Save this scenario to sales_projections table
            monthly_revenue_data = {}
            for flow in payment_flows:
                month_key = f"month_{flow.sale_month}"
                if month_key not in monthly_revenue_data:
                    monthly_revenue_data[month_key] = {
                        "units_sold": 0,
                        "total_revenue": 0,
                        "developer_income": 0,
                        "credit_line_usage": 0
                    }
                
                monthly_revenue_data[month_key]["units_sold"] += 1
                monthly_revenue_data[month_key]["total_revenue"] += float(flow.sale_price)
                monthly_revenue_data[month_key]["developer_income"] += float(
                    flow.developer_separation + flow.developer_delivery
                )
                monthly_revenue_data[month_key]["credit_line_usage"] += float(
                    flow.credit_line_separation + flow.credit_line_delivery
                )
            
            # Create sales projection record
            sales_projection = SalesProjectionCreate(
                scenario_project_id=project_id,
                scenario_name=f"{scenario_config.scenario_name}_simulation",
                monthly_revenue=monthly_revenue_data,
                is_active=False  # Don't activate automatically
            )
            
            try:
                created_projection = create_sales_projection(db, sales_projection)
                db.commit()
            except Exception as e:
                print(f"Error saving sales projection: {e}")
                # Continue with simulation even if saving fails
        
        # Generate comparison data
        cash_flow_comparison = []
        for scenario in scenarios:
            comparison_data = generate_unit_sales_cash_flow_data(
                scenario.scenario_name, 
                [flow for flow in all_payment_flows if any(s.scenario_name == scenario.scenario_name for s in scenarios)]
            )
            cash_flow_comparison.extend(comparison_data)
        
        # Analyze company impact
        company_impact = analyze_unit_sales_company_impact(scenarios, project)
        
        # Generate units summary
        units_summary = generate_units_summary(scenarios, units)
        
        return UnitSalesSimulationResponse(
            success=True,
            message="Simulación completada exitosamente",
            scenarios=scenarios,
            cash_flow_comparison=cash_flow_comparison,
            company_impact=company_impact,
            units_summary=units_summary,
            payment_flows=all_payment_flows
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"Error in simulate_unit_sales_with_payment_distribution: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return UnitSalesSimulationResponse(
            success=False,
            message=f"Error en la simulación: {str(e)}",
            scenarios=[],
            cash_flow_comparison=[],
            company_impact={},
            units_summary={},
            payment_flows=[]
        )

def calculate_unit_payment_flows(
    units: List[ProjectUnit], 
    scenario_config: UnitSalesScenarioConfig,
    payment_config: PaymentDistributionConfig,
    credit_lines: List[LineaCreditoProyecto]
) -> List[UnitSalesPaymentFlow]:
    """Calcular los flujos de pago para cada unidad en el escenario"""
    
    payment_flows = []
    
    # Select primary credit line (first one available)
    primary_credit_line = credit_lines[0] if credit_lines else None
    
    for unit in units:
        unit_id_str = str(unit.id)
        if unit_id_str not in scenario_config.units_schedule:
            continue
            
        sale_month = scenario_config.units_schedule[unit_id_str]
        sale_price = unit.target_price_total or Decimal('0')
        
        if sale_price <= 0:
            continue
        
        # Determine if unit uses mortgage (based on percentage)
        import random
        uses_mortgage = random.random() < (float(payment_config.mortgage_usage_percentage) / 100)
        
        if uses_mortgage:
            # Calculate separation payment (typically 10% of price)
            separation_amount = sale_price * (payment_config.separation_payment_percentage / 100)
            
            # Calculate delivery payment (remaining 90% of price)
            delivery_amount = sale_price - separation_amount
            
            # Distribute separation payment
            developer_separation = separation_amount * (payment_config.separation_payment_percentage / 100)
            credit_line_separation = separation_amount * (payment_config.separation_credit_line_percentage / 100)
            
            # Distribute delivery payment
            developer_delivery = delivery_amount * (payment_config.delivery_payment_percentage / 100)
            credit_line_delivery = delivery_amount * (payment_config.delivery_credit_line_percentage / 100)
        else:
            # Cash payment - all goes to developer
            separation_amount = sale_price * Decimal('0.1')  # 10% separation
            delivery_amount = sale_price * Decimal('0.9')    # 90% at delivery
            
            developer_separation = separation_amount
            developer_delivery = delivery_amount
            credit_line_separation = Decimal('0')
            credit_line_delivery = Decimal('0')
        
        payment_flow = UnitSalesPaymentFlow(
            unit_id=unit.id,
            unit_number=unit.unit_number,
            sale_month=sale_month,
            sale_price=sale_price,
            uses_mortgage=uses_mortgage,
            separation_amount=separation_amount,
            delivery_amount=delivery_amount,
            developer_separation=developer_separation,
            developer_delivery=developer_delivery,
            credit_line_separation=credit_line_separation,
            credit_line_delivery=credit_line_delivery,
            credit_line_id=primary_credit_line.id if primary_credit_line else None
        )
        
        payment_flows.append(payment_flow)
    
    return payment_flows

def calculate_unit_sales_scenario_metrics(
    scenario_config: UnitSalesScenarioConfig,
    payment_flows: List[UnitSalesPaymentFlow],
    project: ScenarioProject,
    db: Session
) -> UnitSalesScenarioMetrics:
    """Calcular métricas para un escenario de ventas por unidades"""
    
    total_units_sold = len(payment_flows)
    total_revenue = sum(flow.sale_price for flow in payment_flows)
    
    # Calculate sales period
    sale_months = [flow.sale_month for flow in payment_flows]
    sales_period_months = max(sale_months) - min(sale_months) + 1 if sale_months else 0
    
    # Calculate average monthly sales
    average_monthly_sales = total_revenue / sales_period_months if sales_period_months > 0 else Decimal('0')
    
    # Calculate monthly sales distribution
    monthly_distribution = {}
    for flow in payment_flows:
        month_key = str(flow.sale_month)
        monthly_distribution[month_key] = monthly_distribution.get(month_key, 0) + 1
    
    # Generate developer cash flow
    developer_cash_flow = generate_developer_cash_flow(payment_flows)
    
    # Generate credit line impact
    credit_line_impact = generate_credit_line_impact(payment_flows)
    
    # Calculate financial metrics (simplified)
    total_developer_income = sum(flow.developer_separation + flow.developer_delivery for flow in payment_flows)
    max_exposure = calculate_max_exposure_for_scenario(payment_flows, project)
    
    return UnitSalesScenarioMetrics(
        scenario_name=scenario_config.scenario_name,
        total_units_sold=total_units_sold,
        total_revenue=total_revenue,
        sales_period_months=sales_period_months,
        average_monthly_sales=average_monthly_sales,
        max_exposure=max_exposure,
        monthly_sales_distribution=monthly_distribution,
        developer_cash_flow=developer_cash_flow,
        credit_line_impact=credit_line_impact,
        npv=None,  # Could be calculated if needed
        irr=None,  # Could be calculated if needed
        payback_months=None  # Could be calculated if needed
    )

def generate_developer_cash_flow(payment_flows: List[UnitSalesPaymentFlow]) -> List[Dict[str, Any]]:
    """Generar flujo de caja del desarrollador por mes"""
    
    monthly_cash_flow = {}
    
    for flow in payment_flows:
        # Separation payment in sale month
        if flow.sale_month not in monthly_cash_flow:
            monthly_cash_flow[flow.sale_month] = {'month': flow.sale_month, 'separation': 0, 'delivery': 0}
        monthly_cash_flow[flow.sale_month]['separation'] += float(flow.developer_separation)
        
        # Delivery payment (assume 12 months after sale)
        delivery_month = flow.sale_month + 12
        if delivery_month not in monthly_cash_flow:
            monthly_cash_flow[delivery_month] = {'month': delivery_month, 'separation': 0, 'delivery': 0}
        monthly_cash_flow[delivery_month]['delivery'] += float(flow.developer_delivery)
    
    # Convert to list and add totals
    cash_flow_list = []
    for month_data in sorted(monthly_cash_flow.values(), key=lambda x: x['month']):
        month_data['total'] = month_data['separation'] + month_data['delivery']
        cash_flow_list.append(month_data)
    
    return cash_flow_list

def generate_credit_line_impact(payment_flows: List[UnitSalesPaymentFlow]) -> List[Dict[str, Any]]:
    """Generar impacto en líneas de crédito por mes"""
    
    monthly_credit_impact = {}
    
    for flow in payment_flows:
        if not flow.uses_mortgage:
            continue
            
        # Separation payment to credit line in sale month
        if flow.sale_month not in monthly_credit_impact:
            monthly_credit_impact[flow.sale_month] = {'month': flow.sale_month, 'separation_payment': 0, 'delivery_payment': 0}
        monthly_credit_impact[flow.sale_month]['separation_payment'] += float(flow.credit_line_separation)
        
        # Delivery payment to credit line (assume 12 months after sale)
        delivery_month = flow.sale_month + 12
        if delivery_month not in monthly_credit_impact:
            monthly_credit_impact[delivery_month] = {'month': delivery_month, 'separation_payment': 0, 'delivery_payment': 0}
        monthly_credit_impact[delivery_month]['delivery_payment'] += float(flow.credit_line_delivery)
    
    # Convert to list and add totals
    credit_impact_list = []
    for month_data in sorted(monthly_credit_impact.values(), key=lambda x: x['month']):
        month_data['total_payment'] = month_data['separation_payment'] + month_data['delivery_payment']
        credit_impact_list.append(month_data)
    
    return credit_impact_list

def calculate_max_exposure_for_scenario(payment_flows: List[UnitSalesPaymentFlow], project: ScenarioProject) -> Decimal:
    """Calcular la máxima exposición de capital para el escenario"""
    
    # Simplified calculation - could be more sophisticated
    total_project_cost = Decimal('10000000')  # Default, should come from cost items
    total_developer_income = sum(flow.developer_separation + flow.developer_delivery for flow in payment_flows)
    
    # Assume costs are distributed evenly over construction period
    max_exposure = total_project_cost - (total_developer_income * Decimal('0.5'))  # 50% of income received early
    
    return max(max_exposure, Decimal('0'))

def generate_unit_sales_cash_flow_data(scenario_name: str, payment_flows: List[UnitSalesPaymentFlow]) -> List[Dict[str, Any]]:
    """Generar datos de flujo de caja para comparación gráfica"""
    
    # Generate monthly accumulated cash flow
    monthly_flow = {}
    
    for flow in payment_flows:
        # Add separation payment
        if flow.sale_month not in monthly_flow:
            monthly_flow[flow.sale_month] = 0
        monthly_flow[flow.sale_month] += float(flow.developer_separation)
        
        # Add delivery payment (12 months later)
        delivery_month = flow.sale_month + 12
        if delivery_month not in monthly_flow:
            monthly_flow[delivery_month] = 0
        monthly_flow[delivery_month] += float(flow.developer_delivery)
    
    # Generate accumulated flow data
    cash_flow_data = []
    accumulated = 0
    
    for month in sorted(monthly_flow.keys()):
        accumulated += monthly_flow[month]
        cash_flow_data.append({
            'month': f'Mes {month}',
            'scenario': scenario_name,
            'monthly_flow': monthly_flow[month],
            'accumulated_flow': accumulated
        })
    
    return cash_flow_data

def analyze_unit_sales_company_impact(scenarios: List[UnitSalesScenarioMetrics], project: ScenarioProject) -> Dict[str, Any]:
    """Analizar el impacto de las ventas por unidades en la empresa"""
    
    # Find conservative scenario for risk analysis
    conservative_scenario = next((s for s in scenarios if s.scenario_name.lower() == 'conservador'), scenarios[0])
    
    # Calculate impact metrics
    total_revenue = float(conservative_scenario.total_revenue)
    max_exposure = float(conservative_scenario.max_exposure or 0)
    
    return {
        'total_revenue_conservative': total_revenue,
        'max_capital_exposure': max_exposure,
        'liquidity_impact': {
            'recommended_credit_line': max_exposure * 1.2,
            'cash_reserve_needed': max_exposure * 0.15,
            'risk_level': 'HIGH' if max_exposure > 5000000 else 'MEDIUM' if max_exposure > 2000000 else 'LOW'
        },
        'recommendations': [
            f"Establecer línea de crédito de ${max_exposure * 1.2:,.0f}",
            "Acelerar ventas en primeros 6 meses con incentivos",
            "Negociar mejores términos de pago con proveedores",
            "Implementar sistema de seguimiento de flujo semanal"
        ]
    }

def generate_units_summary(scenarios: List[UnitSalesScenarioMetrics], units: List[ProjectUnit]) -> Dict[str, Any]:
    """Generar resumen de unidades por escenario"""
    
    total_units = len(units)
    
    summary = {
        'total_units_project': total_units,
        'scenarios_summary': []
    }
    
    for scenario in scenarios:
        scenario_summary = {
            'scenario_name': scenario.scenario_name,
            'units_sold': scenario.total_units_sold,
            'units_remaining': total_units - scenario.total_units_sold,
            'sales_rate_pct': (scenario.total_units_sold / total_units * 100) if total_units > 0 else 0,
            'total_revenue': float(scenario.total_revenue),
            'average_price_per_unit': float(scenario.total_revenue / scenario.total_units_sold) if scenario.total_units_sold > 0 else 0
        }
        summary['scenarios_summary'].append(scenario_summary)
    
    return summary

# --- Excel Template and Upload Endpoints ---

@router.get("/{project_id}/units/download-template")
async def download_units_template(project_id: int, db: Session = Depends(get_db)):
    """Descargar plantilla de Excel para cargar unidades masivamente"""
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Create sample data for the template
    template_data = {
        'unit_number': ['A-001', 'A-002', 'B-001', 'B-002'],
        'unit_type': ['APARTAMENTO', 'APARTAMENTO', 'APARTAMENTO', 'APARTAMENTO'],
        'construction_area_m2': [85.5, 95.0, 75.0, 105.0],
        'land_area_m2': [0, 0, 0, 0],
        'total_area_m2': [85.5, 95.0, 75.0, 105.0],
        'bedrooms': [2, 3, 2, 3],
        'bathrooms': [2.0, 2.5, 1.5, 2.5],
        'parking_spaces': [1, 1, 1, 2],
        'floor_level': [1, 1, 2, 2],
        'target_price_total': [85500, 95000, 75000, 105000],
        'price_per_m2_construction': [1000, 1000, 1000, 1000],
        'price_per_m2_land': [0, 0, 0, 0],
        'status': ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE'],
        'planned_sale_month': [1, 2, 3, 4],
        'sales_priority': [1, 1, 2, 1],
        'description': ['Apartamento tipo A', 'Apartamento tipo A+', 'Apartamento tipo B', 'Apartamento tipo B+'],
        'special_features': ['Balcón', 'Balcón + Walk-in closet', 'Vista al jardín', 'Vista al jardín + Balcón'],
        'notes': ['', '', '', '']
    }
    
    # Create DataFrame
    df = pd.DataFrame(template_data)
    
    # Create Excel file in memory
    excel_buffer = io.BytesIO()
    
    with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
        # Write main data sheet
        df.to_excel(writer, sheet_name='Unidades', index=False)
        
        # Create instructions sheet
        instructions_data = {
            'Campo': [
                'unit_number', 'unit_type', 'construction_area_m2', 'land_area_m2', 'total_area_m2',
                'bedrooms', 'bathrooms', 'parking_spaces', 'floor_level', 'target_price_total',
                'price_per_m2_construction', 'price_per_m2_land', 'status', 'planned_sale_month',
                'sales_priority', 'description', 'special_features', 'notes'
            ],
            'Descripción': [
                'Número único de la unidad (ej: A-001, B-002)',
                'Tipo: APARTAMENTO, CASA, LOTE, OFICINA, LOCAL',
                'Área de construcción en metros cuadrados',
                'Área de terreno en metros cuadrados (para casas/lotes)',
                'Área total en metros cuadrados',
                'Número de habitaciones',
                'Número de baños (puede ser decimal: 1.5, 2.5)',
                'Número de espacios de parqueo',
                'Nivel/piso de la unidad',
                'Precio objetivo total de venta',
                'Precio por m² de construcción',
                'Precio por m² de terreno',
                'Estado: AVAILABLE, RESERVED, SOLD, DELIVERED, CANCELLED',
                'Mes planificado de venta (1-60)',
                'Prioridad de venta (1=alta, 2=media, 3=baja)',
                'Descripción general de la unidad',
                'Características especiales',
                'Notas adicionales'
            ],
            'Requerido': [
                'Sí', 'Sí', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No',
                'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No'
            ],
            'Ejemplo': [
                'A-001', 'APARTAMENTO', '85.5', '0', '85.5', '2', '2.0', '1', '1', '85500',
                '1000', '0', 'AVAILABLE', '1', '1', 'Apartamento tipo A', 'Balcón', ''
            ]
        }
        
        instructions_df = pd.DataFrame(instructions_data)
        instructions_df.to_excel(writer, sheet_name='Instrucciones', index=False)
        
        # Adjust column widths
        workbook = writer.book
        for sheet_name in workbook.sheetnames:
            worksheet = workbook[sheet_name]
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
    
    excel_buffer.seek(0)
    
    # Return as streaming response
    return StreamingResponse(
        io.BytesIO(excel_buffer.read()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=plantilla_unidades_proyecto_{project_id}.xlsx"}
    )

@router.post("/{project_id}/units/upload-excel")
async def upload_units_from_excel(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Subir archivo Excel con unidades para crear masivamente"""
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")
    
    try:
        # Read Excel file
        contents = await file.read()
        excel_data = pd.read_excel(io.BytesIO(contents), sheet_name='Unidades')
        
        # Validate required columns
        required_columns = ['unit_number', 'unit_type']
        missing_columns = [col for col in required_columns if col not in excel_data.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Columnas requeridas faltantes: {', '.join(missing_columns)}"
            )
        
        # Process each row
        created_units = []
        errors = []
        
        for index, row in excel_data.iterrows():
            try:
                # Check if unit number already exists
                existing_unit = db.query(ProjectUnit).filter(
                    ProjectUnit.scenario_project_id == project_id,
                    ProjectUnit.unit_number == str(row['unit_number']),
                    ProjectUnit.is_active == True
                ).first()
                
                if existing_unit:
                    errors.append(f"Fila {index + 2}: La unidad {row['unit_number']} ya existe")
                    continue
                
                # Validate unit_type
                valid_types = ['APARTAMENTO', 'CASA', 'LOTE', 'OFICINA', 'LOCAL']
                unit_type = str(row['unit_type']).upper()
                if unit_type not in valid_types:
                    errors.append(f"Fila {index + 2}: Tipo de unidad inválido '{unit_type}'. Debe ser uno de: {', '.join(valid_types)}")
                    continue
                
                # Validate status if provided
                valid_statuses = ['AVAILABLE', 'RESERVED', 'SOLD', 'DELIVERED', 'CANCELLED']
                status = str(row.get('status', 'AVAILABLE')).upper()
                if status not in valid_statuses:
                    status = 'AVAILABLE'
                
                # Create unit object
                unit_data = {
                    'scenario_project_id': project_id,
                    'unit_number': str(row['unit_number']),
                    'unit_type': unit_type,
                    'status': status,
                    'is_active': True
                }
                
                # Add optional fields if they exist and are not null/empty
                optional_fields = [
                    'construction_area_m2', 'land_area_m2', 'total_area_m2', 'bedrooms',
                    'bathrooms', 'parking_spaces', 'floor_level', 'target_price_total',
                    'price_per_m2_construction', 'price_per_m2_land', 'planned_sale_month',
                    'sales_priority', 'description', 'special_features', 'notes'
                ]
                
                for field in optional_fields:
                    if field in row and pd.notna(row[field]) and str(row[field]).strip() != '':
                        value = row[field]
                        
                        # Convert numeric fields
                        if field in ['construction_area_m2', 'land_area_m2', 'total_area_m2', 
                                   'target_price_total', 'price_per_m2_construction', 'price_per_m2_land']:
                            try:
                                value = Decimal(str(value))
                            except:
                                errors.append(f"Fila {index + 2}: Valor inválido para {field}: {value}")
                                continue
                        
                        elif field in ['bedrooms', 'parking_spaces', 'floor_level', 'planned_sale_month', 'sales_priority']:
                            try:
                                value = int(float(value))
                            except:
                                errors.append(f"Fila {index + 2}: Valor inválido para {field}: {value}")
                                continue
                        
                        elif field == 'bathrooms':
                            try:
                                value = Decimal(str(value))
                            except:
                                errors.append(f"Fila {index + 2}: Valor inválido para {field}: {value}")
                                continue
                        
                        unit_data[field] = value
                
                # Create unit in database
                new_unit = ProjectUnit(**unit_data)
                db.add(new_unit)
                db.flush()  # Get the ID without committing
                
                created_units.append({
                    'id': new_unit.id,
                    'unit_number': new_unit.unit_number,
                    'unit_type': new_unit.unit_type,
                    'target_price_total': float(new_unit.target_price_total) if new_unit.target_price_total else None
                })
                
            except Exception as e:
                errors.append(f"Fila {index + 2}: Error al procesar unidad: {str(e)}")
                continue
        
        # Commit if there are successful units
        if created_units:
            db.commit()
        else:
            db.rollback()
        
        return {
            'success': len(created_units) > 0,
            'message': f"Procesadas {len(excel_data)} filas. Creadas {len(created_units)} unidades.",
            'created_units': created_units,
            'errors': errors,
            'summary': {
                'total_rows': len(excel_data),
                'created_count': len(created_units),
                'error_count': len(errors)
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al procesar archivo Excel: {str(e)}")
    finally:
        await file.close()

# --- Project Stages Management ---

@router.get("/{project_id}/stages", response_model=List[ProjectStageWithSubStages])
async def get_project_stages(project_id: int, db: Session = Depends(get_db)):
    """Obtener todas las etapas de un proyecto"""
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get all stages ordered by stage_order
    stages = db.query(ProjectStage).filter(
        ProjectStage.scenario_project_id == project_id,
        ProjectStage.parent_stage_id.is_(None)  # Only parent stages
    ).order_by(ProjectStage.stage_order).all()
    
    # Load sub-stages for each parent stage
    for stage in stages:
        sub_stages = db.query(ProjectStage).filter(
            ProjectStage.parent_stage_id == stage.id
        ).order_by(ProjectStage.stage_order).all()
        stage.sub_stages = sub_stages
    
    return stages

@router.post("/{project_id}/stages", response_model=ProjectStageSchema)
async def create_project_stage(
    project_id: int,
    stage: ProjectStageCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva etapa de proyecto"""
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Validate dates
    if stage.planned_start_date >= stage.planned_end_date:
        raise HTTPException(
            status_code=400, 
            detail="La fecha de inicio debe ser anterior a la fecha de fin"
        )
    
    # Check if stage_order is already used
    existing_stage = db.query(ProjectStage).filter(
        ProjectStage.scenario_project_id == project_id,
        ProjectStage.stage_order == stage.stage_order,
        ProjectStage.parent_stage_id == stage.parent_stage_id
    ).first()
    
    if existing_stage:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una etapa con el orden {stage.stage_order}"
        )
    
    # Validate parent stage if specified
    if stage.parent_stage_id:
        parent_stage = db.query(ProjectStage).filter(
            ProjectStage.id == stage.parent_stage_id,
            ProjectStage.scenario_project_id == project_id
        ).first()
        if not parent_stage:
            raise HTTPException(status_code=400, detail="Etapa padre no encontrada")
    
    # Calculate duration
    duration_days = (stage.planned_end_date - stage.planned_start_date).days
    
    # Create stage
    stage_data = stage.dict()
    stage_data['scenario_project_id'] = project_id
    stage_data['planned_duration_days'] = duration_days
    
    new_stage = ProjectStage(**stage_data)
    db.add(new_stage)
    db.commit()
    db.refresh(new_stage)
    
    return new_stage

@router.put("/{project_id}/stages/{stage_id}", response_model=ProjectStageSchema)
async def update_project_stage(
    project_id: int,
    stage_id: int,
    stage_update: ProjectStageUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una etapa de proyecto"""
    
    # Get stage
    stage = db.query(ProjectStage).filter(
        ProjectStage.id == stage_id,
        ProjectStage.scenario_project_id == project_id
    ).first()
    
    if not stage:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")
    
    # Update fields
    update_data = stage_update.dict(exclude_unset=True)
    
    # Validate dates if provided
    start_date = update_data.get('planned_start_date', stage.planned_start_date)
    end_date = update_data.get('planned_end_date', stage.planned_end_date)
    
    if start_date and end_date and start_date >= end_date:
        raise HTTPException(
            status_code=400,
            detail="La fecha de inicio debe ser anterior a la fecha de fin"
        )
    
    # Update duration if dates changed
    if 'planned_start_date' in update_data or 'planned_end_date' in update_data:
        update_data['planned_duration_days'] = (end_date - start_date).days
    
    # Update actual duration if actual dates changed
    if 'actual_start_date' in update_data or 'actual_end_date' in update_data:
        actual_start = update_data.get('actual_start_date', stage.actual_start_date)
        actual_end = update_data.get('actual_end_date', stage.actual_end_date)
        if actual_start and actual_end:
            update_data['actual_duration_days'] = (actual_end - actual_start).days
    
    # Apply updates
    for field, value in update_data.items():
        setattr(stage, field, value)
    
    db.commit()
    db.refresh(stage)
    
    return stage

@router.delete("/{project_id}/stages/{stage_id}")
async def delete_project_stage(
    project_id: int,
    stage_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar una etapa de proyecto"""
    
    # Get stage
    stage = db.query(ProjectStage).filter(
        ProjectStage.id == stage_id,
        ProjectStage.scenario_project_id == project_id
    ).first()
    
    if not stage:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")
    
    # Check if stage has sub-stages
    sub_stages = db.query(ProjectStage).filter(
        ProjectStage.parent_stage_id == stage_id
    ).count()
    
    if sub_stages > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar una etapa que tiene sub-etapas. Elimine primero las sub-etapas."
        )
    
    # Check if stage is referenced in dependencies
    dependent_stages = db.query(ProjectStage).filter(
        ProjectStage.scenario_project_id == project_id,
        ProjectStage.dependencies.contains([stage_id])
    ).count()
    
    if dependent_stages > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar una etapa que es dependencia de otras etapas."
        )
    
    db.delete(stage)
    db.commit()
    
    return {"message": "Etapa eliminada exitosamente"}

@router.get("/{project_id}/stages/templates", response_model=ProjectStageTemplateResponse)
async def get_stage_templates(project_id: int, project_type: str = "RESIDENTIAL"):
    """Obtener templates de etapas predefinidas según el tipo de proyecto"""
    
    # Templates para proyectos residenciales
    residential_templates = [
        {
            "stage_type": "PRELIMINARY",
            "stage_name": "Etapa Preliminar",
            "description": "Estudios iniciales, análisis de factibilidad y diseño conceptual",
            "typical_duration_days": 60,
            "typical_dependencies": [],
            "typical_deliverables": [
                "Estudio de factibilidad",
                "Análisis de mercado",
                "Diseño conceptual",
                "Presupuesto preliminar"
            ],
            "risk_level": "MEDIUM",
            "required_personnel": {
                "architects": 1,
                "engineers": 1,
                "market_analyst": 1
            }
        },
        {
            "stage_type": "DESIGN",
            "stage_name": "Diseño y Ingeniería",
            "description": "Desarrollo de planos arquitectónicos y de ingeniería",
            "typical_duration_days": 90,
            "typical_dependencies": ["PRELIMINARY"],
            "typical_deliverables": [
                "Planos arquitectónicos",
                "Planos estructurales",
                "Planos MEP",
                "Especificaciones técnicas"
            ],
            "risk_level": "MEDIUM",
            "required_personnel": {
                "architects": 2,
                "structural_engineers": 1,
                "mep_engineers": 2
            }
        },
        {
            "stage_type": "PERMITS",
            "stage_name": "Permisos y Licencias",
            "description": "Obtención de permisos de construcción y licencias",
            "typical_duration_days": 120,
            "typical_dependencies": ["DESIGN"],
            "typical_deliverables": [
                "Permiso de construcción",
                "Licencia ambiental",
                "Permisos municipales",
                "Aprobaciones de bomberos"
            ],
            "risk_level": "HIGH",
            "required_personnel": {
                "legal_advisor": 1,
                "permit_specialist": 1
            }
        },
        {
            "stage_type": "SITE_PREP",
            "stage_name": "Preparación del Sitio",
            "description": "Limpieza, nivelación y preparación del terreno",
            "typical_duration_days": 30,
            "typical_dependencies": ["PERMITS"],
            "typical_deliverables": [
                "Limpieza del terreno",
                "Nivelación",
                "Accesos temporales",
                "Instalaciones provisionales"
            ],
            "risk_level": "LOW",
            "required_personnel": {
                "site_supervisor": 1,
                "operators": 3,
                "workers": 8
            }
        },
        {
            "stage_type": "FOUNDATION",
            "stage_name": "Cimentación",
            "description": "Excavación y construcción de cimientos",
            "typical_duration_days": 45,
            "typical_dependencies": ["SITE_PREP"],
            "typical_deliverables": [
                "Excavación completa",
                "Cimientos terminados",
                "Instalaciones subterráneas",
                "Impermeabilización"
            ],
            "risk_level": "MEDIUM",
            "required_personnel": {
                "site_supervisor": 1,
                "structural_specialist": 1,
                "workers": 12
            }
        },
        {
            "stage_type": "STRUCTURE",
            "stage_name": "Estructura",
            "description": "Construcción de la estructura principal",
            "typical_duration_days": 120,
            "typical_dependencies": ["FOUNDATION"],
            "typical_deliverables": [
                "Estructura de concreto",
                "Mampostería",
                "Estructura de techo",
                "Instalaciones básicas"
            ],
            "risk_level": "MEDIUM",
            "required_personnel": {
                "site_supervisor": 1,
                "structural_specialist": 1,
                "workers": 20
            }
        },
        {
            "stage_type": "MEP",
            "stage_name": "Instalaciones MEP",
            "description": "Instalaciones mecánicas, eléctricas y plomería",
            "typical_duration_days": 60,
            "typical_dependencies": ["STRUCTURE"],
            "typical_deliverables": [
                "Instalaciones eléctricas",
                "Instalaciones sanitarias",
                "Instalaciones de gas",
                "Sistemas de climatización"
            ],
            "risk_level": "MEDIUM",
            "required_personnel": {
                "electrical_supervisor": 1,
                "plumbing_supervisor": 1,
                "electricians": 4,
                "plumbers": 4
            }
        },
        {
            "stage_type": "FINISHES",
            "stage_name": "Acabados",
            "description": "Acabados interiores y exteriores",
            "typical_duration_days": 90,
            "typical_dependencies": ["MEP"],
            "typical_deliverables": [
                "Pisos terminados",
                "Pintura completa",
                "Puertas y ventanas",
                "Accesorios de baño"
            ],
            "risk_level": "LOW",
            "required_personnel": {
                "finishes_supervisor": 1,
                "painters": 6,
                "tile_installers": 4,
                "carpenters": 4
            }
        },
        {
            "stage_type": "DELIVERY",
            "stage_name": "Entrega",
            "description": "Inspecciones finales y entrega del proyecto",
            "typical_duration_days": 30,
            "typical_dependencies": ["FINISHES"],
            "typical_deliverables": [
                "Inspecciones finales",
                "Certificados de ocupación",
                "Manuales de usuario",
                "Garantías"
            ],
            "risk_level": "LOW",
            "required_personnel": {
                "project_manager": 1,
                "quality_inspector": 1
            }
        }
    ]
    
    # Templates para proyectos comerciales (simplificado)
    commercial_templates = [
        {
            "stage_type": "PRELIMINARY",
            "stage_name": "Etapa Preliminar",
            "description": "Estudios iniciales y análisis de factibilidad comercial",
            "typical_duration_days": 45,
            "typical_dependencies": [],
            "typical_deliverables": ["Estudio de factibilidad", "Análisis de mercado"],
            "risk_level": "MEDIUM"
        },
        {
            "stage_type": "DESIGN",
            "stage_name": "Diseño",
            "description": "Desarrollo de planos y especificaciones",
            "typical_duration_days": 75,
            "typical_dependencies": ["PRELIMINARY"],
            "typical_deliverables": ["Planos arquitectónicos", "Especificaciones"],
            "risk_level": "MEDIUM"
        },
        {
            "stage_type": "CONSTRUCTION",
            "stage_name": "Construcción",
            "description": "Construcción completa del proyecto",
            "typical_duration_days": 180,
            "typical_dependencies": ["DESIGN"],
            "typical_deliverables": ["Proyecto terminado"],
            "risk_level": "MEDIUM"
        },
        {
            "stage_type": "DELIVERY",
            "stage_name": "Entrega",
            "description": "Entrega del proyecto",
            "typical_duration_days": 15,
            "typical_dependencies": ["CONSTRUCTION"],
            "typical_deliverables": ["Proyecto entregado"],
            "risk_level": "LOW"
        }
    ]
    
    templates = residential_templates if project_type == "RESIDENTIAL" else commercial_templates
    
    return {
        "templates": templates,
        "project_types": ["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"]
    }



@router.post("/{project_id}/stages/create-defaults")
async def create_default_stages(
    project_id: int,
    request: CreateDefaultStagesRequest,
    db: Session = Depends(get_db)
):
    """Crear etapas por defecto para un proyecto"""
    
    project_type = request.project_type
    
    # Use today as start date if not provided
    from datetime import date
    start_date = date.today()
    
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Check if project already has stages
    existing_stages = db.query(ProjectStage).filter(
        ProjectStage.scenario_project_id == project_id
    ).count()
    
    if existing_stages > 0:
        raise HTTPException(
            status_code=400,
            detail="El proyecto ya tiene etapas definidas. Elimínelas primero si desea usar un template."
        )
    
    # Get templates
    templates_response = await get_stage_templates(project_id, project_type)
    templates = templates_response['templates']
    
    # Create stages from templates
    created_stages = []
    current_date = start_date
    
    for i, template in enumerate(templates, 1):
        # Calculate end date
        end_date = current_date + timedelta(days=template['typical_duration_days'])
        
        # Create stage
        stage_data = {
            'scenario_project_id': project_id,
            'stage_name': template['stage_name'],
            'stage_type': template['stage_type'],
            'description': template['description'],
            'stage_order': i,
            'planned_start_date': current_date,
            'planned_end_date': end_date,
            'planned_duration_days': template['typical_duration_days'],
            'risk_level': template['risk_level'],
            'deliverables': template['typical_deliverables'],
            'required_personnel': template.get('required_personnel')
        }
        
        new_stage = ProjectStage(**stage_data)
        db.add(new_stage)
        db.flush()  # Get ID without committing
        
        created_stages.append(new_stage)
        
        # Next stage starts when current one ends (no overlap by default)
        current_date = end_date
    
    # Update project dates
    project.start_date = start_date
    project.end_date = current_date
    
    db.commit()
    
    # Refresh all stages
    for stage in created_stages:
        db.refresh(stage)
    
    return {
        "message": f"Se crearon {len(created_stages)} etapas basadas en el template {project_type}",
        "stages": created_stages,
        "project_start_date": start_date,
        "project_end_date": current_date,
        "total_duration_days": (current_date - start_date).days
    }

@router.post("/{project_id}/stages/create-from-template")
async def create_stages_from_template(
    project_id: int,
    project_type: str,
    start_date: date,
    db: Session = Depends(get_db)
):
    """Crear etapas de proyecto basadas en un template (endpoint alternativo)"""
    
    # Call the main function with a proper request object
    request = CreateDefaultStagesRequest(project_type=project_type)
    return await create_default_stages(project_id, request, db)

@router.get("/{project_id}/stages/timeline")
async def get_project_stages_timeline(project_id: int, db: Session = Depends(get_db)):
    """Obtener cronograma de etapas del proyecto (formato para frontend)"""
    
    # Get project
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get all stages
    stages = db.query(ProjectStage).filter(
        ProjectStage.scenario_project_id == project_id
    ).order_by(ProjectStage.stage_order).all()
    
    if not stages:
        return {
            "project_id": project_id,
            "project_name": project.name,
            "total_duration_days": 0,
            "earliest_start": "",
            "latest_end": "",
            "stages": [],
            "critical_path_stages": [],
            "potential_delays": []
        }
    
    # Calculate project timeline
    earliest_start = min(stage.planned_start_date for stage in stages)
    latest_end = max(stage.planned_end_date for stage in stages)
    total_duration = (latest_end - earliest_start).days
    
    # Build stages with timeline position
    timeline_stages = []
    for stage in stages:
        start_offset = (stage.planned_start_date - earliest_start).days
        duration = (stage.planned_end_date - stage.planned_start_date).days
        
        timeline_stages.append({
            "stage": stage,
            "timeline_position": {
                "start_offset_days": start_offset,
                "duration_days": duration,
                "overlap_with_previous": 0  # TODO: Calculate overlap
            },
            "critical_path": True,  # Simplified - all stages are critical for now
            "dependencies_met": True
        })
    
    # Simple critical path (all stages for now)
    critical_path_stages = [stage.id for stage in stages]
    
    # Potential delays based on risk level
    potential_delays = []
    for stage in stages:
        if stage.risk_level in ['HIGH', 'CRITICAL']:
            potential_delay_days = 7 if stage.risk_level == 'HIGH' else 14
            potential_delays.append({
                "stage_id": stage.id,
                "stage_name": stage.stage_name,
                "risk_level": stage.risk_level,
                "potential_delay_days": potential_delay_days,
                "impact_on_project": f"Posible retraso de {potential_delay_days} días"
            })
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_duration_days": total_duration,
        "earliest_start": earliest_start.isoformat(),
        "latest_end": latest_end.isoformat(),
        "stages": timeline_stages,
        "critical_path_stages": critical_path_stages,
        "potential_delays": potential_delays
    }

@router.get("/{project_id}/timeline", response_model=ProjectTimelineResponse)
async def get_project_timeline(project_id: int, db: Session = Depends(get_db)):
    """Obtener cronograma completo del proyecto con análisis"""
    
    # Get project
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get all stages
    stages = db.query(ProjectStage).filter(
        ProjectStage.scenario_project_id == project_id
    ).order_by(ProjectStage.stage_order).all()
    
    if not stages:
        raise HTTPException(status_code=404, detail="El proyecto no tiene etapas definidas")
    
    # Calculate project timeline
    start_date = min(stage.planned_start_date for stage in stages)
    end_date = max(stage.planned_end_date for stage in stages)
    total_duration = (end_date - start_date).days
    
    # Organize stages with sub-stages
    parent_stages = []
    for stage in stages:
        if stage.parent_stage_id is None:
            stage.sub_stages = [s for s in stages if s.parent_stage_id == stage.id]
            parent_stages.append(stage)
    
    # Basic schedule analysis
    delayed_stages = [
        {
            "stage_id": stage.id,
            "stage_name": stage.stage_name,
            "delay_days": stage.actual_duration_days - stage.planned_duration_days if stage.actual_duration_days else 0
        }
        for stage in stages 
        if stage.actual_duration_days and stage.actual_duration_days > stage.planned_duration_days
    ]
    
    # Calculate overlaps
    total_overlapping_days = 0
    for i, stage in enumerate(stages[:-1]):
        next_stage = stages[i + 1]
        if stage.planned_end_date > next_stage.planned_start_date:
            overlap_days = (stage.planned_end_date - next_stage.planned_start_date).days
            total_overlapping_days += overlap_days
    
    # Generate recommendations
    recommendations = []
    if delayed_stages:
        recommendations.append(f"Hay {len(delayed_stages)} etapas con retrasos")
    if total_overlapping_days > 0:
        recommendations.append(f"Hay {total_overlapping_days} días de traslape entre etapas")
    
    # Simple critical path (stages without dependencies)
    critical_path = [stage.id for stage in stages if not stage.dependencies]
    
    schedule_analysis = {
        "total_project_duration_days": total_duration,
        "critical_path": critical_path,
        "total_overlapping_days": total_overlapping_days,
        "stages_with_delays": delayed_stages,
        "resource_conflicts": [],  # TODO: Implement resource conflict detection
        "recommendations": recommendations
    }
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_duration_days": total_duration,
        "start_date": start_date,
        "end_date": end_date,
        "stages": parent_stages,
        "schedule_analysis": schedule_analysis
    }

@router.post("/{project_id}/transition-to-draft", response_model=ProjectTransitionResponse)
def transition_to_draft(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Transición de PLANNING a DRAFT - completar información básica"""
    
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status != "PLANNING":
        raise HTTPException(status_code=400, detail=f"No se puede cambiar de estado {project.status} a DRAFT")
    
    # Validaciones para permitir transición a DRAFT
    errors = []
    
    if not project.name or len(project.name.strip()) < 3:
        errors.append("El nombre del proyecto debe tener al menos 3 caracteres")
    
    if not project.location:
        errors.append("La ubicación del proyecto es obligatoria")
    
    if not project.total_area_m2 or project.total_area_m2 <= 0:
        errors.append("El área total del proyecto debe ser mayor a 0")
    
    if not project.total_units or project.total_units <= 0:
        errors.append("El número total de unidades debe ser mayor a 0")
    
    if errors:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede pasar a DRAFT. Errores: {'; '.join(errors)}"
        )
    
    try:
        project.status = "DRAFT"
        project.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Proyecto movido a DRAFT exitosamente. Ya puede agregar costos y hacer cálculos financieros.",
            "project_id": project_id,
            "new_status": "DRAFT"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado: {str(e)}")

@router.post("/{project_id}/transition-to-review", response_model=ProjectTransitionResponse)
def transition_to_review(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Transición de DRAFT a UNDER_REVIEW - validar que tiene costos y métricas"""
    
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status != "DRAFT":
        raise HTTPException(status_code=400, detail=f"No se puede cambiar de estado {project.status} a UNDER_REVIEW")
    
    # Validaciones para permitir transición a UNDER_REVIEW
    errors = []
    
    # Verificar que tiene items de costo
    cost_items = db.query(ScenarioCostItem).filter(
        ScenarioCostItem.scenario_project_id == project_id,
        ScenarioCostItem.is_active == True
    ).count()
    
    if cost_items == 0:
        errors.append("El proyecto debe tener al menos un item de costo")
    
    # Verificar que tiene métricas financieras calculadas
    metrics = db.query(ProjectFinancialMetrics).filter(
        ProjectFinancialMetrics.scenario_project_id == project_id
    ).first()
    
    if not metrics or not metrics.npv:
        errors.append("El proyecto debe tener métricas financieras calculadas (NPV, TIR, etc.)")
    
    # Verificar que las métricas son viables
    if metrics and metrics.npv and float(metrics.npv) <= 0:
        errors.append("El NPV del proyecto debe ser positivo para enviarlo a revisión")
    
    # TIR bajo es solo una advertencia, no impide la transición
    low_irr_warning = None
    if metrics and metrics.irr and float(metrics.irr) < 0.05:  # 5% mínimo
        low_irr_warning = f"⚠️ ADVERTENCIA: La TIR del proyecto es {float(metrics.irr)*100:.2f}%, menor al 5% recomendado"
    
    if errors:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede enviar a revisión. Errores: {'; '.join(errors)}"
        )
    
    try:
        project.status = "UNDER_REVIEW"
        project.updated_at = datetime.utcnow()
        db.commit()
        
        # Construir mensaje de respuesta
        message = "Proyecto enviado a revisión exitosamente. Esperando aprobación de la dirección."
        if low_irr_warning:
            message += f"\n\n{low_irr_warning}"
        
        return {
            "success": True,
            "message": message,
            "project_id": project_id,
            "new_status": "UNDER_REVIEW",
            "metrics": {
                "npv": float(metrics.npv) if metrics and metrics.npv else None,
                "irr": float(metrics.irr) if metrics and metrics.irr else None,
                "cost_items_count": cost_items
            },
            "warnings": [low_irr_warning] if low_irr_warning else []
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al cambiar estado: {str(e)}")

# New endpoints for managing sales projections

@router.get("/{project_id}/sales-projections", response_model=List[SalesProjection])
async def get_project_sales_projections(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get all sales projections for a project"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    projections = get_sales_projections_by_project(db, project_id)
    return [SalesProjection(**proj) for proj in projections]

@router.get("/{project_id}/sales-projections/active", response_model=Optional[SalesProjection])
async def get_active_sales_projection_endpoint(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get the active sales projection for a project"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    projection = get_active_sales_projection(db, project_id)
    return SalesProjection(**projection) if projection else None

@router.post("/{project_id}/sales-projections/{projection_id}/activate")
async def activate_sales_projection(
    project_id: int,
    projection_id: int,
    db: Session = Depends(get_db)
):
    """Activate a specific sales projection"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    success = set_active_projection(db, project_id, projection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Proyección no encontrada")
    
    db.commit()
    return {"message": "Proyección activada exitosamente"}

@router.delete("/{project_id}/sales-projections/{projection_id}")
async def delete_sales_projection_endpoint(
    project_id: int,
    projection_id: int,
    db: Session = Depends(get_db)
):
    """Delete a sales projection"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    success = delete_sales_projection(db, projection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Proyección no encontrada")
    
    db.commit()
    return {"message": "Proyección eliminada exitosamente"}

@router.get("/{project_id}/cash-flow-with-projections")
async def get_project_cash_flow_with_sales_projections(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get project cash flow combined with active sales projection data"""
    # Verify project exists
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get the standard cash flow
    standard_cash_flow = await get_project_cash_flow(project_id, db)
    
    # Get active sales projection
    active_projection = get_active_sales_projection(db, project_id)
    
    if not active_projection:
        # Return standard cash flow if no active projection
        return {
            "project_id": project_id,
            "has_active_projection": False,
            "cash_flow": standard_cash_flow,
            "projection_data": None
        }
    
    # Combine cash flow with projection data
    enhanced_cash_flow = combine_cash_flow_with_projection(
        standard_cash_flow, active_projection
    )
    
    return {
        "project_id": project_id,
        "has_active_projection": True,
        "cash_flow": enhanced_cash_flow,
        "projection_data": active_projection,
        "scenario_name": active_projection["scenario_name"]
    }

def combine_cash_flow_with_projection(standard_cash_flow, sales_projection):
    """Combine standard cash flow with detailed sales projection data"""
    try:
        monthly_revenue = sales_projection["monthly_revenue"]
        
        # Convert SQLAlchemy objects to dictionaries if needed
        if hasattr(standard_cash_flow, '__iter__') and not isinstance(standard_cash_flow, (str, dict)):
            # This is a list of SQLAlchemy objects
            cash_flow_data = []
            for cf in standard_cash_flow:
                if hasattr(cf, '__dict__'):
                    # Convert SQLAlchemy object to dictionary
                    cf_dict = {
                        'id': cf.id,
                        'scenario_project_id': cf.scenario_project_id,
                        'year': cf.year,
                        'month': cf.month,
                        'period_label': cf.period_label,
                        'ingresos_ventas': float(cf.ingresos_ventas) if cf.ingresos_ventas else 0.0,
                        'ingresos_otros': float(cf.ingresos_otros) if cf.ingresos_otros else 0.0,
                        'total_ingresos': float(cf.total_ingresos) if cf.total_ingresos else 0.0,
                        'costos_terreno': float(cf.costos_terreno) if cf.costos_terreno else 0.0,
                        'costos_duros': float(cf.costos_duros) if cf.costos_duros else 0.0,
                        'costos_blandos': float(cf.costos_blandos) if cf.costos_blandos else 0.0,
                        'costos_financiacion': float(cf.costos_financiacion) if cf.costos_financiacion else 0.0,
                        'costos_marketing': float(cf.costos_marketing) if cf.costos_marketing else 0.0,
                        'otros_egresos': float(cf.otros_egresos) if cf.otros_egresos else 0.0,
                        'total_egresos': float(cf.total_egresos) if cf.total_egresos else 0.0,
                        'flujo_neto': float(cf.flujo_neto) if cf.flujo_neto else 0.0,
                        'flujo_acumulado': float(cf.flujo_acumulado) if cf.flujo_acumulado else 0.0,
                        'flujo_descontado': float(cf.flujo_descontado) if cf.flujo_descontado else 0.0,
                        'created_at': cf.created_at.isoformat() if cf.created_at else None,
                        'updated_at': cf.updated_at.isoformat() if cf.updated_at else None
                    }
                    cash_flow_data.append(cf_dict)
                else:
                    cash_flow_data.append(cf)
        elif isinstance(standard_cash_flow, dict) and 'data' in standard_cash_flow:
            cash_flow_data = standard_cash_flow['data']
        else:
            cash_flow_data = standard_cash_flow
        
        # Filter out BASELINE duplicates to avoid double counting
        filtered_data = []
        for item in cash_flow_data:
            # Skip BASELINE entries to avoid duplicates
            if "(BASELINE)" not in item.get('period_label', ''):
                filtered_data.append(item)
        
        # Enhance each month's data with projection details
        enhanced_data = []
        accumulated_flow = 0.0
        
        for month_data in filtered_data:
            enhanced_month = dict(month_data)  # Copy existing data
            
            # Try to match this month with projection data
            month_key = f"month_{month_data.get('month', 0)}"
            if month_key in monthly_revenue:
                projection_month = monthly_revenue[month_key]
                enhanced_month['projection_details'] = {
                    'units_sold': projection_month.get('units_sold', 0),
                    'developer_income': projection_month.get('developer_income', 0),
                    'credit_line_usage': projection_month.get('credit_line_usage', 0),
                    'has_projection_data': True
                }
                
                # Replace or enhance revenue with projection data if available
                if projection_month.get('developer_income', 0) > 0:
                    enhanced_month['ingresos_ventas'] = projection_month['developer_income']
                    enhanced_month['total_ingresos'] = projection_month['developer_income']
                    
                    # Recalculate net flow
                    enhanced_month['flujo_neto'] = enhanced_month['total_ingresos'] - enhanced_month['total_egresos']
                    enhanced_month['enhanced_by_projection'] = True
            else:
                enhanced_month['projection_details'] = {
                    'has_projection_data': False
                }
            
            # Recalculate accumulated flow progressively
            accumulated_flow += enhanced_month['flujo_neto']
            enhanced_month['flujo_acumulado'] = accumulated_flow
            
            enhanced_data.append(enhanced_month)
        
        # Return in same format as input
        if isinstance(standard_cash_flow, dict) and 'data' in standard_cash_flow:
            return {
                **standard_cash_flow,
                'data': enhanced_data,
                'enhanced_by_projection': True
            }
        else:
            return enhanced_data
            
    except Exception as e:
        print(f"Error combining cash flow with projection: {e}")
        return standard_cash_flow  # Return original if enhancement fails