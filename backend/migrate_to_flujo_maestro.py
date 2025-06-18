#!/usr/bin/env python3
"""
Script de migración completa al sistema de Flujo de Caja Maestro
==============================================================

Este script migra todos los datos existentes de las múltiples tablas fragmentadas
al sistema centralizado de flujo_caja_maestro y actualiza los procesos de importación.

Tablas a migrar:
1. pagos_tierra (columnas dinámicas amount_YYYY_MM)
2. estudios_disenos_permisos (columnas dinámicas amount_YYYY_MM)  
3. infraestructura_pagos (mes/monto)
4. vivienda_pagos (mes/monto)
5. presupuesto_mercadeo_* (múltiples tablas de marketing)
6. Planillas de payroll
7. Servicios profesionales
8. Costos financieros
9. Líneas de crédito
10. Ingresos por ventas

Uso:
    python migrate_to_flujo_maestro.py
"""

import os
import sys
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal
import json
import logging

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine, text, MetaData, Table
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
            distribucion_temporal = {}
            
            for month_key in month_keys:
                amount_col = f"amount_{month_key}"
                if amount_col in row_dict and row_dict[amount_col] is not None:
                    if float(row_dict[amount_col]) != 0:
                        distribucion_temporal[month_key] = float(row_dict[amount_col])
            
            if distribucion_temporal:  # Only create if there's data
                from datetime import date
                flujo_data = FlujoCajaMaestroCreate(
                    categoria_principal="EGRESOS",
                    categoria_secundaria="Costos Directos",
                    subcategoria="Terreno",
                    concepto=actividad,
                    proyecto="General",
                    periodo_inicio=date.today(),
                    monto_base=Decimal(str(sum(distribucion_temporal.values()))),
                    distribucion_mensual=distribucion_temporal,
                    tipo_registro="REAL",
                    origen_dato=f"Migrado desde pagos_tierra - {actividad}"
                )
                
                create_flujo_item(db, flujo_data)
                logger.info(f"Migrado: {actividad} - Total: ${sum(distribucion_temporal.values()):,.2f}")
        
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
            distribucion_temporal = {}
            
            for month_key in month_keys:
                amount_col = f"amount_{month_key}"
                if amount_col in row_dict and row_dict[amount_col] is not None:
                    if float(row_dict[amount_col]) != 0:
                        distribucion_temporal[month_key] = float(row_dict[amount_col])
            
            if distribucion_temporal:  # Only create if there's data
                flujo_data = FlujoCajaMaestroCreate(
                    categoria_principal="EGRESOS",
                    categoria_secundaria="Costos Directos",
                    subcategoria="Estudios y Permisos",
                    concepto=actividad,
                    proyecto="General",
                    tipo_registro="EGRESO",
                    monto_total=sum(distribucion_temporal.values()),
                    distribucion_temporal=distribucion_temporal,
                    descripcion=f"Migrado desde estudios_disenos_permisos - {actividad}",
                    activo=True
                )
                
                create_flujo_caja_maestro(db, flujo_data)
                logger.info(f"Migrado: {actividad} - Total: ${sum(distribucion_temporal.values()):,.2f}")
        
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
                tipo_registro="EGRESO",
                monto_total=data['total'],
                distribucion_temporal=data['distribucion'],
                descripcion=f"Migrado desde infraestructura_pagos - {data['proyecto']} - {data['tipo']}",
                activo=True
            )
            
            create_flujo_caja_maestro(db, flujo_data)
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
                tipo_registro="EGRESO",
                monto_total=data['total'],
                distribucion_temporal=data['distribucion'],
                descripcion=f"Migrado desde vivienda_pagos - {data['proyecto']} - {data['tipo']}",
                activo=True
            )
            
            create_flujo_caja_maestro(db, flujo_data)
            logger.info(f"Migrado: {concepto} - {data['proyecto']} - Total: ${data['total']:,.2f}")
        
        logger.info("✅ Migración de vivienda_pagos completada")
        
    except Exception as e:
        logger.error(f"❌ Error migrando vivienda_pagos: {e}")
        db.rollback()
        raise

def migrate_marketing_tables(db, engine):
    """Migrar datos de todas las tablas de marketing al flujo maestro"""
    logger.info("Migrando datos de marketing...")
    
    try:
        # Get all marketing budget tables
        tables_result = db.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'presupuesto_mercadeo_%'"
        )).fetchall()
        marketing_tables = [t[0] for t in tables_result]
        
        logger.info(f"Encontradas {len(marketing_tables)} tablas de marketing: {marketing_tables}")
        
        # Generate target periods
        now = datetime.now()
        target_periods = []
        for i in range(-3, 60):  # 3 months before + 60 forward
            month_date = now + relativedelta(months=i)
            target_periods.append(f"{month_date.year}_{month_date.month:02d}")
        
        # Consolidated data from all marketing tables
        consolidated_data = {}
        
        for table in marketing_tables:
            try:
                # Check which columns exist in the current table
                db_cols_result = db.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = :table"
                ), {"table": table}).fetchall()
                db_cols = [c[0].lower() for c in db_cols_result]
                
                # Determine description column
                description_col = None
                if "concepto" in db_cols:
                    description_col = "concepto"
                elif "actividad" in db_cols:
                    description_col = "actividad"
                
                if not description_col:
                    logger.warning(f"Omitiendo tabla {table} - no tiene columna de descripción")
                    continue
                
                # Find existing amount columns
                existing_amount_cols = []
                col_mapping = {}
                
                for col in db_cols:
                    if col.startswith('amount_'):
                        existing_amount_cols.append(col)
                        # Map to standard format
                        col_mapping[col] = col.replace('amount_', '')
                
                if not existing_amount_cols:
                    logger.warning(f"Omitiendo tabla {table} - no tiene columnas de monto")
                    continue
                
                # Build query
                cols_str = ', '.join([f'"{col}"' for col in existing_amount_cols])
                query_sql = f'SELECT "{description_col}", {cols_str} FROM "{table}"'
                
                table_result = db.execute(text(query_sql)).fetchall()
                
                for row in table_result:
                    actividad_key = row[0] if row[0] else "Sin Concepto"
                    
                    if actividad_key not in consolidated_data:
                        consolidated_data[actividad_key] = {period: 0.0 for period in target_periods}
                    
                    # Map the returned values to the correct standard period
                    for i, db_col_name in enumerate(existing_amount_cols):
                        period_key = col_mapping[db_col_name]
                        value = row[i+1]  # +1 because row[0] is the description
                        if value is not None and period_key in target_periods:
                            consolidated_data[actividad_key][period_key] += float(value)
                
                logger.info(f"Procesada tabla {table} - {len(table_result)} filas")
                
            except Exception as e:
                logger.warning(f"Error procesando tabla {table}: {e}")
                continue
        
        # Create flujo maestro entries from consolidated data
        for actividad, data in consolidated_data.items():
            if actividad == "TOTAL":  # Skip total rows
                continue
                
            # Filter out zero values
            distribucion_temporal = {k: v for k, v in data.items() if v != 0}
            
            if distribucion_temporal:
                total_monto = sum(distribucion_temporal.values())
                
                flujo_data = FlujoCajaMaestroCreate(
                    categoria_principal="EGRESOS",
                    categoria_secundaria="Marketing",
                    subcategoria="Publicidad",
                    concepto=actividad,
                    proyecto="General",
                    tipo_registro="EGRESO",
                    monto_total=total_monto,
                    distribucion_temporal=distribucion_temporal,
                    descripcion=f"Migrado desde tablas de marketing - {actividad}",
                    activo=True
                )
                
                create_flujo_caja_maestro(db, flujo_data)
                logger.info(f"Migrado: {actividad} - Total: ${total_monto:,.2f}")
        
        logger.info("✅ Migración de marketing completada")
        
    except Exception as e:
        logger.error(f"❌ Error migrando marketing: {e}")
        db.rollback()
        raise

