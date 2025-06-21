# backend/app/routers/construction_quotes.py
from datetime import datetime, date
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func

from ..database import get_db
from ..models import (
    ConstructionProject, ConstructionQuote, QuoteLineItem, CostItem, 
    ConstructionAssembly, AssemblyComponent, ProjectTakeoff, QuoteTemplate
)
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/construction-quotes", tags=["Construction Quotes"])


# === Pydantic Schemas ===

class ConstructionProjectBase(BaseModel):
    project_name: str
    client_name: str
    client_contact: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    project_type: Optional[str] = None
    location: Optional[str] = None
    site_address: Optional[str] = None
    description: Optional[str] = None
    scope_of_work: Optional[str] = None
    special_requirements: Optional[str] = None
    bid_deadline: Optional[datetime] = None
    project_start_date: Optional[date] = None
    project_duration_days: Optional[int] = None
    total_area_m2: Optional[Decimal] = None
    total_floors: Optional[int] = None
    total_units: Optional[int] = None
    location_cost_factor: Decimal = Field(default=Decimal("1.0000"))
    complexity_factor: Decimal = Field(default=Decimal("1.0000"))
    priority: str = "MEDIUM"

class ConstructionProjectCreate(ConstructionProjectBase):
    pass

class ConstructionProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    client_name: Optional[str] = None
    client_contact: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    project_type: Optional[str] = None
    location: Optional[str] = None
    site_address: Optional[str] = None
    description: Optional[str] = None
    scope_of_work: Optional[str] = None
    special_requirements: Optional[str] = None
    bid_deadline: Optional[datetime] = None
    project_start_date: Optional[date] = None
    project_duration_days: Optional[int] = None
    total_area_m2: Optional[Decimal] = None
    total_floors: Optional[int] = None
    total_units: Optional[int] = None
    location_cost_factor: Optional[Decimal] = None
    complexity_factor: Optional[Decimal] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    plans_uploaded: Optional[bool] = None
    specifications_received: Optional[bool] = None
    site_visit_completed: Optional[bool] = None

class ConstructionProjectSchema(ConstructionProjectBase):
    id: int
    status: str
    plans_uploaded: bool
    specifications_received: bool
    site_visit_completed: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CostItemBase(BaseModel):
    item_code: str
    description: str
    item_type: str  # MATERIAL, LABOR, EQUIPMENT, SUBCONTRACT, OTHER
    category: str
    subcategory: Optional[str] = None
    unit_of_measure: str
    base_cost: Decimal
    currency: str = "USD"
    waste_factor: Decimal = Field(default=Decimal("0.0500"))
    labor_factor: Optional[Decimal] = None
    preferred_supplier: Optional[str] = None
    supplier_contact: Optional[str] = None

class CostItemCreate(CostItemBase):
    pass

class CostItemSchema(CostItemBase):
    id: int
    panama_city_factor: Decimal
    colon_factor: Decimal
    chiriqui_factor: Decimal
    interior_factor: Decimal
    is_active: bool
    is_custom: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_price_update: Optional[datetime]

    class Config:
        from_attributes = True

class AssemblyComponentSchema(BaseModel):
    id: int
    cost_item_id: int
    quantity_formula: str
    base_quantity: Optional[Decimal]
    waste_factor_override: Optional[Decimal]
    productivity_factor: Decimal
    parameter_dependencies: Optional[dict]
    is_optional: bool
    sequence_order: int
    cost_item: Optional[CostItemSchema]

    class Config:
        from_attributes = True

class ConstructionAssemblyBase(BaseModel):
    assembly_code: str
    assembly_name: str
    description: Optional[str] = None
    assembly_type: str  # STRUCTURAL, ARCHITECTURAL, MEP, FINISHES
    system_category: str  # WALLS, DOORS, WINDOWS, ROOFING, etc.
    unit_of_measure: str
    parameters_schema: Optional[dict] = None
    default_parameters: Optional[dict] = None
    is_parametric: bool = False

class ConstructionAssemblyCreate(ConstructionAssemblyBase):
    pass

class ConstructionAssemblySchema(ConstructionAssemblyBase):
    id: int
    usage_count: int
    last_used: Optional[datetime]
    is_active: bool
    is_custom: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    components: List[AssemblyComponentSchema] = []

    class Config:
        from_attributes = True

