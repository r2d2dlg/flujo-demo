from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, date, timedelta
from typing import List, Optional
from . import models, schemas

def get_nombres_consultores(db: Session) -> List[models.NombresConsultores]:
    return db.query(models.NombresConsultores).order_by(models.NombresConsultores.nombre).all()

def create_nombre_consultor(db: Session, consultor: schemas.NombresConsultoresCreate) -> models.NombresConsultores:
    db_consultor = models.NombresConsultores(**consultor.model_dump())
    db.add(db_consultor)
    db.commit()
    db.refresh(db_consultor)
    return db_consultor

def delete_nombre_consultor(db: Session, nombre: str) -> bool:
    consultor = db.query(models.NombresConsultores).filter(models.NombresConsultores.nombre == nombre).first()
    if consultor:
        db.delete(consultor)
        db.commit()
        return True
    return False

def get_costo_consultores(db: Session, start_date: date, end_date: date) -> List[models.CostoConsultores]:
    return db.query(models.CostoConsultores)\
        .filter(models.CostoConsultores.fecha.between(start_date, end_date))\
        .order_by(models.CostoConsultores.consultor, models.CostoConsultores.fecha)\
        .all()

def create_costo_consultor(db: Session, costo: schemas.CostoConsultoresCreate) -> models.CostoConsultores:
    db_costo = models.CostoConsultores(**costo.model_dump())
    db.add(db_costo)
    db.commit()
    db.refresh(db_costo)
    return db_costo

def update_costo_consultor(
    db: Session, 
    consultor: str, 
    fecha: date, 
    costo_update: schemas.CostoConsultoresUpdate
) -> Optional[models.CostoConsultores]:
    db_costo = db.query(models.CostoConsultores)\
        .filter(
            models.CostoConsultores.consultor == consultor,
            models.CostoConsultores.fecha == fecha
        ).first()
    
    if db_costo:
        for key, value in costo_update.model_dump(exclude_unset=True).items():
            setattr(db_costo, key, value)
        db.commit()
        db.refresh(db_costo)
    return db_costo

def delete_costo_consultor(db: Session, consultor: str, fecha: date) -> bool:
    costo = db.query(models.CostoConsultores)\
        .filter(
            models.CostoConsultores.consultor == consultor,
            models.CostoConsultores.fecha == fecha
        ).first()
    if costo:
        db.delete(costo)
        db.commit()
        return True
    return False

def get_v_costo_consultores(db: Session, start_date: date, end_date: date) -> List[schemas.VCostoConsultores]:
    query = text("""
        WITH monthly_costs AS (
            SELECT 
                c.consultor,
                DATE_TRUNC('month', c.fecha) as mes,
                SUM(c.costo) as costo_mensual
            FROM costo_consultores c
            WHERE c.fecha BETWEEN :start_date AND :end_date
            GROUP BY c.consultor, DATE_TRUNC('month', c.fecha)
        ),
        all_months AS (
            SELECT DISTINCT mes 
            FROM monthly_costs
        ),
        all_consultores AS (
            SELECT nombre as consultor 
            FROM nombres_consultores
        ),
        base_matrix AS (
            SELECT 
                ac.consultor,
                am.mes,
                COALESCE(mc.costo_mensual, 0) as costo
            FROM all_consultores ac
            CROSS JOIN all_months am
            LEFT JOIN monthly_costs mc ON mc.consultor = ac.consultor AND mc.mes = am.mes
        ),
        combined_data AS (
            SELECT 
                consultor as "Consultor",
                mes as "Mes",
                costo as "Costo"
            FROM base_matrix
            UNION ALL
            SELECT 
                'Total' as "Consultor",
                mes as "Mes",
                SUM(costo) as "Costo"
            FROM base_matrix
            GROUP BY mes
        )
        SELECT "Consultor", "Mes", "Costo"
        FROM combined_data
        ORDER BY CASE WHEN "Consultor" = 'Total' THEN 2 ELSE 1 END, "Consultor", "Mes"
    """)
    
    result = db.execute(query, {"start_date": start_date, "end_date": end_date})
    return [schemas.VCostoConsultores(Consultor=row.Consultor, Mes=row.Mes, Costo=row.Costo) for row in result] 