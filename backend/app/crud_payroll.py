from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Optional
from decimal import Decimal

from . import models, schemas

# CRUD for PlanillaAdministracion
def get_planilla_administracion(db: Session, nombre: str) -> Optional[models.PlanillaAdministracion]:
    return db.query(models.PlanillaAdministracion).filter(models.PlanillaAdministracion.nombre == nombre).first()

def get_planillas_administracion(db: Session, skip: int = 0, limit: int = 100) -> List[models.PlanillaAdministracion]:
    return db.query(models.PlanillaAdministracion).offset(skip).limit(limit).all()

def create_planilla_administracion(db: Session, planilla: schemas.PlanillaAdministracionCreate) -> models.PlanillaAdministracion:
    db_planilla = models.PlanillaAdministracion(**planilla.model_dump())
    db.add(db_planilla)
    db.commit()
    db.refresh(db_planilla)
    return db_planilla

def update_planilla_administracion(db: Session, nombre: str, planilla_update: schemas.PlanillaAdministracionUpdate) -> Optional[models.PlanillaAdministracion]:
    db_planilla = get_planilla_administracion(db, nombre=nombre)
    if db_planilla:
        update_data = planilla_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_planilla, key, value)
        db.commit()
        db.refresh(db_planilla)
    return db_planilla

def delete_planilla_administracion(db: Session, nombre: str) -> Optional[models.PlanillaAdministracion]:
    db_planilla = get_planilla_administracion(db, nombre=nombre)
    if db_planilla:
        db.delete(db_planilla)
        db.commit()
    return db_planilla

# CRUD for PlanillaFijaConstruccion
def get_planilla_fija_construccion(db: Session, nombre: str) -> Optional[models.PlanillaFijaConstruccion]:
    return db.query(models.PlanillaFijaConstruccion).filter(models.PlanillaFijaConstruccion.nombre == nombre).first()

def get_planillas_fija_construccion(db: Session, skip: int = 0, limit: int = 100) -> List[models.PlanillaFijaConstruccion]:
    return db.query(models.PlanillaFijaConstruccion).offset(skip).limit(limit).all()

def create_planilla_fija_construccion(db: Session, planilla: schemas.PlanillaFijaConstruccionCreate) -> models.PlanillaFijaConstruccion:
    db_planilla = models.PlanillaFijaConstruccion(**planilla.model_dump())
    db.add(db_planilla)
    db.commit()
    db.refresh(db_planilla)
    return db_planilla

def update_planilla_fija_construccion(db: Session, nombre: str, planilla_update: schemas.PlanillaFijaConstruccionUpdate) -> Optional[models.PlanillaFijaConstruccion]:
    db_planilla = get_planilla_fija_construccion(db, nombre=nombre)
    if db_planilla:
        update_data = planilla_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_planilla, key, value)
        db.commit()
        db.refresh(db_planilla)
    return db_planilla

def delete_planilla_fija_construccion(db: Session, nombre: str) -> Optional[models.PlanillaFijaConstruccion]:
    db_planilla = get_planilla_fija_construccion(db, nombre=nombre)
    if db_planilla:
        db.delete(db_planilla)
        db.commit()
    return db_planilla

# CRUD for PlanillaGerencial
def get_planilla_gerencial(db: Session, nombre: str) -> Optional[models.PlanillaGerencial]:
    return db.query(models.PlanillaGerencial).filter(models.PlanillaGerencial.nombre == nombre).first()

def get_planillas_gerencial(db: Session, skip: int = 0, limit: int = 100) -> List[models.PlanillaGerencial]:
    return db.query(models.PlanillaGerencial).offset(skip).limit(limit).all()

def create_planilla_gerencial(db: Session, planilla: schemas.PlanillaGerencialCreate) -> models.PlanillaGerencial:
    db_planilla = models.PlanillaGerencial(**planilla.model_dump())
    db.add(db_planilla)
    db.commit()
    db.refresh(db_planilla)
    return db_planilla

def update_planilla_gerencial(db: Session, nombre: str, planilla_update: schemas.PlanillaGerencialUpdate) -> Optional[models.PlanillaGerencial]:
    db_planilla = get_planilla_gerencial(db, nombre=nombre)
    if db_planilla:
        update_data = planilla_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_planilla, key, value)
        db.commit()
        db.refresh(db_planilla)
    return db_planilla

def delete_planilla_gerencial(db: Session, nombre: str) -> Optional[models.PlanillaGerencial]:
    db_planilla = get_planilla_gerencial(db, nombre=nombre)
    if db_planilla:
        db.delete(db_planilla)
        db.commit()
    return db_planilla

# CRUD for PlanillaServicioProfesionales
def get_planilla_servicio_profesionales(db: Session, nombre: str) -> Optional[models.PlanillaServicioProfesionales]:
    return db.query(models.PlanillaServicioProfesionales).filter(models.PlanillaServicioProfesionales.nombre == nombre).first()

def get_planillas_servicio_profesionales(db: Session, skip: int = 0, limit: int = 100) -> List[models.PlanillaServicioProfesionales]:
    return db.query(models.PlanillaServicioProfesionales).offset(skip).limit(limit).all()

def create_planilla_servicio_profesionales(db: Session, planilla: schemas.PlanillaServicioProfesionalesCreate) -> models.PlanillaServicioProfesionales:
    db_planilla = models.PlanillaServicioProfesionales(**planilla.model_dump())
    db.add(db_planilla)
    db.commit()
    db.refresh(db_planilla)
    return db_planilla