class QuoteLineItemBase(BaseModel):
    item_description: str
    cost_item_id: Optional[int] = None
    assembly_id: Optional[int] = None
    quantity: Decimal
    unit_of_measure: str
    unit_cost: Decimal
    assembly_parameters: Optional[dict] = None
    section: Optional[str] = None
    work_category: Optional[str] = None
    budget_code: Optional[str] = None
    is_alternative: bool = False
    is_optional: bool = False
    notes: Optional[str] = None

class QuoteLineItemCreate(BaseModel):
    construction_quote_id: int
    item_description: str
    quantity: Decimal
    unit_of_measure: str
    unit_cost: Decimal
    notes: Optional[str] = None
    item_type: Optional[str] = "MATERIAL"  # MATERIAL, LABOR, EQUIPMENT, SUBCONTRACT

class QuoteLineItemSchema(QuoteLineItemBase):
    id: int
    construction_quote_id: int
    total_cost: Decimal
    material_cost: Decimal
    labor_cost: Decimal
    equipment_cost: Decimal
    subcontract_cost: Decimal
    waste_factor_applied: Decimal
    location_factor_applied: Decimal
    complexity_factor_applied: Decimal
    cost_item: Optional[CostItemSchema]
    assembly: Optional[ConstructionAssemblySchema]

    class Config:
        from_attributes = True

class ConstructionQuoteBase(BaseModel):
    quote_name: str
    description: Optional[str] = None
    validity_days: int = 30
    overhead_percentage: Decimal = Field(default=Decimal("15.00"))
    profit_margin_percentage: Decimal = Field(default=Decimal("10.00"))
    contingency_percentage: Decimal = Field(default=Decimal("5.00"))
    itbms_percentage: Decimal = Field(default=Decimal("7.00"))
    payment_terms: Optional[str] = None
    payment_schedule: Optional[dict] = None
    estimated_competitors: Optional[int] = None
    market_position: Optional[str] = None

class ConstructionQuoteCreate(ConstructionQuoteBase):
    construction_project_id: int

class ConstructionQuoteSchema(ConstructionQuoteBase):
    id: int
    construction_project_id: int
    quote_number: str
    version: int
    quote_date: date
    expiry_date: Optional[date]
    total_direct_costs: Decimal
    total_material_costs: Decimal
    total_labor_costs: Decimal
    total_equipment_costs: Decimal
    total_subcontract_costs: Decimal
    overhead_amount: Decimal
    profit_margin_amount: Decimal
    contingency_amount: Decimal
    itbms_amount: Decimal
    subtotal: Decimal
    total_quote_amount: Decimal
    status: str
    submitted_date: Optional[datetime]
    decision_date: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    line_items: List[QuoteLineItemSchema] = []
    project: Optional[ConstructionProjectSchema]

    class Config:
        from_attributes = True

class QuoteTemplateBase(BaseModel):
    template_name: str
    project_type: str  # RESIDENTIAL, COMMERCIAL, INDUSTRIAL
    template_sections: dict
    default_assemblies: Optional[dict] = None
    default_overhead: Decimal = Field(default=Decimal("15.00"))
    default_profit: Decimal = Field(default=Decimal("10.00"))
    default_contingency: Decimal = Field(default=Decimal("5.00"))

class QuoteTemplateCreate(QuoteTemplateBase):
    pass

class QuoteTemplateSchema(QuoteTemplateBase):
    id: int
    usage_count: int
    is_active: bool
    is_system_template: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectSummaryResponse(BaseModel):
    projects: List[ConstructionProjectSchema]
    total: int

class QuoteSummaryResponse(BaseModel):
    quotes: List[ConstructionQuoteSchema]
    total: int


# === PROJECT ENDPOINTS ===

