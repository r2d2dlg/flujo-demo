from datetime import datetime
from typing import List, Optional
from decimal import Decimal
import base64
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc

from ..database import get_db
from ..models import (
    ConstructionProject, ProjectTakeoff, CostItem, ConstructionAssembly, 
    QuoteLineItem, ConstructionQuote
)
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/takeoffs", tags=["Construction Takeoffs"])

# === Pydantic Schemas ===

class TakeoffBase(BaseModel):
    takeoff_name: str
    plan_reference: Optional[str] = None
    discipline: Optional[str] = "ARCHITECTURAL"  # ARCHITECTURAL, STRUCTURAL, MEP
    measurement_type: str  # COUNT, LINEAR, AREA, VOLUME
    measured_quantity: Decimal
    unit_of_measure: str
    measurement_method: Optional[str] = "DIGITAL"
    scale_factor: Optional[str] = None
    notes: Optional[str] = None

class TakeoffCreate(TakeoffBase):
    construction_project_id: int
    coordinates_data: Optional[dict] = None
    area_polygon: Optional[dict] = None

class TakeoffUpdate(BaseModel):
    takeoff_name: Optional[str] = None
    measured_quantity: Optional[Decimal] = None
    notes: Optional[str] = None
    verified: Optional[bool] = None

class TakeoffSchema(TakeoffBase):
    id: int
    construction_project_id: int
    coordinates_data: Optional[dict]
    area_polygon: Optional[dict]
    verified: bool
    verified_by: Optional[str]
    verification_date: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MeasurementRequest(BaseModel):
    measurement_type: str  # COUNT, LINEAR, AREA, VOLUME
    coordinates: List[dict]  # Array of {x, y} coordinates
    scale_factor: Optional[float] = 1.0
    unit_of_measure: str

class MeasurementResponse(BaseModel):
    measurement_type: str
    calculated_quantity: Decimal
    unit_of_measure: str
    coordinates: List[dict]
    calculation_details: dict

class TakeoffToQuoteRequest(BaseModel):
    takeoff_ids: List[int]
    quote_id: int
    cost_item_id: Optional[int] = None
    assembly_id: Optional[int] = None
    unit_cost: Optional[Decimal] = None
    section: Optional[str] = None
    notes: Optional[str] = None

class PlanUploadResponse(BaseModel):
    plan_id: str
    filename: str
    file_size: int
    upload_success: bool
    image_dimensions: Optional[dict] = None

# === Helper Functions ===

def calculate_measurement(measurement_type: str, coordinates: List[dict], scale_factor: float = 1.0) -> dict:
    """Calculate quantity based on measurement type and coordinates"""
    
    if measurement_type == "COUNT":
        return {
            "quantity": len(coordinates),
            "method": "point_count",
            "coordinates_used": len(coordinates)
        }
    
    elif measurement_type == "LINEAR":
        total_length = 0
        for i in range(len(coordinates) - 1):
            x1, y1 = coordinates[i]['x'], coordinates[i]['y']
            x2, y2 = coordinates[i + 1]['x'], coordinates[i + 1]['y']
            length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
            total_length += length
        
        return {
            "quantity": total_length * scale_factor,
            "method": "polyline_measurement",
            "segments": len(coordinates) - 1,
            "total_length_pixels": total_length
        }
    
    elif measurement_type == "AREA":
        # Shoelace formula for polygon area
        if len(coordinates) < 3:
            return {"quantity": 0, "method": "polygon_area", "error": "Need at least 3 points"}
        
        n = len(coordinates)
        area = 0
        for i in range(n):
            j = (i + 1) % n
            area += coordinates[i]['x'] * coordinates[j]['y']
            area -= coordinates[j]['x'] * coordinates[i]['y']
        area = abs(area) / 2
        
        return {
            "quantity": area * (scale_factor ** 2),
            "method": "polygon_area", 
            "vertices": n,
            "area_pixels": area
        }
    
    elif measurement_type == "VOLUME":
        # Simple volume calculation (area * height parameter)
        area_calc = calculate_measurement("AREA", coordinates, scale_factor)
        height = coordinates[0].get('height', 1.0) if coordinates else 1.0
        
        return {
            "quantity": area_calc["quantity"] * height,
            "method": "area_times_height",
            "base_area": area_calc["quantity"],
            "height": height
        }
    
    return {"quantity": 0, "method": "unknown", "error": "Invalid measurement type"}

# === ENDPOINTS ===