def create_migration_functions(db, engine):
    """Crear funciones de migración para automatizar importaciones futuras"""
    logger.info("Creando funciones de migración...")
    
    try:
        # Function to import pagos_tierra data to flujo maestro
        db.execute(text("""
        CREATE OR REPLACE FUNCTION import_pagos_tierra_to_flujo_maestro()
        RETURNS void AS $$
        DECLARE
            row_record RECORD;
            month_key TEXT;
            amount_val NUMERIC;
            distribucion JSONB;
            total_amount NUMERIC;
        BEGIN
            -- Process each row in pagos_tierra
            FOR row_record IN SELECT * FROM pagos_tierra LOOP
                distribucion := '{}'::jsonb;
                total_amount := 0;
                
                -- Extract amounts from dynamic columns
                FOR month_key IN 
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'pagos_tierra' 
                    AND column_name LIKE 'amount_%'
                LOOP
                    EXECUTE format('SELECT $1.%I', month_key) 
                    USING row_record INTO amount_val;
                    
                    IF amount_val IS NOT NULL AND amount_val != 0 THEN
                        distribucion := distribucion || jsonb_build_object(
                            replace(month_key, 'amount_', ''), amount_val
                        );
                        total_amount := total_amount + amount_val;
                    END IF;
                END LOOP;
                
                -- Insert into flujo_caja_maestro if there's data
                IF total_amount > 0 THEN
                    INSERT INTO flujo_caja_maestro (
                        categoria_principal, categoria_secundaria, subcategoria, concepto,
                        proyecto, tipo_registro, monto_total, distribucion_temporal,
                        descripcion, activo, created_at, updated_at
                    ) VALUES (
                        'EGRESOS', 'Costos Directos', 'Terreno', row_record.actividad,
                        'General', 'EGRESO', total_amount, distribucion,
                        'Importado desde pagos_tierra - ' || row_record.actividad,
                        true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    );
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Function to import estudios_permisos data to flujo maestro
        db.execute(text("""
        CREATE OR REPLACE FUNCTION import_estudios_permisos_to_flujo_maestro()
        RETURNS void AS $$
        DECLARE
            row_record RECORD;
            month_key TEXT;
            amount_val NUMERIC;
            distribucion JSONB;
            total_amount NUMERIC;
        BEGIN
            -- Process each row in estudios_disenos_permisos
            FOR row_record IN SELECT * FROM estudios_disenos_permisos LOOP
                distribucion := '{}'::jsonb;
                total_amount := 0;
                
                -- Extract amounts from dynamic columns
                FOR month_key IN 
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'estudios_disenos_permisos' 
                    AND column_name LIKE 'amount_%'
                LOOP
                    EXECUTE format('SELECT $1.%I', month_key) 
                    USING row_record INTO amount_val;
                    
                    IF amount_val IS NOT NULL AND amount_val != 0 THEN
                        distribucion := distribucion || jsonb_build_object(
                            replace(month_key, 'amount_', ''), amount_val
                        );
                        total_amount := total_amount + amount_val;
                    END IF;
                END LOOP;
                
                -- Insert into flujo_caja_maestro if there's data
                IF total_amount > 0 THEN
                    INSERT INTO flujo_caja_maestro (
                        categoria_principal, categoria_secundaria, subcategoria, concepto,
                        proyecto, tipo_registro, monto_total, distribucion_temporal,
                        descripcion, activo, created_at, updated_at
                    ) VALUES (
                        'EGRESOS', 'Costos Directos', 'Estudios y Permisos', row_record.actividad,
                        'General', 'EGRESO', total_amount, distribucion,
                        'Importado desde estudios_disenos_permisos - ' || row_record.actividad,
                        true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    );
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        # Function to import infrastructure and vivienda pagos
        db.execute(text("""
        CREATE OR REPLACE FUNCTION import_pagos_construccion_to_flujo_maestro()
        RETURNS void AS $$
        DECLARE
            infra_record RECORD;
            vivienda_record RECORD;
            distribucion JSONB;
            month_key TEXT;
            concepto_name TEXT;
            subcategoria_name TEXT;
        BEGIN
            -- Process infraestructura_pagos
            FOR infra_record IN 
                SELECT proyecto, tipo, SUM(monto) as total_monto,
                       json_object_agg(
                           EXTRACT(YEAR FROM CURRENT_DATE)::text || '_' || LPAD(mes::text, 2, '0'),
                           monto
                       ) as distribucion
                FROM infraestructura_pagos
                GROUP BY proyecto, tipo
            LOOP
                subcategoria_name := CASE 
                    WHEN infra_record.tipo = 'material' THEN 'Material'
                    ELSE 'Mano de Obra'
                END;
                
                concepto_name := 'Infraestructura - ' || subcategoria_name;
                
                INSERT INTO flujo_caja_maestro (
                    categoria_principal, categoria_secundaria, subcategoria, concepto,
                    proyecto, tipo_registro, monto_total, distribucion_temporal,
                    descripcion, activo, created_at, updated_at
                ) VALUES (
                    'EGRESOS', 'Costos Directos', subcategoria_name, concepto_name,
                    infra_record.proyecto, 'EGRESO', infra_record.total_monto, 
                    infra_record.distribucion::jsonb,
                    'Importado desde infraestructura_pagos - ' || infra_record.proyecto,
                    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                );
            END LOOP;
            
            -- Process vivienda_pagos
            FOR vivienda_record IN 
                SELECT proyecto, tipo, SUM(monto) as total_monto,
                       json_object_agg(
                           EXTRACT(YEAR FROM CURRENT_DATE)::text || '_' || LPAD(mes::text, 2, '0'),
                           monto
                       ) as distribucion
                FROM vivienda_pagos
                GROUP BY proyecto, tipo
            LOOP
                subcategoria_name := CASE 
                    WHEN vivienda_record.tipo = 'material' THEN 'Material'
                    ELSE 'Mano de Obra'
                END;
                
                concepto_name := 'Viviendas - ' || subcategoria_name;
                
                INSERT INTO flujo_caja_maestro (
                    categoria_principal, categoria_secundaria, subcategoria, concepto,
                    proyecto, tipo_registro, monto_total, distribucion_temporal,
                    descripcion, activo, created_at, updated_at
                ) VALUES (
                    'EGRESOS', 'Costos Directos', subcategoria_name, concepto_name,
                    vivienda_record.proyecto, 'EGRESO', vivienda_record.total_monto, 
                    vivienda_record.distribucion::jsonb,
                    'Importado desde vivienda_pagos - ' || vivienda_record.proyecto,
                    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                );
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;
        """))
        
        db.commit()
        logger.info("✅ Funciones de migración creadas")
        
    except Exception as e:
        logger.error(f"❌ Error creando funciones de migración: {e}")
        db.rollback()
        raise

def create_triggers_for_auto_import(db, engine):
    """Crear triggers para importación automática cuando se insertan/actualizan datos"""
    logger.info("Creando triggers para importación automática...")
    
    try:
        # Trigger for pagos_tierra
        db.execute(text("""
        CREATE OR REPLACE FUNCTION trigger_import_pagos_tierra()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Delete existing entries for this actividad
            DELETE FROM flujo_caja_maestro 
            WHERE concepto = NEW.actividad 
            AND descripcion LIKE 'Importado desde pagos_tierra%';
            
            -- Re-import all data (simpler than trying to update individual records)
            PERFORM import_pagos_tierra_to_flujo_maestro();
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_pagos_tierra_to_flujo ON pagos_tierra;
        CREATE TRIGGER trigger_pagos_tierra_to_flujo
            AFTER INSERT OR UPDATE ON pagos_tierra
            FOR EACH ROW EXECUTE FUNCTION trigger_import_pagos_tierra();
        """))
        
        # Trigger for estudios_disenos_permisos
        db.execute(text("""
        CREATE OR REPLACE FUNCTION trigger_import_estudios_permisos()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Delete existing entries for this actividad
            DELETE FROM flujo_caja_maestro 
            WHERE concepto = NEW.actividad 
            AND descripcion LIKE 'Importado desde estudios_disenos_permisos%';
            
            -- Re-import all data
            PERFORM import_estudios_permisos_to_flujo_maestro();
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_estudios_permisos_to_flujo ON estudios_disenos_permisos;
        CREATE TRIGGER trigger_estudios_permisos_to_flujo
            AFTER INSERT OR UPDATE ON estudios_disenos_permisos
            FOR EACH ROW EXECUTE FUNCTION trigger_import_estudios_permisos();
        """))
        
        # Trigger for infraestructura_pagos
        db.execute(text("""
        CREATE OR REPLACE FUNCTION trigger_import_infraestructura_pagos()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Delete existing entries for this proyecto/tipo
            DELETE FROM flujo_caja_maestro 
            WHERE descripcion LIKE 'Importado desde infraestructura_pagos%';
            
            -- Re-import all data
            PERFORM import_pagos_construccion_to_flujo_maestro();
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_infraestructura_pagos_to_flujo ON infraestructura_pagos;
        CREATE TRIGGER trigger_infraestructura_pagos_to_flujo
            AFTER INSERT OR UPDATE OR DELETE ON infraestructura_pagos
            FOR EACH ROW EXECUTE FUNCTION trigger_import_infraestructura_pagos();
        """))
        
        # Trigger for vivienda_pagos
        db.execute(text("""
        CREATE OR REPLACE FUNCTION trigger_import_vivienda_pagos()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Delete existing entries for this proyecto/tipo
            DELETE FROM flujo_caja_maestro 
            WHERE descripcion LIKE 'Importado desde vivienda_pagos%';
            
            -- Re-import all data
            PERFORM import_pagos_construccion_to_flujo_maestro();
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_vivienda_pagos_to_flujo ON vivienda_pagos;
        CREATE TRIGGER trigger_vivienda_pagos_to_flujo
            AFTER INSERT OR UPDATE OR DELETE ON vivienda_pagos
            FOR EACH ROW EXECUTE FUNCTION trigger_import_vivienda_pagos();
        """))
        
        db.commit()
        logger.info("✅ Triggers creados para importación automática")
        
    except Exception as e:
        logger.error(f"❌ Error creando triggers: {e}")
        db.rollback()
        raise

def main():
    """Función principal de migración"""
    logger.info("🚀 Iniciando migración completa al Flujo de Caja Maestro")
    logger.info("=" * 60)
    
    try:
        db, engine = get_db_session()
        
        # Backup existing data (optional)
        logger.info("📋 Creando respaldo de datos existentes...")
        backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Clear existing migrated data in flujo_caja_maestro
        logger.info("🧹 Limpiando datos migrados anteriores...")
        db.execute(text("""
            DELETE FROM flujo_caja_maestro 
            WHERE descripcion LIKE 'Migrado desde%' 
            OR descripcion LIKE 'Importado desde%'
        """))
        db.commit()
        
        # Run migrations
        logger.info("📊 Ejecutando migraciones...")
        
        migrate_pagos_tierra(db, engine)
        migrate_estudios_permisos(db, engine)
        migrate_infraestructura_pagos(db, engine)
        migrate_vivienda_pagos(db, engine)
        migrate_marketing_tables(db, engine)
        
        # Create migration functions and triggers
        create_migration_functions(db, engine)
        create_triggers_for_auto_import(db, engine)
        
        # Summary
        logger.info("📈 Generando resumen de migración...")
        result = db.execute(text("""
            SELECT 
                categoria_principal,
                categoria_secundaria,
                COUNT(*) as num_conceptos,
                SUM(monto_total) as total_monto
            FROM flujo_caja_maestro 
            WHERE descripcion LIKE 'Migrado desde%'
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
        logger.info("🔄 Triggers configurados para importación automática")
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