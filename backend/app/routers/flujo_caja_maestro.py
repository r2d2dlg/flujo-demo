"""
Router for Flujo de Caja Maestro API endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from .. import schemas, crud_flujo_caja_maestro, auth

router = APIRouter(prefix="/api/flujo-caja-maestro", tags=["Flujo de Caja Maestro"])


@router.post("/", response_model=schemas.FlujoCajaMaestro)
def create_flujo_item(
    item: schemas.FlujoCajaMaestroCreate,
    db: Session = Depends(auth.get_db)
):
    """Crear nuevo item de flujo de caja"""
    try:
        return crud_flujo_caja_maestro.create_flujo_item(db=db, item=item)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating item: {str(e)}")


@router.get("/", response_model=List[schemas.FlujoCajaMaestro])
def get_flujo_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    categoria_principal: Optional[str] = None,
    categoria_secundaria: Optional[str] = None,
    proyecto: Optional[str] = None,
    tipo_registro: Optional[str] = None,
    estado: str = 'ACTIVO',
    db: Session = Depends(auth.get_db)
):
    """Obtener lista de items de flujo de caja con filtros"""
    return crud_flujo_caja_maestro.get_flujo_items(
        db=db,
        skip=skip,
        limit=limit,
        categoria_principal=categoria_principal,
        categoria_secundaria=categoria_secundaria,
        proyecto=proyecto,
        tipo_registro=tipo_registro,
        estado=estado
    )


@router.get("/{item_id}", response_model=schemas.FlujoCajaMaestro)
def get_flujo_item(
    item_id: int,
    db: Session = Depends(auth.get_db)
):
    """Obtener item específico por ID"""
    item = crud_flujo_caja_maestro.get_flujo_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.put("/{item_id}", response_model=schemas.FlujoCajaMaestro)
def update_flujo_item(
    item_id: int,
    item_update: schemas.FlujoCajaMaestroUpdate,
    db: Session = Depends(auth.get_db)
):
    """Actualizar item de flujo de caja"""
    updated_item = crud_flujo_caja_maestro.update_flujo_item(
        db=db, 
        item_id=item_id, 
        item_update=item_update
    )
    if not updated_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated_item


@router.put("/{item_id}/distribucion", response_model=schemas.FlujoCajaMaestro)
def update_distribucion_mensual(
    item_id: int,
    request: schemas.DistribucionMensualRequest,
    usuario: Optional[str] = None,
    db: Session = Depends(auth.get_db)
):
    """Actualizar distribución mensual de un item"""
    updated_item = crud_flujo_caja_maestro.update_distribucion_mensual(
        db=db,
        item_id=item_id,
        distribucion=request.distribucion,
        usuario=usuario
    )
    if not updated_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated_item


@router.delete("/{item_id}")
def delete_flujo_item(
    item_id: int,
    db: Session = Depends(auth.get_db)
):
    """Eliminar item (soft delete)"""
    success = crud_flujo_caja_maestro.delete_flujo_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


@router.get("/consolidado/view", response_model=schemas.FlujoCajaConsolidadoResponse)
def get_flujo_consolidado(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    categoria_principal: Optional[str] = None,
    proyecto: Optional[str] = None,
    tipo_registro: Optional[str] = None,
    db: Session = Depends(auth.get_db)
):
    """Obtener flujo de caja consolidado con filtros"""
    
    # Obtener datos consolidados
    data_raw = crud_flujo_caja_maestro.get_flujo_consolidado(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        categoria_principal=categoria_principal,
        proyecto=proyecto,
        tipo_registro=tipo_registro
    )
    
    # Obtener períodos disponibles
    periodos = crud_flujo_caja_maestro.get_periodos_disponibles(db=db)
    
    # Obtener resumen por categoría
    resumen = crud_flujo_caja_maestro.get_resumen_por_categoria(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )
    
    # Agrupar datos por concepto y organizar meses
    consolidated_data = {}
    
    for row in data_raw:
        key = (
            row['categoria_principal'],
            row['categoria_secundaria'],
            row['subcategoria'],
            row['tipo_registro']
        )
        
        if key not in consolidated_data:
            consolidated_data[key] = {
                'categoria_principal': row['categoria_principal'],
                'categoria_secundaria': row['categoria_secundaria'],
                'subcategoria': row['subcategoria'],
                'tipo_registro': row['tipo_registro'],
                'meses': {},
                'total': 0
            }
        
        # Agregar monto al período correspondiente
        periodo_key = row['periodo_key']
        monto = float(row['monto'])
        consolidated_data[key]['meses'][periodo_key] = monto
        consolidated_data[key]['total'] += monto
    
    # Convertir a lista de items
    data_items = []
    for item_data in consolidated_data.values():
        # Asegurar que todos los períodos estén presentes
        for periodo in periodos:
            if periodo not in item_data['meses']:
                item_data['meses'][periodo] = 0.0
        
        data_items.append(schemas.FlujoCajaConsolidadoItem(**item_data))
    
    return schemas.FlujoCajaConsolidadoResponse(
        data=data_items,
        periodos=periodos,
        resumen=resumen
    )


@router.get("/dinamico/view", response_model=schemas.FlujoCajaDinamicoResponse)
def get_flujo_dinamico(
    limit: int = Query(1000, le=5000),
    db: Session = Depends(auth.get_db)
):
    """Obtener flujo dinámico (3 meses antes + 60 después)"""
    
    data_raw = crud_flujo_caja_maestro.get_flujo_dinamico(db=db, limit=limit)
    
    # Convertir a objetos Pydantic
    data_items = []
    for row in data_raw:
        # Convertir tipos de datos
        item_data = {
            'categoria_principal': row['categoria_principal'],
            'categoria_secundaria': row['categoria_secundaria'],
            'subcategoria': row['subcategoria'],
            'concepto': row['concepto'],
            'proyecto': row['proyecto'],
            'centro_costo': row['centro_costo'],
            'area_responsable': row['area_responsable'],
            'tipo_registro': row['tipo_registro'],
            'moneda': row['moneda'],
            'periodo_key': row['periodo_key'],
            'periodo_fecha': row['periodo_fecha'],
            'año': int(row['año']),
            'mes': int(row['mes']),
            'monto': float(row['monto'])
        }
        data_items.append(schemas.FlujoCajaDinamicoItem(**item_data))
    
    return schemas.FlujoCajaDinamicoResponse(
        data=data_items,
        total_periodos=len(set(item.periodo_key for item in data_items))
    )


@router.get("/filtros/disponibles", response_model=schemas.FlujoCajaFiltros)
def get_filtros_disponibles(db: Session = Depends(auth.get_db)):
    """Obtener todos los filtros disponibles"""
    filtros = crud_flujo_caja_maestro.get_filtros_disponibles(db=db)
    return schemas.FlujoCajaFiltros(**filtros)


@router.get("/categorias/info")
def get_categorias_info(db: Session = Depends(auth.get_db)):
    """Obtener información detallada de categorías"""
    return crud_flujo_caja_maestro.get_categorias_info(db=db)


@router.get("/periodos/disponibles")
def get_periodos_disponibles(db: Session = Depends(auth.get_db)):
    """Obtener lista de períodos disponibles"""
    return {
        "periodos": crud_flujo_caja_maestro.get_periodos_disponibles(db=db)
    }


@router.get("/resumen/categorias")
def get_resumen_categorias(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(auth.get_db)
):
    """Obtener resumen de totales por categoría"""
    return {
        "resumen": crud_flujo_caja_maestro.get_resumen_por_categoria(
            db=db,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
    }


# =====================================================
# ENDPOINTS PARA TESTING Y DESARROLLO
# =====================================================

@router.post("/test/sample-data")
def create_sample_data(db: Session = Depends(auth.get_db)):
    """Crear datos de ejemplo para testing (solo desarrollo)"""
    
    sample_items = [
        {
            "categoria_principal": "INGRESOS",
            "categoria_secundaria": "Ventas_Proyectos",
            "subcategoria": "Proyecto_B",
            "concepto": "Venta apartamentos Torre Norte",
            "proyecto": "Torre_Norte",
            "monto_base": 750000,
            "periodo_inicio": "2024-04-01",
            "tipo_registro": "PROYECTADO"
        },
        {
            "categoria_principal": "EGRESOS",
            "categoria_secundaria": "Gastos_Operativos",
            "subcategoria": "Marketing",
            "concepto": "Campaña digital Q2 2024",
            "monto_base": 25000,
            "periodo_inicio": "2024-04-01",
            "periodo_fin": "2024-06-30",
            "tipo_registro": "PRESUPUESTADO"
        },
        {
            "categoria_principal": "EGRESOS",
            "categoria_secundaria": "Costos_Directos",
            "subcategoria": "Mano_Obra",
            "concepto": "Contratistas construcción",
            "proyecto": "Torre_Norte",
            "monto_base": 120000,
            "periodo_inicio": "2024-03-01",
            "periodo_fin": "2024-09-30",
            "tipo_registro": "PRESUPUESTADO"
        }
    ]
    
    created_items = []
    for item_data in sample_items:
        try:
            item = schemas.FlujoCajaMaestroCreate(**item_data)
            created_item = crud_flujo_caja_maestro.create_flujo_item(db=db, item=item)
            created_items.append(created_item.id)
        except Exception as e:
            print(f"Error creating sample item: {e}")
            continue
    
    return {
        "message": f"Created {len(created_items)} sample items",
        "item_ids": created_items
    } 