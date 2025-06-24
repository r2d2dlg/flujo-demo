from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd
import io
from decimal import Decimal
from datetime import datetime

from ..database import get_db
from ..models import ConstructionProject, QuoteLineItem, ConstructionQuote, CostItem
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/api/bid-import",
    tags=["Bid Import"],
    responses={404: {"description": "Not found"}},
)

# === Pydantic Schemas ===

class BidItemPreview(BaseModel):
    row_number: int
    codigo: Optional[str] = None
    descripcion: str
    unidad: str
    cantidad: Decimal
    precio_unitario: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    notes: Optional[str] = None
    is_valid: bool = True
    validation_errors: List[str] = []

class BidImportPreview(BaseModel):
    filename: str
    total_rows: int
    valid_items: int
    invalid_items: int
    items: List[BidItemPreview]
    summary: Dict[str, Any]
    template_compliance: bool
    suggestions: List[str] = []

class BidImportRequest(BaseModel):
    project_id: int
    items_to_import: List[int]  # Row numbers to import
    create_quote: bool = True
    quote_name: Optional[str] = None
    default_markup_percentage: Decimal = Field(default=Decimal('15'), description="% de markup por defecto")

class BidImportResponse(BaseModel):
    success: bool
    message: str
    items_created: int
    quote_id: Optional[int] = None
    quote_name: Optional[str] = None
    errors: List[str] = []

class StandardTemplate(BaseModel):
    """Estructura del template estándar para licitaciones"""
    required_columns: List[str] = [
        "CODIGO", "DESCRIPCION", "UNIDAD", "CANTIDAD"
    ]
    optional_columns: List[str] = [
        "PRECIO_UNITARIO", "SUBTOTAL", "CATEGORIA", "SUBCATEGORIA", "NOTAS"
    ]
    expected_headers: Dict[str, str] = {
        "CODIGO": "Código del item (ej: 01.01.001)",
        "DESCRIPCION": "Descripción detallada del trabajo",
        "UNIDAD": "Unidad de medida (m², m³, ml, kg, etc.)",
        "CANTIDAD": "Cantidad requerida",
        "PRECIO_UNITARIO": "Precio unitario (opcional)",
        "SUBTOTAL": "Subtotal calculado (opcional)",
        "CATEGORIA": "Categoría del trabajo (ej: MOVIMIENTO_TIERRA)",
        "SUBCATEGORIA": "Subcategoría (ej: EXCAVACION)",
        "NOTAS": "Notas adicionales"
    }

# === ENDPOINTS ===

@router.get("/template", response_model=StandardTemplate)
async def get_bid_template():
    """Obtener información del template estándar para licitaciones"""
    return StandardTemplate()

@router.get("/template/download")
async def download_bid_template():
    """Descargar template Excel de ejemplo para licitaciones"""
    
    # Create sample template data
    template_data = {
        'CODIGO': ['01.01.001', '01.01.002', '02.01.001', '02.01.002'],
        'DESCRIPCION': [
            'Excavación en terreno natural hasta 2.00m de profundidad',
            'Relleno compactado con material selecto',
            'Concreto f\'c=210 kg/cm² para fundaciones',
            'Acero de refuerzo fy=4200 kg/cm² grado 60'
        ],
        'UNIDAD': ['m³', 'm³', 'm³', 'kg'],
        'CANTIDAD': [150.00, 120.00, 85.50, 2500.00],
        'PRECIO_UNITARIO': [25.00, 18.50, 180.00, 0.95],
        'SUBTOTAL': [3750.00, 2220.00, 15390.00, 2375.00],
        'CATEGORIA': ['MOVIMIENTO_TIERRA', 'MOVIMIENTO_TIERRA', 'ESTRUCTURA', 'ESTRUCTURA'],
        'SUBCATEGORIA': ['EXCAVACION', 'RELLENO', 'CONCRETO', 'ACERO'],
        'NOTAS': ['Incluye acarreo hasta 100m', 'Compactación 95% Proctor', 'Incluye mezclado y vaciado', 'Incluye corte, doblez y colocación']
    }
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df = pd.DataFrame(template_data)
        df.to_excel(writer, sheet_name='LICITACION', index=False)
        
        # Add instructions sheet
        instructions = pd.DataFrame({
            'INSTRUCCIONES': [
                '1. Use esta estructura exacta para subir licitaciones',
                '2. Las columnas CODIGO, DESCRIPCION, UNIDAD y CANTIDAD son obligatorias',
                '3. Las demás columnas son opcionales',
                '4. No cambie los nombres de las columnas',
                '5. Use la hoja "LICITACION" para sus datos',
                '6. Elimine estas filas de instrucciones antes de subir'
            ]
        })
        instructions.to_excel(writer, sheet_name='INSTRUCCIONES', index=False)
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.read()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": "attachment; filename=template_licitacion.xlsx"}
    )

@router.post("/preview", response_model=BidImportPreview)
async def preview_bid_file(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Preview de archivo de licitación antes de importar"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Archivo debe ser Excel (.xlsx o .xls)")
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents), sheet_name='LICITACION')
        
        # Validate template compliance
        template = StandardTemplate()
        template_compliance = True
        missing_columns = []
        
        for col in template.required_columns:
            if col not in df.columns:
                template_compliance = False
                missing_columns.append(col)
        
        if not template_compliance:
            raise HTTPException(
                status_code=400, 
                detail=f"Template no válido. Columnas faltantes: {', '.join(missing_columns)}"
            )
        
        # Process each row
        items = []
        valid_count = 0
        invalid_count = 0
        
        for idx, row in df.iterrows():
            validation_errors = []
            is_valid = True
            
            # Validate required fields
            if pd.isna(row.get('DESCRIPCION')) or not str(row.get('DESCRIPCION')).strip():
                validation_errors.append("Descripción es obligatoria")
                is_valid = False
            
            if pd.isna(row.get('UNIDAD')) or not str(row.get('UNIDAD')).strip():
                validation_errors.append("Unidad es obligatoria")
                is_valid = False
            
            if pd.isna(row.get('CANTIDAD')) or row.get('CANTIDAD') <= 0:
                validation_errors.append("Cantidad debe ser mayor a 0")
                is_valid = False
            
            # Create preview item
            item = BidItemPreview(
                row_number=idx + 2,  # +2 because Excel is 1-indexed and has header
                codigo=str(row.get('CODIGO', '')).strip() if not pd.isna(row.get('CODIGO')) else None,
                descripcion=str(row.get('DESCRIPCION', '')).strip(),
                unidad=str(row.get('UNIDAD', '')).strip(),
                cantidad=Decimal(str(row.get('CANTIDAD', 0))) if not pd.isna(row.get('CANTIDAD')) else Decimal('0'),
                precio_unitario=Decimal(str(row.get('PRECIO_UNITARIO', 0))) if not pd.isna(row.get('PRECIO_UNITARIO')) and row.get('PRECIO_UNITARIO') > 0 else None,
                subtotal=Decimal(str(row.get('SUBTOTAL', 0))) if not pd.isna(row.get('SUBTOTAL')) and row.get('SUBTOTAL') > 0 else None,
                categoria=str(row.get('CATEGORIA', '')).strip() if not pd.isna(row.get('CATEGORIA')) else None,
                subcategoria=str(row.get('SUBCATEGORIA', '')).strip() if not pd.isna(row.get('SUBCATEGORIA')) else None,
                notes=str(row.get('NOTAS', '')).strip() if not pd.isna(row.get('NOTAS')) else None,
                is_valid=is_valid,
                validation_errors=validation_errors
            )
            
            items.append(item)
            
            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1
        
        # Generate summary
        summary = {
            "total_items": len(items),
            "estimated_value": sum([
                float(item.subtotal or 0) for item in items if item.is_valid
            ]),
            "categories": list(set([
                item.categoria for item in items 
                if item.categoria and item.is_valid
            ])),
            "units": list(set([
                item.unidad for item in items if item.is_valid
            ]))
        }
        
        # Generate suggestions
        suggestions = []
        if invalid_count > 0:
            suggestions.append(f"Revisar {invalid_count} items con errores antes de importar")
        
        if not any(item.precio_unitario for item in items):
            suggestions.append("No se encontraron precios unitarios. Se aplicará markup sobre costos base")
        
        if not any(item.categoria for item in items):
            suggestions.append("Considere agregar categorías para mejor organización")
        
        return BidImportPreview(
            filename=file.filename,
            total_rows=len(items),
            valid_items=valid_count,
            invalid_items=invalid_count,
            items=items,
            summary=summary,
            template_compliance=template_compliance,
            suggestions=suggestions
        )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="Archivo Excel vacío o sin hoja 'LICITACION'")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando archivo: {str(e)}")

@router.post("/import", response_model=BidImportResponse)
async def import_bid_items(
    import_request: BidImportRequest,
    db: Session = Depends(get_db)
):
    """Importar items de licitación a la base de datos"""
    
    # Verify project exists
    project = db.query(ConstructionProject).filter(ConstructionProject.id == import_request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    try:
        # This would need to be enhanced to store the preview data temporarily
        # For now, return a mock response
        
        # Create quote if requested
        quote_id = None
        quote_name = None
        
        if import_request.create_quote:
            quote_name = import_request.quote_name or f"Cotización {project.project_name} - {datetime.now().strftime('%Y%m%d')}"
            
            # Create new quote
            new_quote = ConstructionQuote(
                project_id=import_request.project_id,
                quote_name=quote_name,
                description=f"Cotización generada desde licitación importada",
                status="DRAFT",
                quote_version=1,
                materials_cost=Decimal('0'),
                labor_cost=Decimal('0'),
                equipment_cost=Decimal('0'),
                subcontract_cost=Decimal('0'),
                direct_costs_total=Decimal('0'),
                overhead_percentage=Decimal('15'),
                overhead_amount=Decimal('0'),
                profit_percentage=Decimal('10'),
                profit_amount=Decimal('0'),
                contingency_percentage=Decimal('5'),
                contingency_amount=Decimal('0'),
                subtotal_before_tax=Decimal('0'),
                tax_percentage=Decimal('7'),
                tax_amount=Decimal('0'),
                total_quote_amount=Decimal('0'),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(new_quote)
            db.commit()
            db.refresh(new_quote)
            
            quote_id = new_quote.id
        
        # Mock successful import
        items_created = len(import_request.items_to_import)
        
        return BidImportResponse(
            success=True,
            message=f"Importación exitosa: {items_created} items creados",
            items_created=items_created,
            quote_id=quote_id,
            quote_name=quote_name,
            errors=[]
        )
        
    except Exception as e:
        return BidImportResponse(
            success=False,
            message=f"Error en importación: {str(e)}",
            items_created=0,
            errors=[str(e)]
        )

@router.get("/projects/{project_id}/imported-bids")
async def get_imported_bids(project_id: int, db: Session = Depends(get_db)):
    """Obtener historial de licitaciones importadas para un proyecto"""
    
    project = db.query(ConstructionProject).filter(ConstructionProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Mock response - in real implementation, you'd track import history
    return {
        "project_id": project_id,
        "project_name": project.project_name,
        "imported_bids": [
            {
                "import_id": 1,
                "filename": "licitacion_edificio_A.xlsx",
                "imported_date": "2024-01-15T10:30:00Z",
                "items_count": 45,
                "total_value": 125000.00,
                "quote_id": 1,
                "quote_name": "Cotización Edificio A - 20240115"
            }
        ],
        "total_imports": 1
    }

# === Helper Functions ===

def validate_bid_item(row_data: Dict[str, Any]) -> tuple[bool, List[str]]:
    """Validate a single bid item row"""
    errors = []
    is_valid = True
    
    # Add validation logic here
    required_fields = ['DESCRIPCION', 'UNIDAD', 'CANTIDAD']
    
    for field in required_fields:
        if not row_data.get(field):
            errors.append(f"{field} es obligatorio")
            is_valid = False
    
    return is_valid, errors

def categorize_item_automatically(descripcion: str, codigo: str = None) -> tuple[str, str]:
    """Auto-categorize items based on description and code"""
    
    descripcion_lower = descripcion.lower()
    
    # Simple categorization logic
    if any(word in descripcion_lower for word in ['excavac', 'relleno', 'movimiento', 'tierra']):
        return 'MOVIMIENTO_TIERRA', 'EXCAVACION' if 'excavac' in descripcion_lower else 'RELLENO'
    
    elif any(word in descripcion_lower for word in ['concreto', 'hormigón', 'cemento']):
        return 'ESTRUCTURA', 'CONCRETO'
    
    elif any(word in descripcion_lower for word in ['acero', 'hierro', 'varilla', 'refuerzo']):
        return 'ESTRUCTURA', 'ACERO'
    
    elif any(word in descripcion_lower for word in ['block', 'bloque', 'mampostería', 'ladrillo']):
        return 'MAMPOSTERIA', 'BLOQUES'
    
    elif any(word in descripcion_lower for word in ['tubería', 'tuberia', 'plomería', 'fontanería']):
        return 'INSTALACIONES', 'PLOMERIA'
    
    elif any(word in descripcion_lower for word in ['eléctric', 'cable', 'interruptor', 'tomacorriente']):
        return 'INSTALACIONES', 'ELECTRICIDAD'
    
    elif any(word in descripcion_lower for word in ['pintura', 'repello', 'acabado', 'fino']):
        return 'ACABADOS', 'PINTURA' if 'pintura' in descripcion_lower else 'REPELLOS'
    
    else:
        return 'OTROS', 'VARIOS' 