def update_planilla_servicio_profesionales(db: Session, nombre: str, planilla_update: schemas.PlanillaServicioProfesionalesUpdate) -> Optional[models.PlanillaServicioProfesionales]:
    db_planilla = get_planilla_servicio_profesionales(db, nombre=nombre)
    if db_planilla:
        update_data = planilla_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_planilla, key, value)
        db.commit()
        db.refresh(db_planilla)
    return db_planilla

def delete_planilla_servicio_profesionales(db: Session, nombre: str) -> Optional[models.PlanillaServicioProfesionales]:
    db_planilla = get_planilla_servicio_profesionales(db, nombre=nombre)
    if db_planilla:
        db.delete(db_planilla)
        db.commit()
    return db_planilla

# CRUD for PlanillaVariableConstruccion
def get_planilla_variable_construccion(db: Session, nombre: str) -> Optional[models.PlanillaVariableConstruccion]:
    return db.query(models.PlanillaVariableConstruccion).filter(models.PlanillaVariableConstruccion.nombre == nombre).first()

def get_planillas_variable_construccion(db: Session, skip: int = 0, limit: int = 100, proyecto: str = None) -> List[models.PlanillaVariableConstruccion]:
    query = db.query(models.PlanillaVariableConstruccion)
    if proyecto:
        query = query.filter(func.lower(models.PlanillaVariableConstruccion.proyecto) == proyecto.lower())
    return query.offset(skip).limit(limit).all()

def create_planilla_variable_construccion(db: Session, planilla: schemas.PlanillaVariableConstruccionCreate) -> models.PlanillaVariableConstruccion:
    db_planilla = models.PlanillaVariableConstruccion(**planilla.model_dump())
    db.add(db_planilla)
    db.commit()
    db.refresh(db_planilla)
    return db_planilla

def update_planilla_variable_construccion(db: Session, nombre: str, planilla_update: schemas.PlanillaVariableConstruccionUpdate) -> Optional[models.PlanillaVariableConstruccion]:
    db_planilla = get_planilla_variable_construccion(db, nombre=nombre)
    if db_planilla:
        update_data = planilla_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_planilla, key, value)
        db.commit()
        db.refresh(db_planilla)
    return db_planilla

def delete_planilla_variable_construccion(db: Session, nombre: str) -> Optional[models.PlanillaVariableConstruccion]:
    db_planilla = get_planilla_variable_construccion(db, nombre=nombre)
    if db_planilla:
        db.delete(db_planilla)
        db.commit()
    return db_planilla

# --- CRUD for ProyectoVariablePayroll ---

def get_proyecto_variable_payroll_assignments(db: Session, proyecto: str) -> List[models.ProyectoVariablePayroll]:
    return db.query(models.ProyectoVariablePayroll).filter(func.lower(models.ProyectoVariablePayroll.proyecto) == proyecto.lower()).all()

def create_proyecto_variable_payroll_assignment(db: Session, assignment: schemas.ProyectoVariablePayrollCreate) -> models.ProyectoVariablePayroll:
    db_assignment = models.ProyectoVariablePayroll(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def update_proyecto_variable_payroll_assignment(db: Session, assignment_id: int, assignment_update: schemas.ProyectoVariablePayrollUpdate) -> Optional[models.ProyectoVariablePayroll]:
    db_assignment = db.query(models.ProyectoVariablePayroll).filter(models.ProyectoVariablePayroll.id == assignment_id).first()
    if db_assignment:
        update_data = assignment_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_assignment, key, value)
        db.commit()
        db.refresh(db_assignment)
    return db_assignment

def delete_proyecto_variable_payroll_assignment(db: Session, assignment_id: int) -> Optional[models.ProyectoVariablePayroll]:
    db_assignment = db.query(models.ProyectoVariablePayroll).filter(models.ProyectoVariablePayroll.id == assignment_id).first()
    if db_assignment:
        db.delete(db_assignment)
        db.commit()
    return db_assignment

# --- CRUD for Views (Read-only) ---

def get_v_planilla_administracion_data(db: Session) -> List[schemas.VPlanillaAdministracion]:
    query = text("SELECT * FROM public.v_planilla_administracion")
    result = db.execute(query).mappings().all()
    return [schemas.VPlanillaAdministracion.model_validate(row) for row in result]

def get_v_planilla_fija_construccion_data(db: Session) -> List[schemas.VPlanillaFijaConstruccion]:
    query = text("SELECT * FROM public.v_planilla_fija_construccion")
    result = db.execute(query).mappings().all()
    return [schemas.VPlanillaFijaConstruccion.model_validate(row) for row in result]

def get_v_planilla_gerencial_data(db: Session) -> List[schemas.VPlanillaGerencial]:
    query = text("SELECT * FROM public.v_planilla_gerencial")
    result = db.execute(query).mappings().all()
    return [schemas.VPlanillaGerencial.model_validate(row) for row in result]

def get_v_planilla_servicio_profesionales_data(db: Session) -> List[schemas.VPlanillaServicioProfesionales]:
    query = text("SELECT * FROM public.v_planilla_servicio_profesionales")
    result = db.execute(query).mappings().all()
    return [schemas.VPlanillaServicioProfesionales.model_validate(row) for row in result]

def get_v_planilla_variable_construccion_data(db: Session) -> List[schemas.VPlanillaVariableConstruccion]:
    query = text("SELECT * FROM public.v_planilla_variable_construccion")
    result = db.execute(query).mappings().all()
    return [schemas.VPlanillaVariableConstruccion.model_validate(row) for row in result] 