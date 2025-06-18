from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

def create_costo_directo(db: Session, item: schemas.CostoDirectoCreate):
    db_item = models.CostoDirectoTable(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_all_costo_directo(db: Session, proyecto: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.CostoDirectoTable)
    if proyecto:
        query = query.filter(models.CostoDirectoTable.proyecto == proyecto)
    return query.offset(skip).limit(limit).all()

def get_costo_directo(db: Session, item_id: int):
    return db.query(models.CostoDirectoTable).filter(models.CostoDirectoTable.id == item_id).first()

def update_costo_directo(db: Session, item_id: int, item: schemas.CostoDirectoUpdate):
    db_item = db.query(models.CostoDirectoTable).filter(models.CostoDirectoTable.id == item_id).first()
    if db_item:
        update_data = item.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_costo_directo(db: Session, item_id: int):
    db_item = db.query(models.CostoDirectoTable).filter(models.CostoDirectoTable.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

def get_costo_directo_view(db: Session, proyecto: str = None):
    query = db.query(models.CostoDirectoTable)
    if proyecto:
        query = query.filter(models.CostoDirectoTable.proyecto == proyecto)
    rows = query.all()
    total_infraestructura = sum(row.infraestructura for row in rows)
    total_materiales = sum(row.materiales for row in rows)
    total_mo = sum(row.mo for row in rows)
    total_equipos = sum(row.equipos for row in rows)
    result = {
        "rows": [
            {
                "actividad": row.actividad,
                "infraestructura": row.infraestructura,
                "materiales": row.materiales,
                "mo": row.mo,
                "equipos": row.equipos,
                "total": row.infraestructura + row.materiales + row.mo + row.equipos
            } for row in rows
        ],
        "totals": {
            "infraestructura": total_infraestructura,
            "materiales": total_materiales,
            "mo": total_mo,
            "equipos": total_equipos,
            "total": total_infraestructura + total_materiales + total_mo + total_equipos
        }
    }
    return result

def get_costos_directos_totales(db: Session, proyecto: str = None):
    query = db.query(models.CostoDirectoTable)
    if proyecto:
        query = query.filter(models.CostoDirectoTable.proyecto == proyecto)
    costo_materiales_infra = query.with_entities(func.sum(models.CostoDirectoTable.materiales)).scalar() or 0
    # 2. costo total materiales viviendas
    costo_materiales_viviendas_query = db.query(
        func.sum(models.CostoXVivienda.materiales * models.CostoXVivienda.viviendas)
    )
    if proyecto:
        costo_materiales_viviendas_query = costo_materiales_viviendas_query.filter(models.CostoXVivienda.proyecto == proyecto)
    costo_materiales_viviendas = costo_materiales_viviendas_query.scalar() or 0
    # 3. mano de obra infraestructura
    mano_obra_infra = query.with_entities(func.sum(models.CostoDirectoTable.mo)).scalar() or 0
    # 4. mano de obra vivienda
    mano_obra_vivienda_query = db.query(
        func.sum((models.CostoXVivienda.mo + models.CostoXVivienda.otros) * models.CostoXVivienda.viviendas)
    )
    if proyecto:
        mano_obra_vivienda_query = mano_obra_vivienda_query.filter(models.CostoXVivienda.proyecto == proyecto)
    mano_obra_vivienda = mano_obra_vivienda_query.scalar() or 0
    total_general = costo_materiales_infra + costo_materiales_viviendas + mano_obra_infra + mano_obra_vivienda
    return schemas.CostosDirectosTotales(
        costo_total_materiales_infraestructura=float(costo_materiales_infra),
        costo_total_materiales_viviendas=float(costo_materiales_viviendas),
        mano_de_obra_infraestructura=float(mano_obra_infra),
        mano_de_obra_vivienda=float(mano_obra_vivienda),
        total=float(total_general),
    )

def get_all_costo_x_vivienda(db: Session, proyecto: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.CostoXVivienda)
    if proyecto:
        query = query.filter(models.CostoXVivienda.proyecto == proyecto)
    return query.offset(skip).limit(limit).all()

def create_infraestructura_pago(db: Session, pago: schemas.InfraestructuraPagoCreate):
    db_pago = models.InfraestructuraPago(**pago.dict())
    db.add(db_pago)
    db.commit()
    db.refresh(db_pago)
    return db_pago

def get_infraestructura_pagos(db: Session, proyecto: str = None):
    query = db.query(models.InfraestructuraPago)
    if proyecto:
        query = query.filter(models.InfraestructuraPago.proyecto == proyecto)
    return query.all()

def create_vivienda_pago(db: Session, pago: schemas.ViviendaPagoCreate):
    db_pago = models.ViviendaPago(**pago.dict())
    db.add(db_pago)
    db.commit()
    db.refresh(db_pago)
    return db_pago

def get_vivienda_pagos(db: Session, proyecto: str = None):
    query = db.query(models.ViviendaPago)
    if proyecto:
        query = query.filter(models.ViviendaPago.proyecto == proyecto)
    return query.all()

def create_proyecto_variable_payroll(db: Session, data: schemas.ProyectoVariablePayrollCreate):
    obj = models.ProyectoVariablePayroll(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_proyecto_variable_payrolls(db: Session, proyecto: str = None):
    query = db.query(models.ProyectoVariablePayroll)
    if proyecto:
        query = query.filter(models.ProyectoVariablePayroll.proyecto == proyecto)
    return query.all()

def update_proyecto_variable_payroll(db: Session, id: int, data: schemas.ProyectoVariablePayrollUpdate):
    obj = db.query(models.ProyectoVariablePayroll).filter(models.ProyectoVariablePayroll.id == id).first()
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_proyecto_variable_payroll(db: Session, id: int):
    obj = db.query(models.ProyectoVariablePayroll).filter(models.ProyectoVariablePayroll.id == id).first()
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj 