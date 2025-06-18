from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy.sql import text
from datetime import datetime

# Assuming crud_payroll, schemas, models are in the parent directory relative to routers/
# If routers is app/routers, then parent is app/
from .. import crud_payroll, schemas, models 
from ..database import get_db

router = APIRouter(
    prefix="/payroll",
    tags=["Payroll"],
    responses={404: {"description": "Not found"}},
)

# Helper function to check for existing record by nombre (PK)
async def check_existing_record(db: Session, get_function: callable, nombre: str, record_type: str):
    existing = get_function(db, nombre=nombre)
    if existing:
        raise HTTPException(status_code=400, detail=f"{record_type} with NOMBRE '{nombre}' already exists.")

# --- API Endpoints for PlanillaAdministracion ---
@router.post("/planillas/administracion/", response_model=schemas.PlanillaAdministracion, status_code=201)
async def create_planilla_administracion(planilla: schemas.PlanillaAdministracionCreate, db: Session = Depends(get_db)):
    await check_existing_record(db, crud_payroll.get_planilla_administracion, planilla.nombre, "Planilla Administracion")
    return crud_payroll.create_planilla_administracion(db=db, planilla=planilla)

@router.get("/planillas/administracion/{nombre}", response_model=schemas.PlanillaAdministracion)
def read_planilla_administracion(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.get_planilla_administracion(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Administracion not found")
    return db_planilla

@router.get("/planillas/administracion/", response_model=List[schemas.PlanillaAdministracion])
def read_planillas_administracion(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_payroll.get_planillas_administracion(db, skip=skip, limit=limit)

@router.put("/planillas/administracion/{nombre}", response_model=schemas.PlanillaAdministracion)
def update_planilla_administracion(nombre: str, planilla: schemas.PlanillaAdministracionUpdate, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.update_planilla_administracion(db, nombre=nombre, planilla_update=planilla)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Administracion not found")
    return db_planilla

@router.delete("/planillas/administracion/{nombre}", response_model=schemas.PlanillaAdministracion)
def delete_planilla_administracion(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.delete_planilla_administracion(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Administracion not found")
    return db_planilla

# --- API Endpoints for PlanillaFijaConstruccion ---
@router.post("/planillas/fija_construccion/", response_model=schemas.PlanillaFijaConstruccion, status_code=201)
async def create_planilla_fija_construccion(planilla: schemas.PlanillaFijaConstruccionCreate, db: Session = Depends(get_db)):
    await check_existing_record(db, crud_payroll.get_planilla_fija_construccion, planilla.nombre, "Planilla Fija Construccion")
    return crud_payroll.create_planilla_fija_construccion(db=db, planilla=planilla)

@router.get("/planillas/fija_construccion/{nombre}", response_model=schemas.PlanillaFijaConstruccion)
def read_planilla_fija_construccion(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.get_planilla_fija_construccion(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Fija Construccion not found")
    return db_planilla

@router.get("/planillas/fija_construccion/", response_model=List[schemas.PlanillaFijaConstruccion])
def read_planillas_fija_construccion(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_payroll.get_planillas_fija_construccion(db, skip=skip, limit=limit)

@router.put("/planillas/fija_construccion/{nombre}", response_model=schemas.PlanillaFijaConstruccion)
def update_planilla_fija_construccion(nombre: str, planilla: schemas.PlanillaFijaConstruccionUpdate, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.update_planilla_fija_construccion(db, nombre=nombre, planilla_update=planilla)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Fija Construccion not found")
    return db_planilla

@router.delete("/planillas/fija_construccion/{nombre}", response_model=schemas.PlanillaFijaConstruccion)
def delete_planilla_fija_construccion(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.delete_planilla_fija_construccion(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Fija Construccion not found")
    return db_planilla

# --- API Endpoints for PlanillaGerencial ---
@router.post("/planillas/gerencial/", response_model=schemas.PlanillaGerencial, status_code=201)
async def create_planilla_gerencial(planilla: schemas.PlanillaGerencialCreate, db: Session = Depends(get_db)):
    await check_existing_record(db, crud_payroll.get_planilla_gerencial, planilla.nombre, "Planilla Gerencial")
    return crud_payroll.create_planilla_gerencial(db=db, planilla=planilla)

@router.get("/planillas/gerencial/{nombre}", response_model=schemas.PlanillaGerencial)
def read_planilla_gerencial(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.get_planilla_gerencial(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Gerencial not found")
    return db_planilla

@router.get("/planillas/gerencial/", response_model=List[schemas.PlanillaGerencial])
def read_planillas_gerencial(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_payroll.get_planillas_gerencial(db, skip=skip, limit=limit)

@router.put("/planillas/gerencial/{nombre}", response_model=schemas.PlanillaGerencial)
def update_planilla_gerencial(nombre: str, planilla: schemas.PlanillaGerencialUpdate, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.update_planilla_gerencial(db, nombre=nombre, planilla_update=planilla)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Gerencial not found")
    return db_planilla

@router.delete("/planillas/gerencial/{nombre}", response_model=schemas.PlanillaGerencial)
def delete_planilla_gerencial(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.delete_planilla_gerencial(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Gerencial not found")
    return db_planilla

# --- API Endpoints for PlanillaServicioProfesionales ---
@router.post("/planillas/servicio_profesionales/", response_model=schemas.PlanillaServicioProfesionales, status_code=201)
async def create_planilla_servicio_profesionales(planilla: schemas.PlanillaServicioProfesionalesCreate, db: Session = Depends(get_db)):
    await check_existing_record(db, crud_payroll.get_planilla_servicio_profesionales, planilla.nombre, "Planilla Servicio Profesionales")
    return crud_payroll.create_planilla_servicio_profesionales(db=db, planilla=planilla)

@router.get("/planillas/servicio_profesionales/{nombre}", response_model=schemas.PlanillaServicioProfesionales)
def read_planilla_servicio_profesionales(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.get_planilla_servicio_profesionales(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Servicio Profesionales not found")
    return db_planilla

@router.get("/planillas/servicio_profesionales/", response_model=List[schemas.PlanillaServicioProfesionales])
def read_planillas_servicio_profesionales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_payroll.get_planillas_servicio_profesionales(db, skip=skip, limit=limit)

@router.put("/planillas/servicio_profesionales/{nombre}", response_model=schemas.PlanillaServicioProfesionales)
def update_planilla_servicio_profesionales(nombre: str, planilla: schemas.PlanillaServicioProfesionalesUpdate, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.update_planilla_servicio_profesionales(db, nombre=nombre, planilla_update=planilla)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Servicio Profesionales not found")
    return db_planilla

@router.delete("/planillas/servicio_profesionales/{nombre}", response_model=schemas.PlanillaServicioProfesionales)
def delete_planilla_servicio_profesionales(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.delete_planilla_servicio_profesionales(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Servicio Profesionales not found")
    return db_planilla

# --- API Endpoints for PlanillaVariableConstruccion ---
@router.post("/planillas/variable_construccion/", response_model=schemas.PlanillaVariableConstruccion, status_code=201)
async def create_planilla_variable_construccion(planilla: schemas.PlanillaVariableConstruccionCreate, db: Session = Depends(get_db)):
    await check_existing_record(db, crud_payroll.get_planilla_variable_construccion, planilla.nombre, "Planilla Variable Construccion")
    return crud_payroll.create_planilla_variable_construccion(db=db, planilla=planilla)

@router.get("/planillas/variable_construccion/{nombre}", response_model=schemas.PlanillaVariableConstruccion)
def read_planilla_variable_construccion(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.get_planilla_variable_construccion(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Variable Construccion not found")
    return db_planilla

@router.get("/planillas/variable_construccion/", response_model=List[schemas.PlanillaVariableConstruccion])
def read_planillas_variable_construccion(skip: int = 0, limit: int = 100, proyecto: str = None, db: Session = Depends(get_db)):
    return crud_payroll.get_planillas_variable_construccion(db, skip=skip, limit=limit, proyecto=proyecto)

@router.put("/planillas/variable_construccion/{nombre}", response_model=schemas.PlanillaVariableConstruccion)
def update_planilla_variable_construccion(nombre: str, planilla: schemas.PlanillaVariableConstruccionUpdate, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.update_planilla_variable_construccion(db, nombre=nombre, planilla_update=planilla)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Variable Construccion not found")
    return db_planilla

@router.delete("/planillas/variable_construccion/{nombre}", response_model=schemas.PlanillaVariableConstruccion)
def delete_planilla_variable_construccion(nombre: str, db: Session = Depends(get_db)):
    db_planilla = crud_payroll.delete_planilla_variable_construccion(db, nombre=nombre)
    if db_planilla is None:
        raise HTTPException(status_code=404, detail="Planilla Variable Construccion not found")
    return db_planilla

# --- API Endpoints for ProyectoVariablePayroll ---

@router.post("/proyecto-variable-payroll/", response_model=schemas.ProyectoVariablePayrollOut, status_code=201)
def create_assignment(
    assignment: schemas.ProyectoVariablePayrollCreate, db: Session = Depends(get_db)
):
    # Optional: Check if an assignment for this project already exists to avoid duplicates
    existing_assignments = crud_payroll.get_proyecto_variable_payroll_assignments(db, proyecto=assignment.proyecto)
    if existing_assignments:
        raise HTTPException(status_code=400, detail=f"An assignment for project '{assignment.proyecto}' already exists.")
    return crud_payroll.create_proyecto_variable_payroll_assignment(db=db, assignment=assignment)

@router.get("/proyecto-variable-payroll/", response_model=List[schemas.ProyectoVariablePayrollOut])
def get_assignments(proyecto: str, db: Session = Depends(get_db)):
    return crud_payroll.get_proyecto_variable_payroll_assignments(db, proyecto=proyecto)

@router.put("/proyecto-variable-payroll/{assignment_id}", response_model=schemas.ProyectoVariablePayrollOut)
def update_assignment(
    assignment_id: int,
    assignment_update: schemas.ProyectoVariablePayrollUpdate,
    db: Session = Depends(get_db)
):
    updated_assignment = crud_payroll.update_proyecto_variable_payroll_assignment(
        db, assignment_id=assignment_id, assignment_update=assignment_update
    )
    if updated_assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return updated_assignment

@router.delete("/proyecto-variable-payroll/{assignment_id}", response_model=schemas.ProyectoVariablePayrollOut)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    deleted_assignment = crud_payroll.delete_proyecto_variable_payroll_assignment(db, assignment_id=assignment_id)
    if deleted_assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return deleted_assignment

# --- API Endpoints for Views ---
@router.get("/views/administracion/", response_model=List[schemas.VPlanillaAdministracion])
def read_v_planilla_administracion(db: Session = Depends(get_db)):
    return crud_payroll.get_v_planilla_administracion_data(db=db)

@router.get("/views/fija_construccion/", response_model=List[schemas.VPlanillaFijaConstruccion])
def read_v_planilla_fija_construccion(db: Session = Depends(get_db)):
    return crud_payroll.get_v_planilla_fija_construccion_data(db=db)

@router.get("/views/gerencial/", response_model=List[schemas.VPlanillaGerencial])
def read_v_planilla_gerencial(db: Session = Depends(get_db)):
    return crud_payroll.get_v_planilla_gerencial_data(db=db)

@router.get("/views/servicio_profesionales/", response_model=List[schemas.VPlanillaServicioProfesionales])
def read_v_planilla_servicio_profesionales(db: Session = Depends(get_db)):
    return crud_payroll.get_v_planilla_servicio_profesionales_data(db=db)

@router.get("/views/variable_construccion/", response_model=List[schemas.VPlanillaVariableConstruccion])
def read_v_planilla_variable_construccion(db: Session = Depends(get_db)):
    return crud_payroll.get_v_planilla_variable_construccion_data(db=db)

# --- Flujo de Planillas Endpoints ---

@router.get("/flujo/planilla-administracion")
def get_flujo_planilla_administracion(db: Session = Depends(get_db)):
    """Get cash flow for planilla administracion"""
    result = db.execute(text("""
        SELECT 
            TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month,
            COALESCE(SUM("Sal. Bruto"), 0) as monto
        FROM planilla_administracion
        GROUP BY month
        ORDER BY month
    """)).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result]

@router.get("/flujo/planilla-fija-construccion")
def get_flujo_planilla_fija_construccion(db: Session = Depends(get_db)):
    """Get cash flow for planilla fija construccion"""
    result = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month,
            COALESCE(SUM("RATA_X_H" * "HORAS_REGULARES" +
                COALESCE("RATA_X_H" * 1.25 * "HORAS_EXT_1_25", 0) +
                COALESCE("RATA_X_H" * 1.5 * "HORAS_EXT_1_5", 0) +
                COALESCE("RATA_X_H" * 2.0 * "HORAS_EXT_2_0", 0)), 0) as monto
        FROM planilla_fija_construccion
        GROUP BY month
        ORDER BY month
    """)).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result]

@router.get("/flujo/planilla-gerencial")
def get_flujo_planilla_gerencial(db: Session = Depends(get_db)):
    """Get cash flow for planilla gerencial"""
    result = db.execute(text("""
        SELECT
            TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month,
            COALESCE(SUM("SALARIO"), 0) as monto
        FROM planilla_gerencial
        GROUP BY month
        ORDER BY month
    """)).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result]

@router.get("/flujo/planilla-servicio-profesionales")
def get_flujo_planilla_servicio_profesionales(db: Session = Depends(get_db)):
    """Get cash flow for planilla servicio profesionales"""
    result = db.execute(text("""
        SELECT 
            TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month,
            COALESCE(SUM("SALARIO QUINCENAL" * 2), 0) as monto
        FROM planilla_servicio_profesionales
        GROUP BY month
        ORDER BY month
    """)).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result]

@router.get("/flujo/planilla-variable")
def get_flujo_planilla_variable(proyecto: str, db: Session = Depends(get_db)):
    """
    Get cash flow for planilla variable for a specific project, considering its active period.
    """
    result = db.execute(text("""
        WITH months AS (
            SELECT TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month
        ),
        project_assignments AS (
            SELECT
                pv.start_month,
                pv.end_month,
                pv.is_active,
                SUM(
                    pvc."RATA_X_H" * pvc."HORAS_REGULARES" +
                    COALESCE(pvc."RATA_X_H" * 1.25 * pvc."HORAS_EXT_1_25", 0) +
                    COALESCE(pvc."RATA_X_H" * 1.5 * pvc."HORAS_EXT_1_5", 0) +
                    COALESCE(pvc."RATA_X_H" * 2.0 * pvc."HORAS_EXT_2_0", 0)
                ) as total_monto
            FROM proyecto_variable_payroll pv
            JOIN planilla_variable_construccion pvc ON LOWER(pvc.proyecto) = LOWER(pv.proyecto)
            WHERE LOWER(pv.proyecto) = LOWER(:proyecto) AND pv.is_active = true
            GROUP BY pv.start_month, pv.end_month, pv.is_active
        )
        SELECT
            m.month,
            COALESCE(pa.total_monto, 0) as monto
        FROM months m
        LEFT JOIN project_assignments pa ON
            m.month >= pa.start_month AND
            m.month <= pa.end_month
        ORDER BY m.month
    """), {"proyecto": proyecto}).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result]

@router.get("/flujo/planilla-variable-consolidado")
def get_flujo_planilla_variable_consolidado(db: Session = Depends(get_db)):
    """
    Get consolidated cash flow for all variable payrolls.
    """
    query = text("""
        WITH months AS (
            SELECT TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month
        ),
        project_monthly_cost AS (
            SELECT
                pv.proyecto,
                pv.start_month,
                pv.end_month,
                SUM(
                    pvc."RATA_X_H" * pvc."HORAS_REGULARES" +
                    COALESCE(pvc."RATA_X_H" * 1.25 * pvc."HORAS_EXT_1_25", 0) +
                    COALESCE(pvc."RATA_X_H" * 1.5 * pvc."HORAS_EXT_1_5", 0) +
                    COALESCE(pvc."RATA_X_H" * 2.0 * pvc."HORAS_EXT_2_0", 0)
                ) as monthly_monto
            FROM proyecto_variable_payroll pv
            JOIN planilla_variable_construccion pvc ON LOWER(pvc.proyecto) = LOWER(pv.proyecto)
            WHERE pv.is_active = true
            GROUP BY pv.proyecto, pv.start_month, pv.end_month
        )
        SELECT
            m.month,
            COALESCE(SUM(pmc.monthly_monto), 0) as monto
        FROM months m
        LEFT JOIN project_monthly_cost pmc ON
            m.month >= pmc.start_month AND
            m.month <= pmc.end_month
        GROUP BY m.month
        ORDER BY m.month
    """)
    result = db.execute(query).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result]

@router.put("/flujo/{planilla_type}/{month}")
def update_flujo_planilla(
    planilla_type: str,
    month: str,
    monto: float = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Update cash flow amount for a specific planilla type and month"""
    # Validate month format
    try:
        year, month_num = month.split('_')
        if not (len(year) == 4 and len(month_num) == 2):
            raise ValueError()
        int(year)
        int(month_num)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY_MM")

    # Only allow updating future months
    current = datetime.now()
    target = datetime(int(year), int(month_num), 1)
    if target <= current:
        raise HTTPException(status_code=400, detail="Can only update future months")

    # Update the appropriate table based on planilla_type
    try:
        if planilla_type == "planilla-administracion":
            db.execute(
                text("""
                    UPDATE planilla_administracion 
                    SET "Sal. Bruto" = :monto / COUNT(*) OVER ()
                    WHERE "Sal. Bruto" IS NOT NULL
                """),
                {"monto": monto}
            )
        elif planilla_type == "planilla-fija-construccion":
            db.execute(
                text("""
                    UPDATE planilla_fija_construccion 
                    SET HORAS_REGULARES = :monto / (RATA_X_H * COUNT(*) OVER ())
                    WHERE RATA_X_H > 0
                """),
                {"monto": monto}
            )
        elif planilla_type == "planilla-gerencial":
            db.execute(
                text("""
                    UPDATE planilla_gerencial 
                    SET SALARIO = :monto / COUNT(*) OVER ()
                    WHERE SALARIO IS NOT NULL
                """),
                {"monto": monto}
            )
        elif planilla_type == "planilla-servicio-profesionales":
            db.execute(
                text("""
                    UPDATE planilla_servicio_profesionales 
                    SET "SALARIO QUINCENAL" = :monto / (2 * COUNT(*) OVER ())
                    WHERE "SALARIO QUINCENAL" IS NOT NULL
                """),
                {"monto": monto}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid planilla type")
        
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/flujo/planilla-variable/{proyecto}/{month}")
def update_flujo_planilla_variable(
    proyecto: str,
    month: str,
    monto: float = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Update cash flow amount for planilla variable for a specific project and month"""
    # Validate month format
    try:
        year, month_num = month.split('_')
        if not (len(year) == 4 and len(month_num) == 2):
            raise ValueError()
        int(year)
        int(month_num)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY_MM")

    # Only allow updating future months
    current = datetime.now()
    target = datetime(int(year), int(month_num), 1)
    if target <= current:
        raise HTTPException(status_code=400, detail="Can only update future months")

    try:
        # Get the active assignment for this month
        assignment = db.execute(
            text("""
                SELECT id 
                FROM proyecto_variable_payroll 
                WHERE proyecto = :proyecto 
                AND start_month <= :month 
                AND end_month >= :month 
                AND is_active = true
            """),
            {"proyecto": proyecto, "month": month}
        ).fetchone()

        if not assignment:
            raise HTTPException(
                status_code=400,
                detail="No active assignment found for this project and month"
            )

        # Update the planilla
        db.execute(
            text("""
                UPDATE planilla_variable_construccion 
                SET HORAS_REGULARES = :monto / (RATA_X_H * COUNT(*) OVER ())
                WHERE proyecto = :proyecto AND RATA_X_H > 0
            """),
            {"monto": monto, "proyecto": proyecto}
        )
        
        db.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flujo/planilla-administrativa-consolidado")
def get_flujo_planilla_administrativa_consolidado(db: Session = Depends(get_db)):
    """
    Get consolidated cash flow for administrative payrolls:
    - Planilla Administración
    - Planilla Fija Construcción
    - Planilla Gerencial
    """
    query = text("""
        WITH months AS (
            SELECT TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) + (interval '1 month' * generate_series(-3, 35)), 'YYYY_MM') as month
        ),
        total_admin AS (
            SELECT SUM("Sal. Bruto") as monto FROM planilla_administracion
        ),
        total_fija AS (
            SELECT SUM("RATA_X_H" * "HORAS_REGULARES" +
                       COALESCE("RATA_X_H" * 1.25 * "HORAS_EXT_1_25", 0) +
                       COALESCE("RATA_X_H" * 1.5 * "HORAS_EXT_1_5", 0) +
                       COALESCE("RATA_X_H" * 2.0 * "HORAS_EXT_2_0", 0)) as monto
            FROM planilla_fija_construccion
        ),
        total_gerencial AS (
            SELECT SUM("SALARIO") as monto FROM planilla_gerencial
        )
        SELECT
            m.month,
            (COALESCE((SELECT monto FROM total_admin), 0) +
             COALESCE((SELECT monto FROM total_fija), 0) +
             COALESCE((SELECT monto FROM total_gerencial), 0)) as monto
        FROM months m
        ORDER BY m.month
    """)
    result = db.execute(query).fetchall()
    return [{"month": row[0], "monto": float(row[1])} for row in result] 