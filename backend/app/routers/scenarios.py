from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func, case
from typing import List, Optional
from decimal import Decimal
import numpy as np
from datetime import datetime, date
import math

from ..database import get_db
from ..models import (
    ScenarioProject, CostCategory, ScenarioCostItem, 
    ScenarioCashFlow, SensitivityAnalysis, ProjectFinancialMetrics,
    ProjectUnit, UnitSalesSimulation, User
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
    # New schemas for project units
    ProjectUnit, ProjectUnitCreate, ProjectUnitUpdate, ProjectUnitsBulkCreate,
    ProjectUnitsStats,
    UnitSalesSimulation, UnitSalesSimulationCreate, UnitSalesSimulationUpdate
)
from ..auth import get_current_user

router = APIRouter(
    prefix="/api/scenarios",
    tags=["scenarios"],
    responses={404: {"description": "Not found"}},
)

# --- Scenario Projects CRUD ---

@router.get("/projects", response_model=ScenarioProjectsListResponse)
async def list_scenario_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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

@router.post("/projects", response_model=ScenarioProjectSchema)
async def create_scenario_project(
    project: ScenarioProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo proyecto de escenario"""
    db_project = ScenarioProject(**project.dict())
    db_project.created_by = current_user.username
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/projects/{project_id}", response_model=ScenarioProjectWithDetails)
async def get_scenario_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

@router.put("/projects/{project_id}", response_model=ScenarioProjectSchema)
async def update_scenario_project(
    project_id: int,
    project_update: ScenarioProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar un proyecto de escenario"""
    db_project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Update fields
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, field, value)
    
    db_project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/projects/{project_id}")
async def delete_scenario_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un proyecto de escenario"""
    db_project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    db.delete(db_project)
    db.commit()
    
    return {"message": "Proyecto eliminado exitosamente"}

# --- Project Units Endpoints ---

@router.get("/projects/{project_id}/units", response_model=List[ProjectUnit])
async def get_project_units(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las unidades de un proyecto"""
    units = db.query(ProjectUnit).filter(
        ProjectUnit.scenario_project_id == project_id,
        ProjectUnit.is_active == True
    ).offset(skip).limit(limit).all()
    return units

