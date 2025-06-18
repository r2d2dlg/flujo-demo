#!/usr/bin/env python3
"""
Script de migración simplificada al sistema de Flujo de Caja Maestro
==================================================================

Este script migra los datos básicos de las tablas fragmentadas al flujo maestro.

Uso:
    python migrate_to_flujo_maestro_simple.py
"""

import os
import sys
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from decimal import Decimal
import json
import logging

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import SQLALCHEMY_DATABASE_URL
from app.models import FlujoCajaMaestro
from app.crud_flujo_caja_maestro import create_flujo_item
from app.schemas import FlujoCajaMaestroCreate

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_db_session():
    """Get database session"""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal(), engine

def generate_month_keys(start_months_back=3, total_months=63):
    """Generate month keys in format YYYY_MM"""
    now = datetime.now()
    month_keys = []
    
    for i in range(-start_months_back, total_months - start_months_back):
        month_date = now + relativedelta(months=i)
        month_key = f"{month_date.year}_{month_date.month:02d}"
        month_keys.append(month_key)
    
    return month_keys

def migrate_pagos_tierra(db, engine):
    """Migrar datos de pagos_tierra al flujo maestro"""
    logger.info("Migrando datos de pagos_tierra...")
    
    try:
        # Get all data from pagos_tierra
        result = db.execute(text("SELECT * FROM pagos_tierra")).fetchall()
        
        month_keys = generate_month_keys()
        
        for row in result:
            row_dict = dict(row._mapping)
            actividad = row_dict.get('actividad', 'Pagos a Terreno')
            
            # Create distribution from amount columns
            distribucion_mensual = {}
            
            for month_key in month_keys:
                amount_col = f"amount_{month_key}"
                if amount_col in row_dict and row_dict[amount_col] is not None:
                    if float(row_dict[amount_col]) != 0:
                        distribucion_mensual[month_key] = float(row_dict[amount_col])
            
            if distribucion_mensual:  # Only create if there's data
                flujo_data = FlujoCajaMaestroCreate(
                    categoria_principal="EGRESOS",
                    categoria_secundaria="Costos Directos",
                    subcategoria="Terreno",
                    concepto=actividad,
                    proyecto="General",
                    periodo_inicio=date.today(),
                    monto_base=Decimal(str(sum(distribucion_mensual.values()))),
                    distribucion_mensual=distribucion_mensual,
                    tipo_registro="REAL",
                    origen_dato=f"Migrado desde pagos_tierra - {actividad}"
                )
                
                create_flujo_item(db, flujo_data)
                logger.info(f"Migrado: {actividad} - Total: ${sum(distribucion_mensual.values()):,.2f}")
        
        logger.info("✅ Migración de pagos_tierra completada")
        
    except Exception as e:
        logger.error(f"❌ Error migrando pagos_tierra: {e}")
        db.rollback()
        raise

def migrate_estudios_permisos(db, engine):
    """Migrar datos de estudios_disenos_permisos al flujo maestro"""
    logger.info("Migrando datos de estudios_disenos_permisos...")
    
    try:
        # Get all data from estudios_disenos_permisos
        result = db.execute(text("SELECT * FROM estudios_disenos_permisos")).fetchall()
        
        month_keys = generate_month_keys()
        
        for row in result:
            row_dict = dict(row._mapping)
            actividad = row_dict.get('actividad', 'Estudios y Permisos')
            
            # Create distribution from amount columns
            distribucion_mensual = {}
            
            for month_key in month_keys:
                amount_col = f"amount_{month_key}"
                if amount_col in row_dict and row_dict[amount_col] is not None:
                    if float(row_dict[amount_col]) != 0:
                        distribucion_mensual[month_key] = float(row_dict[amount_col])
            
            if distribucion_mensual:  # Only create if there's data
                flujo_data = FlujoCajaMaestroCreate(
                    categoria_principal="EGRESOS",
                    categoria_secundaria="Costos Directos",
                    subcategoria="Estudios y Permisos",
                    concepto=actividad,
                    proyecto="General",
                    periodo_inicio=date.today(),
                    monto_base=Decimal(str(sum(distribucion_mensual.values()))),
                    distribucion_mensual=distribucion_mensual,
                    tipo_registro="REAL",
                    origen_dato=f"Migrado desde estudios_disenos_permisos - {actividad}"
                )
                
                create_flujo_item(db, flujo_data)
                logger.info(f"Migrado: {actividad} - Total: ${sum(distribucion_mensual.values()):,.2f}")
        
        logger.info("✅ Migración de estudios_disenos_permisos completada")
        
    except Exception as e:
        logger.error(f"❌ Error migrando estudios_disenos_permisos: {e}")
        db.rollback()
        raise