@router.get("/projects/{project_id}/takeoffs", response_model=List[TakeoffSchema])
async def list_project_takeoffs(
    project_id: int,
    discipline: Optional[str] = None,
    measurement_type: Optional[str] = None,
    verified: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all takeoffs for a project with optional filters"""
    query = db.query(ProjectTakeoff).filter(
        ProjectTakeoff.construction_project_id == project_id
    )
    
    if discipline:
        query = query.filter(ProjectTakeoff.discipline == discipline)
    if measurement_type:
        query = query.filter(ProjectTakeoff.measurement_type == measurement_type)
    if verified is not None:
        query = query.filter(ProjectTakeoff.verified == verified)
    
    takeoffs = query.order_by(desc(ProjectTakeoff.created_at)).all()
    return takeoffs

@router.post("/projects/{project_id}/takeoffs", response_model=TakeoffSchema)
async def create_takeoff(
    project_id: int,
    takeoff: TakeoffCreate,
    db: Session = Depends(get_db)
):
    """Create a new takeoff measurement"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create takeoff
    db_takeoff = ProjectTakeoff(
        construction_project_id=project_id,
        takeoff_name=takeoff.takeoff_name,
        plan_reference=takeoff.plan_reference,
        discipline=takeoff.discipline,
        measurement_type=takeoff.measurement_type,
        measured_quantity=takeoff.measured_quantity,
        unit_of_measure=takeoff.unit_of_measure,
        measurement_method=takeoff.measurement_method,
        scale_factor=takeoff.scale_factor,
        coordinates_data=takeoff.coordinates_data,
        area_polygon=takeoff.area_polygon,
        notes=takeoff.notes,
        created_by="current_user"  # TODO: Get from auth
    )
    
    db.add(db_takeoff)
    db.commit()
    db.refresh(db_takeoff)
    
    return db_takeoff

@router.put("/takeoffs/{takeoff_id}", response_model=TakeoffSchema)
async def update_takeoff(
    takeoff_id: int,
    takeoff_update: TakeoffUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing takeoff"""
    takeoff = db.query(ProjectTakeoff).filter(
        ProjectTakeoff.id == takeoff_id
    ).first()
    
    if not takeoff:
        raise HTTPException(status_code=404, detail="Takeoff not found")
    
    # Update fields
    for field, value in takeoff_update.model_dump(exclude_unset=True).items():
        setattr(takeoff, field, value)
    
    if takeoff_update.verified:
        takeoff.verified_by = "current_user"  # TODO: Get from auth
        takeoff.verification_date = datetime.utcnow()
    
    db.commit()
    db.refresh(takeoff)
    return takeoff

@router.delete("/takeoffs/{takeoff_id}")
async def delete_takeoff(takeoff_id: int, db: Session = Depends(get_db)):
    """Delete a takeoff"""
    takeoff = db.query(ProjectTakeoff).filter(
        ProjectTakeoff.id == takeoff_id
    ).first()
    
    if not takeoff:
        raise HTTPException(status_code=404, detail="Takeoff not found")
    
    db.delete(takeoff)
    db.commit()
    return {"message": "Takeoff deleted successfully"}

@router.post("/calculate-measurement", response_model=MeasurementResponse)
async def calculate_measurement_endpoint(
    measurement: MeasurementRequest
):
    """Calculate quantity from measurement coordinates"""
    
    try:
        calculation = calculate_measurement(
            measurement.measurement_type,
            measurement.coordinates,
            measurement.scale_factor or 1.0
        )
        
        return MeasurementResponse(
            measurement_type=measurement.measurement_type,
            calculated_quantity=Decimal(str(calculation["quantity"])),
            unit_of_measure=measurement.unit_of_measure,
            coordinates=measurement.coordinates,
            calculation_details=calculation
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Measurement calculation failed: {str(e)}")

@router.post("/takeoffs-to-quote")
async def convert_takeoffs_to_quote_lines(
    request: TakeoffToQuoteRequest,
    db: Session = Depends(get_db)
):
    """Convert selected takeoffs to quote line items"""
    
    # Verify quote exists
    quote = db.query(ConstructionQuote).filter(
        ConstructionQuote.id == request.quote_id
    ).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Get takeoffs
    takeoffs = db.query(ProjectTakeoff).filter(
        ProjectTakeoff.id.in_(request.takeoff_ids)
    ).all()
    
    if len(takeoffs) != len(request.takeoff_ids):
        raise HTTPException(status_code=404, detail="Some takeoffs not found")
    
    # Get cost item or assembly for pricing
    cost_item = None
    assembly = None
    if request.cost_item_id:
        cost_item = db.query(CostItem).filter(CostItem.id == request.cost_item_id).first()
    elif request.assembly_id:
        assembly = db.query(ConstructionAssembly).filter(
            ConstructionAssembly.id == request.assembly_id
        ).first()
    
    # Get next line number
    max_line = db.query(QuoteLineItem.line_number).filter(
        QuoteLineItem.construction_quote_id == request.quote_id
    ).order_by(desc(QuoteLineItem.line_number)).first()
    next_line = (max_line[0] if max_line else 0) + 1
    
    created_items = []
    
    for takeoff in takeoffs:
        # Determine unit cost
        unit_cost = request.unit_cost or Decimal("0.00")
        if cost_item and not request.unit_cost:
            # Use cost item base cost with location factors
            unit_cost = cost_item.base_cost * quote.project.location_cost_factor
        
        # Create line item
        line_item = QuoteLineItem(
            construction_quote_id=request.quote_id,
            line_number=next_line,
            item_description=f"{takeoff.takeoff_name} - {takeoff.measurement_type}",
            cost_item_id=request.cost_item_id,
            assembly_id=request.assembly_id,
            quantity=takeoff.measured_quantity,
            unit_of_measure=takeoff.unit_of_measure,
            unit_cost=unit_cost,
            total_cost=takeoff.measured_quantity * unit_cost,
            section=request.section or takeoff.discipline,
            notes=request.notes or f"Generated from takeoff: {takeoff.takeoff_name}",
            # Cost breakdown
            material_cost=(takeoff.measured_quantity * unit_cost) if cost_item and cost_item.item_type == "MATERIAL" else Decimal("0.00"),
            labor_cost=(takeoff.measured_quantity * unit_cost) if cost_item and cost_item.item_type == "LABOR" else Decimal("0.00"),
            equipment_cost=(takeoff.measured_quantity * unit_cost) if cost_item and cost_item.item_type == "EQUIPMENT" else Decimal("0.00"),
            subcontract_cost=(takeoff.measured_quantity * unit_cost) if cost_item and cost_item.item_type == "SUBCONTRACT" else Decimal("0.00"),
            # Applied factors
            location_factor_applied=quote.project.location_cost_factor,
            complexity_factor_applied=quote.project.complexity_factor
        )
        
        db.add(line_item)
        created_items.append(line_item)
        next_line += 1
    
    db.commit()
    
    return {
        "message": f"Successfully created {len(created_items)} quote line items from takeoffs",
        "created_items": len(created_items),
        "quote_id": request.quote_id
    }

@router.post("/projects/{project_id}/upload-plan")
async def upload_plan(
    project_id: int,
    file: UploadFile = File(...),
    plan_name: str = Form(...),
    scale_info: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a construction plan (PDF/Image) for takeoff measurements"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(
        ConstructionProject.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # For demo purposes, we'll store basic info
        # In production, you'd save to cloud storage or file system
        plan_id = f"plan_{project_id}_{datetime.utcnow().timestamp()}"
        
        # TODO: In production, implement:
        # 1. File storage (AWS S3, Google Cloud, etc.)
        # 2. PDF to image conversion for display
        # 3. Image processing for better takeoff experience
        # 4. OCR for automatic scale detection
        
        return PlanUploadResponse(
            plan_id=plan_id,
            filename=file.filename,
            file_size=file_size,
            upload_success=True,
            image_dimensions={"width": 1920, "height": 1080}  # Placeholder
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"File upload failed: {str(e)}"
        )

@router.get("/measurement-types")
async def get_measurement_types():
    """Get available measurement types for takeoffs"""
    return {
        "measurement_types": [
            {
                "type": "COUNT",
                "name": "Conteo",
                "description": "Contar elementos individuales (puertas, ventanas, luminarias)",
                "units": ["c/u", "pcs", "ea"]
            },
            {
                "type": "LINEAR", 
                "name": "Lineal",
                "description": "Medir longitudes (tuberías, molduras, cables)",
                "units": ["m", "ml", "ft", "in"]
            },
            {
                "type": "AREA",
                "name": "Área",
                "description": "Medir superficies (muros, pisos, techos)",
                "units": ["m2", "ft2", "sq"]
            },
            {
                "type": "VOLUME",
                "name": "Volumen", 
                "description": "Medir volúmenes (concreto, excavación)",
                "units": ["m3", "ft3", "yd3"]
            }
        ]
    }

@router.get("/disciplines")
async def get_disciplines():
    """Get available disciplines for takeoffs"""
    return {
        "disciplines": [
            {"code": "ARCHITECTURAL", "name": "Arquitectónico"},
            {"code": "STRUCTURAL", "name": "Estructural"},
            {"code": "MEP", "name": "MEP (Eléctrico/Mecánico/Plomería)"},
            {"code": "CIVIL", "name": "Civil"},
            {"code": "LANDSCAPE", "name": "Paisajismo"}
        ]
    } 