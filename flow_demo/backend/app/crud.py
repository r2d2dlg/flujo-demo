from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional, Dict, Any
from sqlalchemy import func, extract, cast, Date
from sqlalchemy.sql import text

# CRUD operations for PlantillaComisiones

def get_plantilla_comision_venta(db: Session, comision_id: int) -> Optional[models.PlantillaComisiones]:
    return db.query(models.PlantillaComisiones).filter(models.PlantillaComisiones.id == comision_id).first()

def get_plantillas_comisiones_ventas(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.PlantillaComisiones]:
    return db.query(models.PlantillaComisiones).offset(skip).limit(limit).all()

def create_plantilla_comision_venta(
    db: Session, comision: schemas.PlantillaComisionesVentasCreate
) -> models.PlantillaComisiones:
    db_comision = models.PlantillaComisiones(**comision.model_dump())
    db.add(db_comision)
    db.commit()
    db.refresh(db_comision)
    return db_comision

def update_plantilla_comision_venta(
    db: Session, comision_id: int, comision_update: schemas.PlantillaComisionesVentasUpdate
) -> Optional[models.PlantillaComisiones]:
    db_comision = get_plantilla_comision_venta(db, comision_id)
    if db_comision:
        update_data = comision_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_comision, key, value)
        db.commit()
        db.refresh(db_comision)
    return db_comision

def delete_plantilla_comision_venta(db: Session, comision_id: int) -> Optional[models.PlantillaComisiones]:
    db_comision = get_plantilla_comision_venta(db, comision_id)
    if db_comision:
        db.delete(db_comision)
        db.commit()
    return db_comision

# Helper function to calculate total_anual for ProyeccionFlujoEfectivoVentas
def _calculate_total_anual(proyeccion_data: schemas.ProyeccionFlujoEfectivoVentasBase) -> float:
    total = sum([
        proyeccion_data.enero or 0.0,
        proyeccion_data.febrero or 0.0,
        proyeccion_data.marzo or 0.0,
        proyeccion_data.abril or 0.0,
        proyeccion_data.mayo or 0.0,
        proyeccion_data.junio or 0.0,
        proyeccion_data.julio or 0.0,
        proyeccion_data.agosto or 0.0,
        proyeccion_data.septiembre or 0.0,
        proyeccion_data.octubre or 0.0,
        proyeccion_data.noviembre or 0.0,
        proyeccion_data.diciembre or 0.0
    ])
    return total

# CRUD for ProyeccionFlujoEfectivoVentas
def get_proyeccion_flujo_efectivo_venta(db: Session, proyeccion_id: int) -> Optional[models.ProyeccionFlujoEfectivoVentas]:
    return db.query(models.ProyeccionFlujoEfectivoVentas).filter(models.ProyeccionFlujoEfectivoVentas.id == proyeccion_id).first()

def get_proyecciones_flujo_efectivo_ventas(db: Session, skip: int = 0, limit: int = 100) -> List[models.ProyeccionFlujoEfectivoVentas]:
    return db.query(models.ProyeccionFlujoEfectivoVentas).offset(skip).limit(limit).all()

def create_proyeccion_flujo_efectivo_venta(db: Session, proyeccion: schemas.ProyeccionFlujoEfectivoVentasCreate) -> models.ProyeccionFlujoEfectivoVentas:
    calculated_total_anual = _calculate_total_anual(proyeccion)
    db_proyeccion = models.ProyeccionFlujoEfectivoVentas(
        **proyeccion.model_dump(exclude_unset=True),
        total_anual=calculated_total_anual
    )
    db.add(db_proyeccion)
    db.commit()
    db.refresh(db_proyeccion)
    return db_proyeccion

def update_proyeccion_flujo_efectivo_venta(db: Session, proyeccion_id: int, proyeccion_update: schemas.ProyeccionFlujoEfectivoVentasUpdate) -> Optional[models.ProyeccionFlujoEfectivoVentas]:
    db_proyeccion = get_proyeccion_flujo_efectivo_venta(db, proyeccion_id)
    if not db_proyeccion:
        return None
    
    update_data = proyeccion_update.model_dump(exclude_unset=True)
    
    # Recalculate total_anual if any month value is being updated
    # or if total_anual is explicitly provided (though recalculation is safer)
    months_updated = any(month_key in update_data for month_key in [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ])

    if months_updated:
        # Create a temporary base model with current and updated values to pass to calculator
        current_data_for_calc = schemas.ProyeccionFlujoEfectivoVentasBase(
            actividad=db_proyeccion.actividad, # or update_data.get('actividad', db_proyeccion.actividad)
            enero=update_data.get('enero', db_proyeccion.enero),
            febrero=update_data.get('febrero', db_proyeccion.febrero),
            marzo=update_data.get('marzo', db_proyeccion.marzo),
            abril=update_data.get('abril', db_proyeccion.abril),
            mayo=update_data.get('mayo', db_proyeccion.mayo),
            junio=update_data.get('junio', db_proyeccion.junio),
            julio=update_data.get('julio', db_proyeccion.julio),
            agosto=update_data.get('agosto', db_proyeccion.agosto),
            septiembre=update_data.get('septiembre', db_proyeccion.septiembre),
            octubre=update_data.get('octubre', db_proyeccion.octubre),
            noviembre=update_data.get('noviembre', db_proyeccion.noviembre),
            diciembre=update_data.get('diciembre', db_proyeccion.diciembre)
        )
        update_data['total_anual'] = _calculate_total_anual(current_data_for_calc)
    elif 'total_anual' in update_data: # If only total_anual is provided, use it (less ideal)
        pass # It's already in update_data

    for key, value in update_data.items():
        setattr(db_proyeccion, key, value)
    
    db.commit()
    db.refresh(db_proyeccion)
    return db_proyeccion