def migrate_infraestructura_pagos(db, engine):
    """Migrar datos de infraestructura_pagos al flujo maestro"""
    logger.info("Migrando datos de infraestructura_pagos...")
    
    try:
        # Get all data from infraestructura_pagos
        result = db.execute(text("SELECT * FROM infraestructura_pagos")).fetchall()
        
        # Group by proyecto and tipo
        pagos_by_key = {}
        
        for row in result:
            row_dict = dict(row._mapping)
            proyecto = row_dict.get('proyecto', 'General')
            tipo = row_dict.get('tipo', 'material')
            monto = float(row_dict.get('monto', 0))
            mes = int(row_dict.get('mes', 1))
            
            # Create key for grouping
            key = f"{proyecto}_{tipo}"
            
            if key not in pagos_by_key:
                pagos_by_key[key] = {
                    'proyecto': proyecto,
                    'tipo': tipo,
                    'distribucion': {},
                    'total': 0
                }
            
            # Map month to current year (assuming current year for migration)
            current_year = datetime.now().year
            month_key = f"{current_year}_{mes:02d}"
            
            if month_key in pagos_by_key[key]['distribucion']:
                pagos_by_key[key]['distribucion'][month_key] += monto
            else:
                pagos_by_key[key]['distribucion'][month_key] = monto
            pagos_by_key[key]['total'] += monto
        
        # Create flujo maestro entries
        for key, data in pagos_by_key.items():
            subcategoria = "Material" if data['tipo'] == 'material' else "Mano de Obra"
            concepto = f"Infraestructura - {subcategoria}"
            
            flujo_data = FlujoCajaMaestroCreate(
                categoria_principal="EGRESOS",
                categoria_secundaria="Costos Directos",
                subcategoria=subcategoria,
                concepto=concepto,
                proyecto=data['proyecto'],
                periodo_inicio=date.today(),
                monto_base=Decimal(str(data['total'])),
                distribucion_mensual=data['distribucion'],
                tipo_registro="REAL",
                origen_dato=f"Migrado desde infraestructura_pagos - {data['proyecto']} - {data['tipo']}"
            )
            
            create_flujo_item(db, flujo_data)
            logger.info(f"Migrado: {concepto} - {data['proyecto']} - Total: ${data['total']:,.2f}")
        
        logger.info("✅ Migración de infraestructura_pagos completada")
        
    except Exception as e:
        logger.error(f"❌ Error migrando infraestructura_pagos: {e}")
        db.rollback()
        raise

