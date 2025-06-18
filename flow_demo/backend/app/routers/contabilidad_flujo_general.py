from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, text
from typing import List, Optional
from decimal import Decimal

from .. import models, schemas, auth # Assuming auth provides get_db

router = APIRouter(
    tags=["Contabilidad - Flujo General"]
)

@router.get("/ingresos-por-cobros", response_model=schemas.FlujoGeneralIngresosResponse)
def get_ingresos_por_cobros(
    year: int = Query(..., description="Año para el filtro"),
    month: int = Query(..., ge=1, le=12, description="Mes para el filtro (1-12)"),
    db: Session = Depends(auth.get_db)
):
    """
    Obtiene el total de ingresos por cobros (pagos recibidos) para un mes y año específicos,
    desglosado por origen del pago (Cliente, Banco, Otro).
    El monto considerado como ingreso es el monto total del pago menos cualquier porción
    que haya sido abonada directamente a una línea de crédito.
    """
    try:
        # Query to sum effective montos (monto - monto_abono_linea_credito) grouped by origen_pago
        query_results = (
            db.query(
                models.Pago.origen_pago,
                func.sum(
                    models.Pago.monto - func.coalesce(models.Pago.monto_abono_linea_credito, Decimal('0.00'))
                ).label("total_monto_efectivo")
            )
            .filter(extract('year', models.Pago.fecha_pago) == year)
            .filter(extract('month', models.Pago.fecha_pago) == month)
            .group_by(models.Pago.origen_pago)
            .all()
        )

        cobros_por_origen_list: List[schemas.IngresoPorOrigen] = []
        total_cobros_mes_decimal = Decimal("0.00")

        for origen, total_efectivo in query_results:
            total_decimal = total_efectivo if total_efectivo is not None else Decimal("0.00")
            cobros_por_origen_list.append(
                schemas.IngresoPorOrigen(
                    origen_pago=origen if origen else "DESCONOCIDO", 
                    total_monto=total_decimal
                )
            )
            total_cobros_mes_decimal += total_decimal
        
        # Ensure all defined origins are present, even if with 0 amount
        defined_origins = ["CLIENTE", "BANCO", "OTRO"] # Or get from a config/enum
        present_origins = {item.origen_pago for item in cobros_por_origen_list if item.origen_pago != "DESCONOCIDO"}

        for defined_o in defined_origins:
            if defined_o not in present_origins:
                cobros_por_origen_list.append(schemas.IngresoPorOrigen(origen_pago=defined_o, total_monto=Decimal("0.00")))

        return schemas.FlujoGeneralIngresosResponse(
            total_cobros_mes=total_cobros_mes_decimal,
            cobros_por_origen=cobros_por_origen_list
        )

    except Exception as e:
        print(f"Error fetching ingresos por cobros: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor al obtener ingresos por cobros: {str(e)}")

@router.get("/ingresos-por-ventas-cashflow")
def get_ingresos_por_ventas_cashflow(db: Session = Depends(auth.get_db)):
    """
    Get cash flow for sales revenue (company portion of payments) over 39 months.
    Returns the portion of payments that go to the company (total payment minus credit line payment).
    """
    try:
        result = db.execute(text("""
            SELECT 
                months.offset_month,
                TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * months.offset_month), 'YYYY_MM') as month,
                COALESCE(SUM(
                    pagos.monto - COALESCE(pagos.monto_abono_linea_credito, 0)
                ), 0) as monto
            FROM generate_series(-3, 35) as months(offset_month)
            LEFT JOIN pagos ON 
                TO_CHAR(DATE_TRUNC('month', pagos.fecha_pago), 'YYYY_MM') = 
                TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * months.offset_month), 'YYYY_MM')
            GROUP BY months.offset_month
            ORDER BY months.offset_month
        """)).fetchall()
        
        return [{"month": row[1], "monto": float(row[2])} for row in result]
    except Exception as e:
        print(f"Error fetching ingresos por ventas cashflow: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

# Add other endpoints for Egresos, Financiamiento etc. here later 