from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func
from typing import List, Optional
from decimal import Decimal
import numpy as np
from datetime import datetime, date, timedelta
import math

from ..database import get_db
from ..models import (
    ConstructionProject, ConstructionQuote, ProjectTakeoff, CostItem, 
    ConstructionAssembly, QuoteLineItem, ConstructionCostItem
)
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/construction-tracking",
    tags=["Construction Project Tracking"],
    responses={404: {"description": "Not found"}},
)

# === Pydantic Schemas ===

class ConstructionCostItemBase(BaseModel):
    categoria: str
    subcategoria: str
    partida_costo: str
    base_costo: str
    monto_proyectado: Optional[Decimal] = None
    monto_real: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    unit_of_measure: Optional[str] = None
    source_quote_id: Optional[int] = None
    source_line_item_id: Optional[int] = None
    status: str = "PLANNED"
    notes: Optional[str] = None
    is_active: bool = True

class ConstructionCostItemCreate(ConstructionCostItemBase):
    construction_project_id: int

class ConstructionCostItemUpdate(BaseModel):
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    partida_costo: Optional[str] = None
    monto_proyectado: Optional[Decimal] = None
    monto_real: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    start_month: Optional[int] = None
    duration_months: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class ConstructionCostItemSchema(ConstructionCostItemBase):
    id: int
    construction_project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConstructionCashFlowItem(BaseModel):
    year: int
    month: int
    period_label: str
    ingresos_pagos_cliente: Decimal
    total_ingresos: Decimal
    costos_materiales: Decimal
    costos_mano_obra: Decimal
    costos_equipos: Decimal
    costos_subcontratos: Decimal
    costos_administrativos: Decimal
    costos_financiacion: Decimal
    total_egresos: Decimal
    flujo_neto: Decimal
    flujo_acumulado: Decimal
    flujo_descontado: Decimal
    avance_obra_pct: Decimal  # % de avance de obra

class ConstructionMetrics(BaseModel):
    total_investment: Optional[Decimal] = None
    total_revenue: Optional[Decimal] = None
    total_profit: Optional[Decimal] = None
    profit_margin_pct: Optional[Decimal] = None
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None
    payback_months: Optional[int] = None
    profitability_index: Optional[Decimal] = None
    cost_per_m2: Optional[Decimal] = None
    revenue_per_m2: Optional[Decimal] = None
    profit_per_m2: Optional[Decimal] = None
    max_negative_exposure: Optional[Decimal] = None
    break_even_month: Optional[int] = None

class ClientPaymentScenarioConfig(BaseModel):
    scenario_name: str
    anticipo_percentage: Decimal = Field(default=Decimal('30'), description="% de anticipo")
    pago_avance_30_pct: Decimal = Field(default=Decimal('25'), description="Pago al 30% de avance")
    pago_avance_60_pct: Decimal = Field(default=Decimal('25'), description="Pago al 60% de avance")
    pago_final_entrega: Decimal = Field(default=Decimal('20'), description="Pago final en entrega")
    retraso_pagos_dias: int = Field(default=0, description="Días de retraso promedio en pagos")

class ConstructionScheduleScenario(BaseModel):
    scenario_name: str
    duration_adjustment_pct: Decimal = Field(description="% de ajuste en duración (+/- para adelanto/atraso)")
    cost_impact_pct: Decimal = Field(default=Decimal('0'), description="% de impacto en costos por cambio de cronograma")
    description: Optional[str] = None

class PaymentSimulationRequest(BaseModel):
    client_payment_scenarios: List[ClientPaymentScenarioConfig]
    schedule_scenarios: List[ConstructionScheduleScenario]

class PaymentSimulationResponse(BaseModel):
    success: bool
    message: str
    scenarios: List[dict]
    cash_flow_comparison: List[dict]
    company_impact: dict
    recommendations: List[str]

class FinancialCalculationRequest(BaseModel):
    construction_project_id: int
    recalculate_cash_flow: bool = True
    recalculate_metrics: bool = True