@router.post("/projects/{project_id}/units", response_model=ProjectUnit)
async def create_project_unit(
    project_id: int,
    unit: ProjectUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva unidad para un proyecto"""
    # Verificar que el proyecto existe
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Crear la unidad
    db_unit = ProjectUnit(
        scenario_project_id=project_id,
        **unit.dict()
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.get("/projects/{project_id}/units/stats", response_model=ProjectUnitsStats)
async def get_project_units_stats(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas de las unidades de un proyecto"""
    # Verificar que el proyecto existe
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    # Realizar consulta agregada
    stats = db.query(
        func.count(ProjectUnit.id).label("total_units"),
        func.sum(case((ProjectUnit.status == 'SOLD', 1), else_=0)).label("sold_units"),
        func.sum(case((ProjectUnit.status == 'AVAILABLE', 1), else_=0)).label("available_units"),
        func.sum(case((ProjectUnit.status == 'RESERVED', 1), else_=0)).label("reserved_units"),
        func.sum(ProjectUnit.price).label("total_value"),
        func.sum(case((ProjectUnit.status == 'SOLD', ProjectUnit.price), else_=0)).label("sold_value"),
        func.avg(ProjectUnit.price).label("average_price")
    ).filter(
        ProjectUnit.scenario_project_id == project_id,
        ProjectUnit.is_active == True
    ).one()

    return ProjectUnitsStats(
        total_units=stats.total_units or 0,
        sold_units=stats.sold_units or 0,
        available_units=stats.available_units or 0,
        reserved_units=stats.reserved_units or 0,
        total_value=float(stats.total_value or 0),
        sold_value=float(stats.sold_value or 0),
        average_price=float(stats.average_price or 0)
    )

@router.get("/units/{unit_id}", response_model=ProjectUnit)
async def get_project_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener una unidad específica"""
    unit = db.query(ProjectUnit).filter(ProjectUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    return unit

@router.put("/units/{unit_id}", response_model=ProjectUnit)
async def update_project_unit(
    unit_id: int,
    unit_update: ProjectUnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una unidad"""
    db_unit = db.query(ProjectUnit).filter(ProjectUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    
    # Actualizar campos
    for field, value in unit_update.dict(exclude_unset=True).items():
        setattr(db_unit, field, value)
    
    db_unit.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.delete("/units/{unit_id}")
async def delete_project_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una unidad (soft delete)"""
    db_unit = db.query(ProjectUnit).filter(ProjectUnit.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    
    db_unit.is_active = False
    db_unit.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Unidad eliminada exitosamente"}

@router.post("/projects/{project_id}/units/bulk", response_model=List[ProjectUnit])
async def create_bulk_project_units(
    project_id: int,
    units_data: ProjectUnitsBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear múltiples unidades de forma masiva"""
    # Verificar que el proyecto existe
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    created_units = []
    
    # Crear unidades según la configuración
    for i in range(units_data.quantity):
        unit_number = f"{units_data.unit_number_prefix}{units_data.start_number + i:0{units_data.number_padding}d}"
        
        db_unit = ProjectUnit(
            scenario_project_id=project_id,
            unit_number=unit_number,
            unit_type=units_data.unit_type,
            construction_area_m2=units_data.construction_area_m2,
            land_area_m2=units_data.land_area_m2,
            total_area_m2=units_data.total_area_m2,
            bedrooms=units_data.bedrooms,
            bathrooms=units_data.bathrooms,
            parking_spaces=units_data.parking_spaces,
            floor_level=units_data.floor_level + (i // units_data.units_per_floor) if units_data.units_per_floor else units_data.floor_level,
            target_price_total=units_data.target_price_total,
            price_per_m2_construction=units_data.price_per_m2_construction,
            price_per_m2_land=units_data.price_per_m2_land,
            description=units_data.description,
            sales_priority=units_data.sales_priority
        )
        
        db.add(db_unit)
        created_units.append(db_unit)
    
    db.commit()
    
    # Refresh all units
    for unit in created_units:
        db.refresh(unit)
    
    return created_units

# --- Unit Sales Simulation Endpoints ---

@router.post("/projects/{project_id}/sales-simulations", response_model=UnitSalesSimulation)
async def create_unit_sales_simulation(
    project_id: int,
    simulation: UnitSalesSimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva simulación de ventas por unidades"""
    # Verificar que el proyecto existe
    project = db.query(ScenarioProject).filter(ScenarioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Crear la simulación
    db_simulation = UnitSalesSimulation(
        scenario_project_id=project_id,
        **simulation.dict()
    )
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

@router.get("/projects/{project_id}/sales-simulations", response_model=List[UnitSalesSimulation])
async def get_project_sales_simulations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las simulaciones de ventas de un proyecto"""
    simulations = db.query(UnitSalesSimulation).filter(
        UnitSalesSimulation.scenario_project_id == project_id,
        UnitSalesSimulation.is_active == True
    ).all()
    return simulations

@router.get("/sales-simulations/{simulation_id}", response_model=UnitSalesSimulation)
async def get_sales_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener una simulación específica"""
    simulation = db.query(UnitSalesSimulation).filter(UnitSalesSimulation.id == simulation_id).first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    return simulation

@router.put("/sales-simulations/{simulation_id}", response_model=UnitSalesSimulation)
async def update_sales_simulation(
    simulation_id: int,
    simulation_update: UnitSalesSimulationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una simulación de ventas"""
    db_simulation = db.query(UnitSalesSimulation).filter(UnitSalesSimulation.id == simulation_id).first()
    if not db_simulation:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    
    # Actualizar campos
    for field, value in simulation_update.dict(exclude_unset=True).items():
        setattr(db_simulation, field, value)
    
    db_simulation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_simulation)
    return db_simulation

@router.post("/sales-simulations/{simulation_id}/calculate", response_model=UnitSalesSimulation)
async def calculate_sales_simulation_metrics(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calcular métricas financieras de una simulación de ventas"""
    simulation = db.query(UnitSalesSimulation).filter(UnitSalesSimulation.id == simulation_id).first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")
    
    # Obtener el proyecto y sus unidades
    project = db.query(ScenarioProject).filter(ScenarioProject.id == simulation.scenario_project_id).first()
    units = db.query(ProjectUnit).filter(
        ProjectUnit.scenario_project_id == simulation.scenario_project_id,
        ProjectUnit.is_active == True
    ).all()
    
    # Calcular métricas
    units_sales_schedule = simulation.units_sales_schedule
    total_revenue = 0
    total_units_to_sell = len(units_sales_schedule)
    max_month = 0
    
    for unit_id_str, month in units_sales_schedule.items():
        unit_id = int(unit_id_str)
        unit = next((u for u in units if u.id == unit_id), None)
        if unit and unit.target_price_total:
            total_revenue += float(unit.target_price_total)
            max_month = max(max_month, month)
    
    # Actualizar métricas
    simulation.total_revenue = total_revenue
    simulation.total_units_to_sell = total_units_to_sell
    simulation.sales_period_months = max_month
    simulation.average_monthly_sales = total_units_to_sell / max_month if max_month > 0 else 0
    simulation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(simulation)
    return simulation 