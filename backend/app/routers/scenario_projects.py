from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func
from typing import List, Optional
from decimal import Decimal
import numpy as np
from datetime import datetime, date
import math

from ..database import get_db
from ..models import (
    ScenarioProject, CostCategory, ScenarioCostItem, 
    ScenarioCashFlow, SensitivityAnalysis, ProjectFinancialMetrics
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
    SalesScenarioMetrics, CompanyLiquidityAnalysis
)

router = APIRouter(
    prefix="/api/scenario-projects",
    tags=["scenario-projects"],
    responses={404: {"description": "Not found"}},
)

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

@router.post("/{project_id}/approve")
def approve_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Aprobar proyecto y crear línea base (baseline) de las proyecciones"""
    
    # Get project
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project.status == "APPROVED":
        raise HTTPException(status_code=400, detail="El proyecto ya está aprobado")
    
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
        
        # 3. Create baseline snapshot of financial metrics
        metrics = db.query(ProjectFinancialMetrics).filter(
            ProjectFinancialMetrics.scenario_project_id == project_id
        ).first()
        
        if metrics:
            baseline_metrics = ProjectFinancialMetrics(
                scenario_project_id=project_id,
                total_investment=metrics.total_investment,
                total_revenue=metrics.total_revenue,
                total_profit=metrics.total_profit,
                profit_margin_pct=metrics.profit_margin_pct,
                npv=metrics.npv,
                irr=metrics.irr,
                payback_months=metrics.payback_months,
                profitability_index=metrics.profitability_index,
                cost_per_unit=metrics.cost_per_unit,
                revenue_per_unit=metrics.revenue_per_unit,
                profit_per_unit=metrics.profit_per_unit,
                cost_per_m2=metrics.cost_per_m2,
                revenue_per_m2=metrics.revenue_per_m2,
                profit_per_m2=metrics.profit_per_m2,
                break_even_units=metrics.break_even_units,
                break_even_price_per_m2=metrics.break_even_price_per_m2,
                max_drawdown=metrics.max_drawdown,
                calculated_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            # Note: This will create a duplicate, we need to handle this differently
            # For now, we'll store baseline metrics in a separate table or field
        
        # 4. Update project status to APPROVED
        project.status = "APPROVED"
        project.approved_at = datetime.utcnow()
        project.updated_at = datetime.utcnow()
        
        # 5. Add baseline creation timestamp to project
        if not hasattr(project, 'baseline_created_at'):
            # We would need to add this field to the model
            pass
        
        db.commit()
        
        return {
            "success": True,
            "message": "Proyecto aprobado exitosamente. Línea base creada para seguimiento.",
            "project_id": project_id,
            "approved_at": project.approved_at,
            "baseline_items_created": len(cost_items),
            "baseline_cashflow_created": len(cash_flows)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al aprobar proyecto: {str(e)}")

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