class FinancialCalculationResponse(BaseModel):
    success: bool
    message: str
    metrics: Optional[ConstructionMetrics] = None
    cash_flow_periods: int = 0

# === ENDPOINTS ===

@router.get("/projects/{project_id}/cost-items", response_model=List[ConstructionCostItemSchema])
async def get_project_cost_items(project_id: int, db: Session = Depends(get_db)):
    """Obtener items de costo de un proyecto de construcción"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get actual cost items from the database
    cost_items = db.query(ConstructionCostItem).filter(
        ConstructionCostItem.construction_project_id == project_id,
        ConstructionCostItem.is_active == True
    ).all()
    
    return cost_items

@router.post("/projects/{project_id}/cost-items", response_model=ConstructionCostItemSchema)
async def create_cost_item(
    project_id: int,
    cost_item: ConstructionCostItemCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo item de costo para un proyecto de construcción"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Create the cost item in the database
    db_cost_item = ConstructionCostItem(
        construction_project_id=project_id,
        **cost_item.dict(exclude={'construction_project_id'})
    )
    
    db.add(db_cost_item)
    db.commit()
    db.refresh(db_cost_item)
    
    return db_cost_item

@router.put("/projects/{project_id}/cost-items/{cost_item_id}", response_model=ConstructionCostItemSchema)
async def update_cost_item(
    project_id: int,
    cost_item_id: int,
    cost_item_update: ConstructionCostItemUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un item de costo existente"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get the cost item
    db_cost_item = db.query(ConstructionCostItem).filter(
        ConstructionCostItem.id == cost_item_id,
        ConstructionCostItem.construction_project_id == project_id
    ).first()
    
    if not db_cost_item:
        raise HTTPException(status_code=404, detail="Item de costo no encontrado")
    
    # Update the cost item with provided data
    update_data = cost_item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_cost_item, field, value)
    
    # Update timestamp
    db_cost_item.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_cost_item)
    
    return db_cost_item

@router.delete("/projects/{project_id}/cost-items/{cost_item_id}")
async def delete_cost_item(
    project_id: int,
    cost_item_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar o desactivar un item de costo"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get the cost item
    db_cost_item = db.query(ConstructionCostItem).filter(
        ConstructionCostItem.id == cost_item_id,
        ConstructionCostItem.construction_project_id == project_id
    ).first()
    
    if not db_cost_item:
        raise HTTPException(status_code=404, detail="Item de costo no encontrado")
    
    # Soft delete by setting is_active to False
    db_cost_item.is_active = False
    db_cost_item.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"success": True, "message": "Item de costo desactivado exitosamente"}

@router.get("/projects/{project_id}/cash-flow")
async def get_project_cash_flow(project_id: int, db: Session = Depends(get_db)):
    """Obtener flujo de caja proyectado del proyecto de construcción"""
    
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Get project duration or default to 12 months
    project_months = project.project_duration_days // 30 if project.project_duration_days else 12
    
    # Generate mock cash flow data
    cash_flow = []
    total_contract_value = Decimal('500000')  # Mock contract value
    cumulative_flow = Decimal('0')
    
    for month in range(1, project_months + 1):
        # Mock payment schedule (30% advance, then monthly progress payments)
        if month == 1:
            ingresos = total_contract_value * Decimal('0.30')  # 30% advance
        else:
            ingresos = total_contract_value * Decimal('0.70') / (project_months - 1)
        
        # Mock costs (front-loaded)
        costos_materiales = total_contract_value * Decimal('0.40') / project_months
        costos_mano_obra = total_contract_value * Decimal('0.25') / project_months
        costos_equipos = total_contract_value * Decimal('0.10') / project_months
        
        total_egresos = costos_materiales + costos_mano_obra + costos_equipos
        flujo_neto = ingresos - total_egresos
        cumulative_flow += flujo_neto
        
        avance_obra_pct = min(Decimal('100'), (Decimal(str(month)) / Decimal(str(project_months))) * Decimal('100'))
        
        cash_flow.append(ConstructionCashFlowItem(
            year=2024,
            month=month,
            period_label=f"Mes {month}",
            ingresos_pagos_cliente=ingresos,
            total_ingresos=ingresos,
            costos_materiales=costos_materiales,
            costos_mano_obra=costos_mano_obra,
            costos_equipos=costos_equipos,
            costos_subcontratos=Decimal('0'),
            costos_administrativos=total_contract_value * Decimal('0.05') / project_months,
            costos_financiacion=Decimal('0'),
            total_egresos=total_egresos,
            flujo_neto=flujo_neto,
            flujo_acumulado=cumulative_flow,
            flujo_descontado=flujo_neto / (Decimal('1.12') ** (Decimal(str(month)) / Decimal('12'))),
            avance_obra_pct=avance_obra_pct
        ))
    
    return cash_flow

@router.get("/projects/{project_id}/metrics", response_model=ConstructionMetrics)
async def get_project_metrics(project_id: int, db: Session = Depends(get_db)):
    """Obtener métricas financieras del proyecto de construcción"""
    
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Mock metrics calculation
    total_contract = Decimal('500000')
    total_costs = Decimal('400000')
    total_profit = total_contract - total_costs
    
    metrics = ConstructionMetrics(
        total_investment=total_costs,
        total_revenue=total_contract,
        total_profit=total_profit,
        profit_margin_pct=(total_profit / total_contract) * Decimal('100'),
        npv=Decimal('75000'),
        irr=Decimal('18.5'),
        payback_months=8,
        profitability_index=Decimal('1.19'),
        cost_per_m2=total_costs / (project.total_area_m2 or Decimal('100')),
        revenue_per_m2=total_contract / (project.total_area_m2 or Decimal('100')),
        profit_per_m2=total_profit / (project.total_area_m2 or Decimal('100')),
        max_negative_exposure=Decimal('150000'),
        break_even_month=6
    )
    
    return metrics

@router.post("/projects/{project_id}/calculate-financials", response_model=FinancialCalculationResponse)
async def calculate_project_financials(
    project_id: int,
    calculation_request: FinancialCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calcular métricas financieras del proyecto de construcción"""
    
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    try:
        # In a real implementation, you would:
        # 1. Calculate cash flows based on construction schedule and payment terms
        # 2. Calculate NPV, IRR, and other financial metrics
        # 3. Store results in database
        
        # For now, return mock calculation result
        metrics = await get_project_metrics(project_id, db)
        
        return FinancialCalculationResponse(
            success=True,
            message=f"Cálculos financieros completados para {project.project_name}",
            metrics=metrics,
            cash_flow_periods=project.project_duration_days // 30 if project.project_duration_days else 12
        )
        
    except Exception as e:
        return FinancialCalculationResponse(
            success=False,
            message=f"Error en cálculos financieros: {str(e)}",
            cash_flow_periods=0
        )

