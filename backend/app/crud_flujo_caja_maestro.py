"""
CRUD operations for Flujo de Caja Maestro
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_, func
from datetime import date, datetime
from decimal import Decimal

from . import models, schemas


def create_flujo_item(db: Session, item: schemas.FlujoCajaMaestroCreate) -> models.FlujoCajaMaestro:
    """Crear nuevo item de flujo de caja"""
    
    # Si no se proporciona distribución mensual, crearla automáticamente
    if not item.distribucion_mensual:
        # Usar función de base de datos para crear distribución
        periodo_fin = item.periodo_fin if item.periodo_fin else None
        
        query = text("""
            SELECT distribuir_monto_temporal(:monto, :fecha_inicio, :fecha_fin, 'INICIO')
        """)
        
        result = db.execute(query, {
            'monto': float(item.monto_base),
            'fecha_inicio': item.periodo_inicio,
            'fecha_fin': periodo_fin
        }).scalar()
        
        item.distribucion_mensual = result
    
    db_item = models.FlujoCajaMaestro(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_flujo_item(db: Session, item_id: int) -> Optional[models.FlujoCajaMaestro]:
    """Obtener item por ID"""
    return db.query(models.FlujoCajaMaestro).filter(models.FlujoCajaMaestro.id == item_id).first()


def get_flujo_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    categoria_principal: Optional[str] = None,
    categoria_secundaria: Optional[str] = None,
    proyecto: Optional[str] = None,
    tipo_registro: Optional[str] = None,
    estado: str = 'ACTIVO'
) -> List[models.FlujoCajaMaestro]:
    """Obtener lista de items con filtros"""
    
    query = db.query(models.FlujoCajaMaestro).filter(models.FlujoCajaMaestro.estado == estado)
    
    if categoria_principal:
        query = query.filter(models.FlujoCajaMaestro.categoria_principal == categoria_principal)
    
    if categoria_secundaria:
        query = query.filter(models.FlujoCajaMaestro.categoria_secundaria == categoria_secundaria)
    
    if proyecto:
        query = query.filter(models.FlujoCajaMaestro.proyecto == proyecto)
    
    if tipo_registro:
        query = query.filter(models.FlujoCajaMaestro.tipo_registro == tipo_registro)
    
    return query.offset(skip).limit(limit).all()


def update_flujo_item(
    db: Session, 
    item_id: int, 
    item_update: schemas.FlujoCajaMaestroUpdate
) -> Optional[models.FlujoCajaMaestro]:
    """Actualizar item de flujo de caja"""
    
    db_item = db.query(models.FlujoCajaMaestro).filter(models.FlujoCajaMaestro.id == item_id).first()
    if not db_item:
        return None
    
    update_data = item_update.dict(exclude_unset=True)
    
    # Actualizar fecha de modificación
    update_data['fecha_modificacion'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


def update_distribucion_mensual(
    db: Session,
    item_id: int,
    distribucion: Dict[str, float],
    usuario: Optional[str] = None
) -> Optional[models.FlujoCajaMaestro]:
    """Actualizar solo la distribución mensual de un item"""
    
    db_item = db.query(models.FlujoCajaMaestro).filter(models.FlujoCajaMaestro.id == item_id).first()
    if not db_item:
        return None
    
    db_item.distribucion_mensual = distribucion
    db_item.fecha_modificacion = datetime.utcnow()
    if usuario:
        db_item.usuario_modificacion = usuario
    
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_flujo_item(db: Session, item_id: int) -> bool:
    """Eliminar item (soft delete cambiando estado a INACTIVO)"""
    
    db_item = db.query(models.FlujoCajaMaestro).filter(models.FlujoCajaMaestro.id == item_id).first()
    if not db_item:
        return False
    
    db_item.estado = 'INACTIVO'
    db_item.fecha_modificacion = datetime.utcnow()
    db.commit()
    return True


def get_flujo_consolidado(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    categoria_principal: Optional[str] = None,
    proyecto: Optional[str] = None,
    tipo_registro: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Obtener flujo de caja consolidado usando la vista"""
    
    query = """
    SELECT 
        categoria_principal,
        categoria_secundaria,
        subcategoria,
        tipo_registro,
        periodo_key,
        periodo_fecha,
        monto
    FROM v_flujo_caja_consolidado
    WHERE 1=1
    """
    
    params = {}
    
    if fecha_inicio:
        query += " AND periodo_fecha >= :fecha_inicio"
        params['fecha_inicio'] = fecha_inicio
    
    if fecha_fin:
        query += " AND periodo_fecha <= :fecha_fin"
        params['fecha_fin'] = fecha_fin
    
    if categoria_principal:
        query += " AND categoria_principal = :categoria_principal"
        params['categoria_principal'] = categoria_principal
    
    if tipo_registro:
        query += " AND tipo_registro = :tipo_registro"
        params['tipo_registro'] = tipo_registro
    
    query += " ORDER BY categoria_principal DESC, categoria_secundaria, periodo_fecha"
    
    result = db.execute(text(query), params)
    return [dict(row._mapping) for row in result.fetchall()]