def migrate_vivienda_pagos(db, engine):
    """Migrar datos de vivienda_pagos al flujo maestro"""
    logger.info("Migrando datos de vivienda_pagos...")
    
    try:
        # Get all data from vivienda_pagos
        result = db.execute(text("SELECT * FROM vivienda_pagos")).fetchall()
        
        # Group by proyecto and tipo
        pagos_by_key = {}
        
        for row in result:
            row_dict = dict(row._mapping)
            proyecto = row_dict.get('proyecto', 'General')
            tipo = row_dict.get('tipo', 'material')
            monto = float(row_dict.get('monto', 0))
            mes = int(row_dict.get('mes', 1))
            
            # Create key for grouping
            key = f"{proyecto}_{tipo}"
            
            if key not in pagos_by_key:
                pagos_by_key[key] = {
                    'proyecto': proyecto,
                    'tipo': tipo,
                    'distribucion': {},
                    'total': 0
                }
            
            # Map month to current year (assuming current year for migration)
            current_year = datetime.now().year
            month_key = f"{current_year}_{mes:02d}"
            
            if month_key in pagos_by_key[key]['distribucion']:
                pagos_by_key[key]['distribucion'][month_key] += monto
            else:
                pagos_by_key[key]['distribucion'][month_key] = monto
            pagos_by_key[key]['total'] += monto
        
        # Create flujo maestro entries
        for key, data in pagos_by_key.items():
            subcategoria = "Material" if data['tipo'] == 'material' else "Mano de Obra"
            concepto = f"Viviendas - {subcategoria}"
            
            flujo_data = FlujoCajaMaestroCreate(
                categoria_principal="EGRESOS",
                categoria_secundaria="Costos Directos",
                subcategoria=subcategoria,
                concepto=concepto,
                proyecto=data['proyecto'],
                periodo_inicio=date.today(),
                monto_base=Decimal(str(data['total'])),
                distribucion_mensual=data['distribucion'],
                tipo_registro="REAL",
                origen_dato=f"Migrado desde vivienda_pagos - {data['proyecto']} - {data['tipo']}"
            )
            
            create_flujo_item(db, flujo_data)
            logger.info(f"Migrado: {concepto} - {data['proyecto']} - Total: ${data['total']:,.2f}")
        
        logger.info("✅ Migración de vivienda_pagos completada")
        
    except Exception as e:
        logger.error(f"❌ Error migrando vivienda_pagos: {e}")
        db.rollback()
        raise

def main():
    """Función principal de migración"""
    logger.info("🚀 Iniciando migración simplificada al Flujo de Caja Maestro")
    logger.info("=" * 60)
    
    try:
        db, engine = get_db_session()
        
        # Clear existing migrated data in flujo_caja_maestro
        logger.info("🧹 Limpiando datos migrados anteriores...")
        db.execute(text("""
            DELETE FROM flujo_caja_maestro 
            WHERE origen_dato LIKE 'Migrado desde%'
        """))
        db.commit()
        
        # Run migrations
        logger.info("📊 Ejecutando migraciones...")
        
        migrate_pagos_tierra(db, engine)
        migrate_estudios_permisos(db, engine)
        migrate_infraestructura_pagos(db, engine)
        migrate_vivienda_pagos(db, engine)
        
        # Summary
        logger.info("📈 Generando resumen de migración...")
        result = db.execute(text("""
            SELECT 
                categoria_principal,
                categoria_secundaria,
                COUNT(*) as num_conceptos,
                SUM(monto_base) as total_monto
            FROM flujo_caja_maestro 
            WHERE origen_dato LIKE 'Migrado desde%'
            GROUP BY categoria_principal, categoria_secundaria
            ORDER BY categoria_principal, categoria_secundaria
        """)).fetchall()
        
        logger.info("=" * 60)
        logger.info("📊 RESUMEN DE MIGRACIÓN")
        logger.info("=" * 60)
        
        total_general = 0
        for row in result:
            logger.info(f"{row[0]} > {row[1]}: {row[2]} conceptos - ${row[3]:,.2f}")
            total_general += float(row[3])
        
        logger.info("=" * 60)
        logger.info(f"💰 TOTAL MIGRADO: ${total_general:,.2f}")
        logger.info("=" * 60)
        
        logger.info("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        logger.info("📱 Ahora puedes actualizar el frontend para usar el flujo maestro")
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error en la migración: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        raise

if __name__ == "__main__":
    main() 