@router.post("/projects/{project_id}/simulate-payments", response_model=PaymentSimulationResponse)
async def simulate_client_payments(
    project_id: int,
    simulation_request: PaymentSimulationRequest,
    db: Session = Depends(get_db)
):
    """Simular diferentes escenarios de pagos del cliente y cronograma de obra"""
    
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    try:
        scenarios = []
        cash_flow_comparison = []
        
        # Process each combination of payment and schedule scenarios
        for payment_scenario in simulation_request.client_payment_scenarios:
            for schedule_scenario in simulation_request.schedule_scenarios:
                scenario_name = f"{payment_scenario.scenario_name} + {schedule_scenario.scenario_name}"
                
                # Calculate adjusted project duration
                base_duration = project.project_duration_days or 365
                duration_adjustment = schedule_scenario.duration_adjustment_pct / Decimal('100')
                adjusted_duration = int(base_duration * (Decimal('1') + duration_adjustment))
                
                # Mock financial impact calculation
                base_npv = Decimal('75000')
                schedule_impact = -abs(duration_adjustment) * Decimal('10000')  # Penalty for changes
                payment_delay_impact = -payment_scenario.retraso_pagos_dias * Decimal('100')
                
                scenario_npv = base_npv + schedule_impact + payment_delay_impact
                
                scenarios.append({
                    "scenario_name": scenario_name,
                    "npv": float(scenario_npv),
                    "duration_days": adjusted_duration,
                    "payment_delay_days": payment_scenario.retraso_pagos_dias,
                    "cost_impact_pct": float(schedule_scenario.cost_impact_pct),
                    "max_negative_exposure": float(Decimal('150000') * (Decimal('1') + abs(duration_adjustment)))
                })
                
                # Generate cash flow comparison data
                project_months = adjusted_duration // 30
                for month in range(1, min(13, project_months + 1)):  # First 12 months
                    cash_flow_comparison.append({
                        "month": f"Mes {month}",
                        "scenario": scenario_name,
                        "accumulated_flow": float(Decimal('10000') * Decimal(str(month)) * (Decimal('1') + duration_adjustment))
                    })
        
        # Company impact analysis
        company_impact = {
            "min_liquidity_required": float(Decimal('200000')),
            "recommended_credit_line": float(Decimal('300000')),
            "liquidity_risk_level": "MEDIUM",
            "critical_month": 4,
            "peak_financing_needed": float(max([s["max_negative_exposure"] for s in scenarios]))
        }
        
        recommendations = [
            "Considere negociar un anticipo mayor del 30% para mejorar el flujo de caja inicial",
            "Establezca hitos de pago claros vinculados al avance de obra",
            "Mantenga una línea de crédito equivalente al 60% de la exposición máxima negativa",
            "Implemente un sistema de seguimiento semanal del cronograma de obra",
            "Considere cláusulas de penalización por retrasos en pagos del cliente"
        ]
        
        return PaymentSimulationResponse(
            success=True,
            message=f"Simulación completada para {len(scenarios)} escenarios",
            scenarios=scenarios,
            cash_flow_comparison=cash_flow_comparison,
            company_impact=company_impact,
            recommendations=recommendations
        )
        
    except Exception as e:
        return PaymentSimulationResponse(
            success=False,
            message=f"Error en simulación: {str(e)}",
            scenarios=[],
            cash_flow_comparison=[],
            company_impact={},
            recommendations=[]
        )