def delete_proyeccion_flujo_efectivo_venta(db: Session, proyeccion_id: int) -> Optional[models.ProyeccionFlujoEfectivoVentas]:
    db_proyeccion = get_proyeccion_flujo_efectivo_venta(db, proyeccion_id)
    if not db_proyeccion:
        return None
    db.delete(db_proyeccion)
    db.commit()
    return db_proyeccion

def get_comisiones_by_year_month(db: Session, year: int, month: int):
    """
    Fetches records from 'plantilla_comisiones_ventas' for a specific year and month.
    Casts fecha_venta to Date type to ensure filtering works even if the column is text.
    """
    return db.query(models.PlantillaComisiones)\
        .filter(extract('year', cast(models.PlantillaComisiones.fecha_venta, Date)) == year)\
        .filter(extract('month', cast(models.PlantillaComisiones.fecha_venta, Date)) == month)\
        .all()

def get_all_comisiones_ventas(db: Session, year: int, month: int):
    """
    Fetches all records from the comisiones_ventas table.
    NOTE: This table does not have date-based columns, so year/month filtering
    is not applicable here. The entire table is returned. This is a temporary
    measure until the data model is updated.
    """
    return db.query(models.ComisionesVentas).all()

def get_combined_marketing_cashflow(db: Session) -> list[dict]:
    """
    Unions all 'vista_presupuesto_mercadeo_*_resumen' views with 'comisiones_ventas'
    and returns the aggregated cash flow data for the "Mercadeo" category.
    """
    # Step 0: Check if comisiones_ventas table exists
    comisiones_exists_query = text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE  table_schema = 'public'
            AND    table_name   = 'comisiones_ventas'
        );
    """)
    comisiones_exists = db.execute(comisiones_exists_query).scalar()

    # Step 1: Find all marketing project summary views
    view_query = text("""
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name LIKE 'vista_presupuesto_mercadeo_%_resumen'
    """)
    project_views = [f'public."{row[0]}"' for row in db.execute(view_query)]
    project_unions = " UNION ALL ".join([f'SELECT * FROM {view}' for view in project_views])

    # Step 2: Define a query for comisiones_ventas, if it exists
    comisiones_query = """
    SELECT 
        'Comisiones' as categoria,
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
        "TOTAL"
    FROM public.comisiones_ventas
    WHERE "VENDEDOR" = 'TOTAL'
    """

    # Step 3: Combine sources
    queries_to_union = []
    if project_unions:
        queries_to_union.append(f"({project_unions})")
    if comisiones_exists:
        queries_to_union.append(f"({comisiones_query})")

    if not queries_to_union:
        return [] # Return empty if no data sources are found

    full_query_str = " UNION ALL ".join(queries_to_union)

    # Step 4: Final aggregation query
    final_query = text(f"""
        SELECT
            'Mercadeo' as category,
            source.categoria as subcategory,
            source.categoria as id,
            SUM(source."ENERO") as "ENERO",
            SUM(source."FEBRERO") as "FEBRERO",
            SUM(source."MARZO") as "MARZO",
            SUM(source."ABRIL") as "ABRIL",
            SUM(source."MAYO") as "MAYO",
            SUM(source."JUNIO") as "JUNIO",
            SUM(source."JULIO") as "JULIO",
            SUM(source."AGOSTO") as "AGOSTO",
            SUM(source."SEPTIEMBRE") as "SEPTIEMBRE",
            SUM(source."OCTUBRE") as "OCTUBRE",
            SUM(source."NOVIEMBRE") as "NOVIEMBRE",
            SUM(source."DICIEMBRE") as "DICIEMBRE",
            SUM(source."TOTAL") as "TOTAL"
        FROM (
            {full_query_str}
        ) as source
        WHERE source.categoria != 'GRAN TOTAL'
        GROUP BY source.categoria
        ORDER BY source.categoria;
    """)
    
    result = db.execute(final_query)
    columns = result.keys()
    
    return [dict(zip(columns, row)) for row in result] 