@router.get("/projects", response_model=ProjectSummaryResponse)
async def list_construction_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    client_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Listar todos los proyectos de construcción"""
    query = db.query(ConstructionProject)
    
    if status:
        query = query.filter(ConstructionProject.status == status)
    if project_type:
        query = query.filter(ConstructionProject.project_type == project_type)
    if client_name:
        query = query.filter(ConstructionProject.client_name.ilike(f"%{client_name}%"))
    
    total = query.count()
    projects = query.order_by(desc(ConstructionProject.created_at)).offset(skip).limit(limit).all()
    
    return ProjectSummaryResponse(projects=projects, total=total)

@router.post("/projects", response_model=ConstructionProjectSchema)
async def create_construction_project(
    project: ConstructionProjectCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo proyecto de construcción"""
    db_project = ConstructionProject(
        **project.dict(),
        created_by="system",  # TODO: Get from current user
        status="BIDDING"
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/projects/{project_id}", response_model=ConstructionProjectSchema)
async def get_construction_project(project_id: int, db: Session = Depends(get_db)):
    """Obtener un proyecto de construcción específico"""
    project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    return project

@router.put("/projects/{project_id}", response_model=ConstructionProjectSchema)
async def update_construction_project(
    project_id: int,
    project_update: ConstructionProjectUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar proyecto de construcción"""
    db_project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, field, value)
    
    db_project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_project)
    
    return db_project

@router.delete("/projects/{project_id}")
async def delete_construction_project(project_id: int, db: Session = Depends(get_db)):
    """Eliminar un proyecto de construcción"""
    db_project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    db.delete(db_project)
    db.commit()
    
    return {"message": "Proyecto eliminado exitosamente"}


# === COST ITEMS ENDPOINTS ===

@router.get("/cost-items", response_model=List[CostItemSchema])
async def list_cost_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000),
    item_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Listar items de costo"""
    query = db.query(CostItem).filter(CostItem.is_active == is_active)
    
    if item_type:
        query = query.filter(CostItem.item_type == item_type)
    if category:
        query = query.filter(CostItem.category.ilike(f"%{category}%"))
    
    items = query.order_by(CostItem.category, CostItem.description).offset(skip).limit(limit).all()
    return items

@router.post("/cost-items", response_model=CostItemSchema)
async def create_cost_item(
    cost_item: CostItemCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo item de costo"""
    # Check if item_code already exists
    existing = db.query(CostItem).filter(CostItem.item_code == cost_item.item_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código de item ya existe")
    
    db_item = CostItem(
        **cost_item.dict(),
        is_custom=True,
        created_by="system"  # TODO: Get from current user
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/cost-items/{item_id}", response_model=CostItemSchema)
async def get_cost_item(item_id: int, db: Session = Depends(get_db)):
    """Obtener un item de costo específico"""
    item = db.query(CostItem).filter(CostItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return item


# === ASSEMBLIES ENDPOINTS ===

@router.get("/assemblies", response_model=List[ConstructionAssemblySchema])
async def list_assemblies(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000),
    assembly_type: Optional[str] = Query(None),
    system_category: Optional[str] = Query(None),
    is_active: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Listar ensamblajes de construcción"""
    query = db.query(ConstructionAssembly).options(
        joinedload(ConstructionAssembly.components).joinedload(AssemblyComponent.cost_item)
    ).filter(ConstructionAssembly.is_active == is_active)
    
    if assembly_type:
        query = query.filter(ConstructionAssembly.assembly_type == assembly_type)
    if system_category:
        query = query.filter(ConstructionAssembly.system_category == system_category)
    
    assemblies = query.order_by(ConstructionAssembly.assembly_type, ConstructionAssembly.assembly_name).offset(skip).limit(limit).all()
    return assemblies

@router.post("/assemblies", response_model=ConstructionAssemblySchema)
async def create_assembly(
    assembly: ConstructionAssemblyCreate,
    db: Session = Depends(get_db)
):
    """Crear un nuevo ensamblaje"""
    # Check if assembly_code already exists
    existing = db.query(ConstructionAssembly).filter(
        ConstructionAssembly.assembly_code == assembly.assembly_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código de ensamblaje ya existe")
    
    db_assembly = ConstructionAssembly(
        **assembly.dict(),
        is_custom=True,
        created_by="system"  # TODO: Get from current user
    )
    db.add(db_assembly)
    db.commit()
    db.refresh(db_assembly)
    return db_assembly

@router.get("/assemblies/{assembly_id}", response_model=ConstructionAssemblySchema)
async def get_assembly(assembly_id: int, db: Session = Depends(get_db)):
    """Obtener un ensamblaje específico"""
    assembly = db.query(ConstructionAssembly).options(
        joinedload(ConstructionAssembly.components).joinedload(AssemblyComponent.cost_item)
    ).filter(ConstructionAssembly.id == assembly_id).first()
    
    if not assembly:
        raise HTTPException(status_code=404, detail="Ensamblaje no encontrado")
    return assembly

# === ENHANCED ASSEMBLY FEATURES ===

class AssemblyCalculationRequest(BaseModel):
    assembly_id: int
    parameters: dict
    location_factor: Optional[Decimal] = Field(default=Decimal("1.0"))
    complexity_factor: Optional[Decimal] = Field(default=Decimal("1.0"))

class AssemblyCalculationResponse(BaseModel):
    assembly_id: int
    assembly_name: str
    unit_of_measure: str
    parameters_used: dict
    total_unit_cost: Decimal
    material_cost: Decimal
    labor_cost: Decimal
    equipment_cost: Decimal
    subcontract_cost: Decimal
    component_breakdown: List[dict]
    
@router.post("/assemblies/calculate", response_model=AssemblyCalculationResponse)
async def calculate_assembly_cost(
    request: AssemblyCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calcular el costo de un ensamblaje con parámetros específicos"""
    # Get assembly with components
    assembly = db.query(ConstructionAssembly).options(
        joinedload(ConstructionAssembly.components).joinedload(AssemblyComponent.cost_item)
    ).filter(ConstructionAssembly.id == request.assembly_id).first()
    
    if not assembly:
        raise HTTPException(status_code=404, detail="Ensamblaje no encontrado")
    
    # Merge provided parameters with defaults
    parameters = {**(assembly.default_parameters or {}), **request.parameters}
    
    # Calculate component costs
    total_material = Decimal("0.00")
    total_labor = Decimal("0.00")
    total_equipment = Decimal("0.00")
    total_subcontract = Decimal("0.00")
    component_breakdown = []
    
    for component in assembly.components:
        if not component.cost_item:
            continue
            
        # Calculate quantity based on formula and parameters
        quantity = calculate_component_quantity(
            component.quantity_formula,
            parameters,
            component.base_quantity or Decimal("1.0")
        )
        
        # Apply productivity and waste factors
        adjusted_quantity = quantity * component.productivity_factor
        if component.waste_factor_override:
            adjusted_quantity *= (1 + component.waste_factor_override)
        else:
            adjusted_quantity *= (1 + component.cost_item.waste_factor)
        
        # Calculate unit cost with location factors
        unit_cost = get_location_adjusted_cost(
            component.cost_item, 
            request.location_factor
        )
        
        # Apply complexity factor
        unit_cost *= request.complexity_factor
        
        # Calculate total cost for this component
        component_cost = adjusted_quantity * unit_cost
        
        # Categorize by item type
        if component.cost_item.item_type == "MATERIAL":
            total_material += component_cost
        elif component.cost_item.item_type == "LABOR":
            total_labor += component_cost
        elif component.cost_item.item_type == "EQUIPMENT":
            total_equipment += component_cost
        elif component.cost_item.item_type == "SUBCONTRACT":
            total_subcontract += component_cost
        
        component_breakdown.append({
            "cost_item_code": component.cost_item.item_code,
            "description": component.cost_item.description,
            "item_type": component.cost_item.item_type,
            "base_quantity": float(quantity),
            "adjusted_quantity": float(adjusted_quantity),
            "unit_cost": float(unit_cost),
            "total_cost": float(component_cost),
            "unit_of_measure": component.cost_item.unit_of_measure
        })
    
    total_cost = total_material + total_labor + total_equipment + total_subcontract
    
    return AssemblyCalculationResponse(
        assembly_id=assembly.id,
        assembly_name=assembly.assembly_name,
        unit_of_measure=assembly.unit_of_measure,
        parameters_used=parameters,
        total_unit_cost=total_cost,
        material_cost=total_material,
        labor_cost=total_labor,
        equipment_cost=total_equipment,
        subcontract_cost=total_subcontract,
        component_breakdown=component_breakdown
    )

class AssemblyToLineItemRequest(BaseModel):
    quote_id: int
    assembly_id: int
    quantity: Decimal
    parameters: dict
    section: Optional[str] = None
    notes: Optional[str] = None

@router.post("/assemblies/add-to-quote", response_model=QuoteLineItemSchema)
async def add_assembly_to_quote(
    request: AssemblyToLineItemRequest,
    db: Session = Depends(get_db)
):
    """Agregar un ensamblaje como partida a una cotización"""
    # Verify quote exists
    quote = db.query(ConstructionQuote).options(
        joinedload(ConstructionQuote.project)
    ).filter(ConstructionQuote.id == request.quote_id).first()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    # Get assembly
    assembly = db.query(ConstructionAssembly).filter(
        ConstructionAssembly.id == request.assembly_id
    ).first()
    
    if not assembly:
        raise HTTPException(status_code=404, detail="Ensamblaje no encontrado")
    
    # Calculate assembly cost
    calc_request = AssemblyCalculationRequest(
        assembly_id=request.assembly_id,
        parameters=request.parameters,
        location_factor=quote.project.location_cost_factor,
        complexity_factor=quote.project.complexity_factor
    )
    
    calculation = await calculate_assembly_cost(calc_request, db)
    
    # Get next line number
    max_line = db.query(func.max(QuoteLineItem.line_number)).filter(
        QuoteLineItem.construction_quote_id == request.quote_id
    ).scalar() or 0
    
    # Create line item
    line_item = QuoteLineItem(
        construction_quote_id=request.quote_id,
        line_number=max_line + 1,
        assembly_id=request.assembly_id,
        item_description=f"{assembly.assembly_name} - {assembly.description or ''}",
        quantity=request.quantity,
        unit_of_measure=assembly.unit_of_measure,
        unit_cost=calculation.total_unit_cost,
        total_cost=request.quantity * calculation.total_unit_cost,
        assembly_parameters=request.parameters,
        section=request.section,
        notes=request.notes,
        material_cost=request.quantity * calculation.material_cost,
        labor_cost=request.quantity * calculation.labor_cost,
        equipment_cost=request.quantity * calculation.equipment_cost,
        subcontract_cost=request.quantity * calculation.subcontract_cost,
        waste_factor_applied=Decimal("0.00"),  # Already applied in calculation
        location_factor_applied=quote.project.location_cost_factor,
        complexity_factor_applied=quote.project.complexity_factor
    )
    
    db.add(line_item)
    
    # Update assembly usage
    assembly.usage_count += 1
    assembly.last_used = datetime.utcnow()
    
    db.commit()
    db.refresh(line_item)
    
    return line_item

def calculate_component_quantity(formula: str, parameters: dict, base_quantity: Decimal) -> Decimal:
    """Calculate component quantity based on formula and parameters"""
    try:
        # Simple formula evaluation - supports basic arithmetic with parameters
        # For safety, we'll implement a basic evaluator for common formulas
        
        # Replace parameter names with values
        eval_formula = formula
        for param_name, param_value in parameters.items():
            eval_formula = eval_formula.replace(f"{{{param_name}}}", str(param_value))
        
        # Handle common formulas
        if eval_formula == "1":
            return base_quantity
        elif "*" in eval_formula:
            # Simple multiplication: "2.5 * 3.0"
            parts = eval_formula.split("*")
            result = Decimal("1.0")
            for part in parts:
                result *= Decimal(part.strip())
            return result * base_quantity
        elif "+" in eval_formula:
            # Simple addition: "2.5 + 1.0"
            parts = eval_formula.split("+")
            result = Decimal("0.0")
            for part in parts:
                result += Decimal(part.strip())
            return result * base_quantity
        else:
            # Try to parse as decimal
            return Decimal(eval_formula) * base_quantity
            
    except Exception:
        # If formula evaluation fails, return base quantity
        return base_quantity

def get_location_adjusted_cost(cost_item: CostItem, location_factor: Decimal) -> Decimal:
    """Get location-adjusted cost for a cost item"""
    # For now, use the base cost with location factor
    # In a full implementation, you might select specific regional factors
    return cost_item.base_cost * location_factor

@router.get("/assemblies/{assembly_id}/preview", response_model=AssemblyCalculationResponse)
async def preview_assembly_cost(
    assembly_id: int,
    location_factor: Optional[Decimal] = Query(Decimal("1.0")),
    complexity_factor: Optional[Decimal] = Query(Decimal("1.0")),
    db: Session = Depends(get_db)
):
    """Preview assembly cost with default parameters"""
    assembly = db.query(ConstructionAssembly).filter(
        ConstructionAssembly.id == assembly_id
    ).first()
    
    if not assembly:
        raise HTTPException(status_code=404, detail="Ensamblaje no encontrado")
    
    # Use default parameters for preview
    request = AssemblyCalculationRequest(
        assembly_id=assembly_id,
        parameters=assembly.default_parameters or {},
        location_factor=location_factor,
        complexity_factor=complexity_factor
    )
    
    return await calculate_assembly_cost(request, db)


# === QUOTES ENDPOINTS ===

@router.get("/projects/{project_id}/quotes", response_model=List[ConstructionQuoteSchema])
async def list_project_quotes(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Listar cotizaciones de un proyecto"""
    quotes = db.query(ConstructionQuote).options(
        joinedload(ConstructionQuote.line_items)
    ).filter(ConstructionQuote.construction_project_id == project_id).order_by(
        desc(ConstructionQuote.created_at)
    ).all()
    
    return quotes

@router.post("/projects/{project_id}/quotes", response_model=ConstructionQuoteSchema)
async def create_quote(
    project_id: int,
    quote: ConstructionQuoteCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva cotización"""
    # Verify project exists
    project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Generate quote number
    count = db.query(ConstructionQuote).filter(
        ConstructionQuote.construction_project_id == project_id
    ).count()
    quote_number = f"COT-{project_id:04d}-{count + 1:03d}"
    
    # Calculate expiry date
    expiry_date = None
    if quote.validity_days:
        from datetime import timedelta
        expiry_date = date.today() + timedelta(days=quote.validity_days)
    
    db_quote = ConstructionQuote(
        construction_project_id=project_id,
        quote_number=quote_number,
        expiry_date=expiry_date,
        created_by="system",  # TODO: Get from current user
        **quote.dict(exclude={'construction_project_id'})
    )
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.get("/quotes/{quote_id}", response_model=ConstructionQuoteSchema)
async def get_quote(quote_id: int, db: Session = Depends(get_db)):
    """Obtener una cotización específica"""
    quote = db.query(ConstructionQuote).options(
        joinedload(ConstructionQuote.line_items).joinedload(QuoteLineItem.cost_item),
        joinedload(ConstructionQuote.line_items).joinedload(QuoteLineItem.assembly),
        joinedload(ConstructionQuote.project)
    ).filter(ConstructionQuote.id == quote_id).first()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return quote


# === QUOTE LINE ITEMS ENDPOINTS ===

@router.get("/quotes/{quote_id}/line-items", response_model=List[QuoteLineItemSchema])
async def get_quote_line_items(
    quote_id: int,
    db: Session = Depends(get_db)
):
    """Obtener partidas de una cotización"""
    line_items = db.query(QuoteLineItem).options(
        joinedload(QuoteLineItem.cost_item),
        joinedload(QuoteLineItem.assembly)
    ).filter(QuoteLineItem.construction_quote_id == quote_id).order_by(
        QuoteLineItem.line_number
    ).all()
    
    return line_items

@router.post("/line-items", response_model=QuoteLineItemSchema)
async def add_line_item(
    line_item: QuoteLineItemCreate,
    db: Session = Depends(get_db)
):
    """Agregar nueva partida a cotización"""
    # Verify quote exists
    quote = db.query(ConstructionQuote).filter(
        ConstructionQuote.id == line_item.construction_quote_id
    ).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    # Get next line number
    max_line = db.query(func.max(QuoteLineItem.line_number)).filter(
        QuoteLineItem.construction_quote_id == line_item.construction_quote_id
    ).scalar() or 0
    
    # Calculate costs
    total_cost = line_item.quantity * line_item.unit_cost
    
    # Set cost to appropriate category based on item_type
    material_cost = total_cost if line_item.item_type == "MATERIAL" else Decimal("0.00")
    labor_cost = total_cost if line_item.item_type == "LABOR" else Decimal("0.00")
    equipment_cost = total_cost if line_item.item_type == "EQUIPMENT" else Decimal("0.00")
    subcontract_cost = total_cost if line_item.item_type == "SUBCONTRACT" else Decimal("0.00")
    
    # Apply factors if needed (location, complexity, waste)
    # TODO: Add factor calculations based on project and item settings
    
    db_line_item = QuoteLineItem(
        construction_quote_id=line_item.construction_quote_id,
        line_number=max_line + 1,
        total_cost=total_cost,
        material_cost=material_cost,
        labor_cost=labor_cost,
        equipment_cost=equipment_cost,
        subcontract_cost=subcontract_cost,
        waste_factor_applied=Decimal("1.05"),
        location_factor_applied=Decimal("1.00"),
        complexity_factor_applied=Decimal("1.00"),
        **line_item.dict(exclude={'construction_quote_id', 'item_type'})
    )
    db.add(db_line_item)
    
    # Update quote totals
    # TODO: Implement quote totals calculation
    
    db.commit()
    db.refresh(db_line_item)
    return db_line_item

@router.put("/line-items/{line_item_id}", response_model=QuoteLineItemSchema)
async def update_line_item(
    line_item_id: int,
    line_item_update: dict,
    db: Session = Depends(get_db)
):
    """Actualizar partida"""
    line_item = db.query(QuoteLineItem).filter(
        QuoteLineItem.id == line_item_id
    ).first()
    
    if not line_item:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
    
    # Update allowed fields
    allowed_fields = ['item_description', 'unit_of_measure', 'quantity', 'unit_cost', 'notes']
    for field, value in line_item_update.items():
        if field in allowed_fields and hasattr(line_item, field):
            setattr(line_item, field, value)
    
    # Recalculate total cost
    line_item.total_cost = line_item.quantity * line_item.unit_cost
    
    # Update cost category based on item_type if provided
    if 'item_type' in line_item_update:
        item_type = line_item_update['item_type']
        # Reset all cost categories to 0
        line_item.material_cost = Decimal("0.00")
        line_item.labor_cost = Decimal("0.00")
        line_item.equipment_cost = Decimal("0.00")
        line_item.subcontract_cost = Decimal("0.00")
        
        # Set the appropriate cost category
        if item_type == "MATERIAL":
            line_item.material_cost = line_item.total_cost
        elif item_type == "LABOR":
            line_item.labor_cost = line_item.total_cost
        elif item_type == "EQUIPMENT":
            line_item.equipment_cost = line_item.total_cost
        elif item_type == "SUBCONTRACT":
            line_item.subcontract_cost = line_item.total_cost
    
    db.commit()
    db.refresh(line_item)
    return line_item

@router.delete("/line-items/{line_item_id}")
async def delete_line_item(
    line_item_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar partida"""
    line_item = db.query(QuoteLineItem).filter(
        QuoteLineItem.id == line_item_id
    ).first()
    
    if not line_item:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
    
    db.delete(line_item)
    
    # TODO: Update quote totals
    
    db.commit()
    return {"message": "Partida eliminada exitosamente"}

@router.put("/quotes/{quote_id}", response_model=ConstructionQuoteSchema)
async def update_quote(
    quote_id: int,
    quote_update: dict,
    db: Session = Depends(get_db)
):
    """Actualizar cotización"""
    quote = db.query(ConstructionQuote).filter(
        ConstructionQuote.id == quote_id
    ).first()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    # Update fields
    for field, value in quote_update.items():
        if hasattr(quote, field):
            setattr(quote, field, value)
    
    db.commit()
    db.refresh(quote)
    return quote

@router.post("/quotes/{quote_id}/calculate", response_model=ConstructionQuoteSchema)
async def calculate_quote_costs(
    quote_id: int,
    db: Session = Depends(get_db)
):
    """Recalcular costos de cotización"""
    quote = db.query(ConstructionQuote).options(
        joinedload(ConstructionQuote.line_items),
        joinedload(ConstructionQuote.project)
    ).filter(ConstructionQuote.id == quote_id).first()
    
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    # Calculate totals from line items
    total_material = sum(item.material_cost for item in quote.line_items)
    total_labor = sum(item.labor_cost for item in quote.line_items)
    total_equipment = sum(item.equipment_cost for item in quote.line_items)
    total_subcontract = sum(item.subcontract_cost for item in quote.line_items)
    total_direct = total_material + total_labor + total_equipment + total_subcontract
    
    # Calculate overhead, profit, contingency
    overhead_amount = total_direct * (quote.overhead_percentage / 100)
    profit_amount = (total_direct + overhead_amount) * (quote.profit_margin_percentage / 100)
    contingency_amount = (total_direct + overhead_amount + profit_amount) * (quote.contingency_percentage / 100)
    
    subtotal_before_tax = total_direct + overhead_amount + profit_amount + contingency_amount
    tax_amount = subtotal_before_tax * (quote.itbms_percentage / 100)
    total_amount = subtotal_before_tax + tax_amount
    
    # Update quote
    quote.total_material_costs = total_material
    quote.total_labor_costs = total_labor
    quote.total_equipment_costs = total_equipment
    quote.total_subcontract_costs = total_subcontract
    quote.total_direct_costs = total_direct
    quote.overhead_amount = overhead_amount
    quote.profit_margin_amount = profit_amount
    quote.contingency_amount = contingency_amount
    quote.itbms_amount = tax_amount
    quote.subtotal = subtotal_before_tax
    quote.total_quote_amount = total_amount
    
    db.commit()
    db.refresh(quote)
    return quote


# === UTILITY ENDPOINTS ===

@router.get("/project-types")
async def get_project_types():
    """Obtener tipos de proyecto disponibles"""
    return [
        "RESIDENTIAL",
        "COMMERCIAL", 
        "INDUSTRIAL",
        "INSTITUTIONAL",
        "INFRASTRUCTURE",
        "RENOVATION"
    ]

@router.get("/item-types")
async def get_item_types():
    """Obtener tipos de items de costo"""
    return [
        "MATERIAL",
        "LABOR", 
        "EQUIPMENT",
        "SUBCONTRACT",
        "OTHER"
    ]

@router.get("/assembly-types")
async def get_assembly_types():
    """Obtener tipos de ensamblajes"""
    return [
        "STRUCTURAL",
        "ARCHITECTURAL",
        "MEP",
        "FINISHES",
        "SITE_WORK"
    ]


# === QUOTE TEMPLATES ===

@router.get("/templates", response_model=List[QuoteTemplateSchema])
async def list_quote_templates(
    project_type: Optional[str] = Query(None),
    is_active: bool = Query(True),
    db: Session = Depends(get_db)
):
    """List all quote templates"""
    query = db.query(QuoteTemplate)
    
    if project_type:
        query = query.filter(QuoteTemplate.project_type == project_type)
    if is_active is not None:
        query = query.filter(QuoteTemplate.is_active == is_active)
    
    templates = query.order_by(QuoteTemplate.template_name).all()
    return templates

@router.post("/templates", response_model=QuoteTemplateSchema)
async def create_quote_template(
    template: QuoteTemplateCreate,
    db: Session = Depends(get_db)
):
    """Create a new quote template"""
    db_template = QuoteTemplate(
        **template.dict(),
        created_by="system"  # TODO: Get from auth context
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template

@router.get("/templates/{template_id}", response_model=QuoteTemplateSchema)
async def get_quote_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific quote template"""
    template = db.query(QuoteTemplate).filter(
        QuoteTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

@router.post("/projects/{project_id}/quotes/from-template/{template_id}", response_model=ConstructionQuoteSchema)
async def create_quote_from_template(
    project_id: int,
    template_id: int,
    quote_name: str,
    db: Session = Depends(get_db)
):
    """Create a new quote from a template"""
    # Verify project exists
    project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get template
    template = db.query(QuoteTemplate).filter(
        QuoteTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Generate quote number
    quote_count = db.query(ConstructionQuote).filter(
        ConstructionQuote.construction_project_id == project_id
    ).count()
    quote_number = f"Q-{project_id:04d}-{quote_count + 1:03d}"
    
    # Create quote with template defaults
    db_quote = ConstructionQuote(
        construction_project_id=project_id,
        quote_number=quote_number,
        quote_name=quote_name,
        description=f"Quote created from template: {template.template_name}",
        overhead_percentage=template.default_overhead,
        profit_margin_percentage=template.default_profit,
        contingency_percentage=template.default_contingency,
        created_by="system"  # TODO: Get from auth context
    )
    
    db.add(db_quote)
    db.flush()  # Get the quote ID
    
    # Create line items from template
    line_number = 1
    for section_name, section_data in template.template_sections.items():
        if "items" in section_data:
            for item_data in section_data["items"]:
                line_item = QuoteLineItem(
                    construction_quote_id=db_quote.id,
                    line_number=line_number,
                    item_description=item_data.get("description", ""),
                    quantity=Decimal(str(item_data.get("quantity", 1))),
                    unit_of_measure=item_data.get("unit", "UN"),
                    unit_cost=Decimal(str(item_data.get("unit_cost", 0))),
                    total_cost=Decimal(str(item_data.get("quantity", 1))) * Decimal(str(item_data.get("unit_cost", 0))),
                    section=section_name,
                    material_cost=Decimal("0.00"),
                    labor_cost=Decimal("0.00"),
                    equipment_cost=Decimal("0.00"),
                    subcontract_cost=Decimal("0.00")
                )
                
                # Set cost to appropriate category
                item_type = item_data.get("type", "MATERIAL")
                if item_type == "MATERIAL":
                    line_item.material_cost = line_item.total_cost
                elif item_type == "LABOR":
                    line_item.labor_cost = line_item.total_cost
                elif item_type == "EQUIPMENT":
                    line_item.equipment_cost = line_item.total_cost
                elif item_type == "SUBCONTRACT":
                    line_item.subcontract_cost = line_item.total_cost
                
                db.add(line_item)
                line_number += 1
    
    # Update template usage
    template.usage_count += 1
    template.last_used = datetime.utcnow()
    
    db.commit()
    db.refresh(db_quote)
    
    return db_quote 