@router.get("/projects/{project_id}/cash-flow-impact")
async def get_project_cash_flow_impact(project_id: int, db: Session = Depends(get_db)):
    """Obtener el impacto del proyecto en el cash flow empresarial"""
    
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Mock cash flow impact analysis
    impact_analysis = {
        "analysis": {
            "total_investment_required": float(Decimal('400000')),
            "max_negative_exposure": float(Decimal('180000')),
            "break_even_month": 7,
            "risk_level": "MEDIUM",
            "recommended_credit_line": float(Decimal('250000')),
            "liquidity_reserve_needed": float(Decimal('50000'))
        },
        "monthly_impact": [
            {"month": f"Mes {i}", "impact": float(Decimal('15000') * Decimal(str(i)) * Decimal('-1' if i < 6 else '1'))}
            for i in range(1, 13)
        ],
        "recommendations": [
            "Establecer línea de crédito antes del inicio de obra",
            "Negociar términos de pago favorables con proveedores",
            "Implementar control estricto de costos durante ejecución",
            "Monitorear mensualmente el flujo de caja proyectado vs real"
        ]
    }
    
    return impact_analysis

# === Helper Functions ===

def calculate_construction_cash_flows(project: ConstructionProject, cost_items: List[dict]) -> List[ConstructionCashFlowItem]:
    """Calculate construction project cash flows based on schedule and cost items"""
    # Implementation would go here
    pass

def calculate_construction_metrics(project: ConstructionProject, cash_flows: List[ConstructionCashFlowItem]) -> ConstructionMetrics:
    """Calculate financial metrics for construction project"""
    # Implementation would go here
    pass

def calculate_irr(cash_flows: List[float], initial_guess: float = 0.1) -> Optional[float]:
    """Calculate Internal Rate of Return using Newton-Raphson method"""
    # Same implementation as in scenario_projects.py
    pass 