def get_flujo_dinamico(
    db: Session,
    limit: int = 1000
) -> List[Dict[str, Any]]:
    """Obtener flujo dinámico usando la vista (3 meses antes + 60 después)"""
    
    query = """
    SELECT 
        categoria_principal,
        categoria_secundaria,
        subcategoria,
        concepto,
        proyecto,
        centro_costo,
        area_responsable,
        tipo_registro,
        moneda,
        periodo_key,
        periodo_fecha,
        año,
        mes,
        monto
    FROM v_flujo_caja_dinamico
    ORDER BY categoria_principal DESC, categoria_secundaria, periodo_fecha
    LIMIT :limit
    """
    
    result = db.execute(text(query), {'limit': limit})
    return [dict(row._mapping) for row in result.fetchall()]


def get_periodos_disponibles(db: Session) -> List[str]:
    """Obtener lista de períodos disponibles (YYYY_MM)"""
    
    query = """
    SELECT DISTINCT periodo_key
    FROM generar_periodos_dinamicos()
    ORDER BY periodo_key
    """
    
    result = db.execute(text(query))
    return [row[0] for row in result.fetchall()]


def get_categorias_info(db: Session) -> Dict[str, Any]:
    """Obtener información de categorías disponibles"""
    
    query = """
    SELECT 
        categoria_principal,
        categoria_secundaria,
        subcategoria,
        COUNT(*) as count
    FROM flujo_caja_maestro
    WHERE estado = 'ACTIVO'
    GROUP BY categoria_principal, categoria_secundaria, subcategoria
    ORDER BY categoria_principal DESC, categoria_secundaria, subcategoria
    """
    
    result = db.execute(text(query))
    return [dict(row._mapping) for row in result.fetchall()]


def get_filtros_disponibles(db: Session) -> Dict[str, Any]:
    """Obtener todos los filtros disponibles para el frontend"""
    
    query = """
    SELECT DISTINCT
        categoria_principal,
        categoria_secundaria,
        subcategoria,
        proyecto,
        tipo_registro,
        moneda
    FROM flujo_caja_maestro
    WHERE estado = 'ACTIVO'
    """
    
    result = db.execute(text(query))
    rows = [dict(row._mapping) for row in result.fetchall()]
    
    # Organizar datos para el frontend
    categorias_principales = list(set(row['categoria_principal'] for row in rows))
    categorias_secundarias = {}
    subcategorias = {}
    proyectos = list(set(row['proyecto'] for row in rows if row['proyecto']))
    tipos_registro = list(set(row['tipo_registro'] for row in rows))
    monedas = list(set(row['moneda'] for row in rows))
    
    for row in rows:
        principal = row['categoria_principal']
        secundaria = row['categoria_secundaria']
        sub = row['subcategoria']
        
        if principal not in categorias_secundarias:
            categorias_secundarias[principal] = set()
        categorias_secundarias[principal].add(secundaria)
        
        if sub and secundaria not in subcategorias:
            subcategorias[secundaria] = set()
        if sub:
            subcategorias[secundaria].add(sub)
    
    # Convertir sets a listas
    categorias_secundarias = {k: list(v) for k, v in categorias_secundarias.items()}
    subcategorias = {k: list(v) for k, v in subcategorias.items()}
    
    return {
        'categorias_principales': sorted(categorias_principales, reverse=True),
        'categorias_secundarias': categorias_secundarias,
        'subcategorias': subcategorias,
        'proyectos': sorted(proyectos),
        'tipos_registro': sorted(tipos_registro),
        'monedas': sorted(monedas)
    }


def get_resumen_por_categoria(
    db: Session,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None
) -> Dict[str, float]:
    """Obtener resumen de totales por categoría principal"""
    
    query = """
    SELECT 
        categoria_principal,
        SUM(monto) as total
    FROM v_flujo_caja_consolidado
    WHERE 1=1
    """
    
    params = {}
    
    if fecha_inicio:
        query += " AND periodo_fecha >= :fecha_inicio"
        params['fecha_inicio'] = fecha_inicio
    
    if fecha_fin:
        query += " AND periodo_fecha <= :fecha_fin"
        params['fecha_fin'] = fecha_fin
    
    query += " GROUP BY categoria_principal"
    
    result = db.execute(text(query), params)
    resumen = {row[0]: float(row[1]) for row in result.fetchall()}
    
    # Calcular flujo neto
    ingresos = resumen.get('INGRESOS', 0)
    egresos = resumen.get('EGRESOS', 0)
    resumen['FLUJO_NETO'] = ingresos - egresos
    
    return resumen 