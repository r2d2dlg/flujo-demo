from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import text

from .. import crud, models, schemas, auth

router = APIRouter(
    prefix="/proyeccion-ventas",
    tags=["Proyeccion Ventas"]
)

@router.post("/", response_model=schemas.ProyeccionFlujoEfectivoVentas)
def create_proyeccion_venta_entry(
    proyeccion: schemas.ProyeccionFlujoEfectivoVentasCreate, 
    db: Session = Depends(auth.get_db)
):
    # Optional: Add any specific permission checks here, e.g., based on user role/department
    # current_user = auth.get_current_user_from_context # Pseudo-code, depends on how you get current_user
    # if current_user.department != "Ventas" and current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not authorized to create sales projections")
    return crud.create_proyeccion_flujo_efectivo_venta(db=db, proyeccion=proyeccion)

@router.get("/{proyeccion_id}", response_model=schemas.ProyeccionFlujoEfectivoVentas)
def read_proyeccion_venta_entry(proyeccion_id: int, db: Session = Depends(auth.get_db)):
    db_proyeccion = crud.get_proyeccion_flujo_efectivo_venta(db, proyeccion_id=proyeccion_id)
    if db_proyeccion is None:
        raise HTTPException(status_code=404, detail="Entrada de proyección de ventas no encontrada")
    return db_proyeccion

@router.get("/", response_model=List[schemas.ProyeccionFlujoEfectivoVentas])
def read_proyecciones_venta(skip: int = 0, limit: int = 100, db: Session = Depends(auth.get_db)):
    proyecciones = crud.get_proyecciones_flujo_efectivo_ventas(db, skip=skip, limit=limit)
    return proyecciones

@router.put("/{proyeccion_id}", response_model=schemas.ProyeccionFlujoEfectivoVentas)
def update_proyeccion_venta_entry(
    proyeccion_id: int,
    proyeccion_update: schemas.ProyeccionFlujoEfectivoVentasUpdate,
    db: Session = Depends(auth.get_db)
):
    db_proyeccion = crud.update_proyeccion_flujo_efectivo_venta(db, proyeccion_id=proyeccion_id, proyeccion_update=proyeccion_update)
    if db_proyeccion is None:
        raise HTTPException(status_code=404, detail="Entrada de proyección de ventas no encontrada para actualizar")
    return db_proyeccion

@router.delete("/{proyeccion_id}", response_model=schemas.ProyeccionFlujoEfectivoVentas)
def delete_proyeccion_venta_entry(proyeccion_id: int, db: Session = Depends(auth.get_db)):
    db_proyeccion = crud.delete_proyeccion_flujo_efectivo_venta(db, proyeccion_id=proyeccion_id)
    if db_proyeccion is None:
        raise HTTPException(status_code=404, detail="Entrada de proyección de ventas no encontrada para eliminar")
    return db_proyeccion

MONTH_MAP = {
    "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
    "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
    "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
}

@router.get("/cash-flow/{year}", response_model=schemas.SalesCashFlowResponse)
def get_sales_cash_flow(year: int, db: Session = Depends(auth.get_db)):
    # query = text(f"SELECT actividad, enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre, total_anual, grp, grp_order FROM v_flujo_efectivo_ventas_consolidado WHERE anio = :year ORDER BY grp_order, actividad")
    # For now, the view v_flujo_efectivo_ventas_consolidado does not have an 'anio' column.
    # It's designed to show all data. We will simulate year filtering in the application logic for now,
    # or assume the view might be adapted later if it's purely for one year at a time based on underlying data.
    # For this implementation, we assume the view provides data for a conceptual "current" year or all years,
    # and we'll be processing month columns as given.
    # If the view *must* be filtered by year at the DB level, its definition would need an 'anio' column.

    # Let's assume the view `v_flujo_efectivo_ventas_consolidado` returns all necessary columns
    # including 'actividad', month names ('enero', 'febrero', ...), 'total_anual', 'grp', 'grp_order'.
    # We will fetch all and then structure it.

    try:
        # Using SQLAlchemy Core to execute a raw SQL query against the view
        result = db.execute(text("SELECT * FROM v_flujo_efectivo_ventas_consolidado ORDER BY grp_order, actividad"))
        rows = result.fetchall()
    except Exception as e:
        # Log the exception e
        raise HTTPException(status_code=500, detail=f"Error fetching sales cash flow data: {str(e)}")

    if not rows:
        # Return empty data structure if no rows found, matching SalesCashFlowResponse
        return schemas.SalesCashFlowResponse(data=[], year=year)

    cash_flow_items = []
    for row in rows:
        row_dict = dict(row._mapping) # Convert SQLAlchemy Row to dict
        
        meses_data = {}
        for month_name, month_num_str in MONTH_MAP.items():
            # The view provides month names directly as columns.
            # The frontend will eventually want YYYY-MM format.
            meses_data[f"{year}-{month_num_str}"] = row_dict.get(month_name.lower()) # Ensure lowercase match with view column names

        item = schemas.SalesCashFlowItem(
            actividad=row_dict.get("actividad"),
            meses=meses_data,
            total_anual=row_dict.get("total_anual"),
            grp=row_dict.get("grp"),
            grp_order=row_dict.get("grp_order")
        )
        cash_flow_items.append(item)

    return schemas.SalesCashFlowResponse(data=cash_flow_items, year=year) 