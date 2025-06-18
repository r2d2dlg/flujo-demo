# backend/app/routers/projects.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import re
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import List

from ..database import get_db
from ..models import Proyecto

# --- Helper Functions ---

def get_dynamic_month_columns() -> list[str]:
    """
    Generates a list of 39 monthly column names in 'amount_YYYY_MM' format:
    3 months in the past, the current month, and 35 months in the future.
    """
    columns = []
    # Set the start date to 3 months before the current month
    start_date = datetime.now() - relativedelta(months=3)
    
    for i in range(39):
        current_month = start_date + relativedelta(months=i)
        year = current_month.strftime('%Y')
        month = current_month.strftime('%m')
        columns.append(f"amount_{year}_{month}")
        
    return columns

def sanitize_keyword(keyword: str) -> str:
    """
    Sanitizes a string to be used as part of a database table name.
    """
    keyword = keyword.lower().strip()
    # Allow only lowercase letters, numbers, and underscores
    keyword = re.sub(r'[^a-z0-9_]', '', keyword)
    # Replace multiple consecutive underscores with a single one
    keyword = re.sub(r'_+', '_', keyword)
    return keyword

# --- Pydantic Models ---

class ProjectCreateRequest(BaseModel):
    project_keyword: str

class ComprehensiveProjectCreateRequest(BaseModel):
    project_name: str

# --- Router Definition ---

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"]
)

# Define the standard suffixes for the tables to be created for each project
TABLE_SUFFIXES = [
    "casa_modelo",
    "feria_eventos",
    "gastos_casa_modelo",
    "gastos_publicitarios",
    "gastos_tramites",
    "promociones_y_bonos",
    "redes_sociales"
]

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_marketing_project(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    project_keyword = payload.get("project_keyword")
    if not project_keyword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing project_keyword")
    table_defs = [
        ("gastos_casa_modelo", "GASTOS DE CASA MODELO"),
        ("promociones_y_bonos", "PROMOCIONES Y BONOS"),
        ("redes_sociales", "REDES SOCIALES"),
        ("feria_eventos", "FERIA Y EVENTOS"),
        ("gastos_publicitarios", "GASTOS PUBLICITARIOS"),
        ("gastos_tramites", "GASTOS DE TRÁMITES"),
    ]
    months = get_dynamic_month_columns()
    month_cols_sql = ",\n    ".join([f'"{m}" DECIMAL(15,2) DEFAULT 0.00' for m in months])

    try:
        # 1. Create tables
        for suffix, category in table_defs:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            db.execute(text(f'''
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    concepto VARCHAR(255) NOT NULL,
                    {month_cols_sql},
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            '''))
            
            # Insert default activities for each table
            default_activities = get_default_activities_for_category(category)
            for activity in default_activities:
                db.execute(text(f'''
                    INSERT INTO {table_name} (concepto) VALUES (:concepto)
                '''), {"concepto": activity})

        # 2. Create FULL view
        union_selects = []
        for suffix, category in table_defs:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            union_selects.append(f'''
                SELECT '{category}' AS categoria, concepto AS actividad,
                    {', '.join(months)},
                    ({' + '.join([f'COALESCE({m},0)' for m in months])}) AS total
                FROM {table_name}
            ''')
        full_view_sql = f'''
            CREATE OR REPLACE VIEW vista_presupuesto_mercadeo_{project_keyword}_full AS
            {'UNION ALL'.join(union_selects)};
        '''
        db.execute(text(full_view_sql))

        # 3. Create RESUMEN view
        union_selects_resumen = []
        for suffix, category in table_defs:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            union_selects_resumen.append(f'''
                SELECT '{category}' AS categoria, {', '.join(months)}
                FROM {table_name}
            ''')
        resumen_view_sql = f'''
            CREATE OR REPLACE VIEW vista_presupuesto_mercadeo_{project_keyword}_resumen AS
            SELECT categoria,
                {', '.join([f'SUM({m}) AS {m}' for m in months])},
                SUM({' + '.join([f'COALESCE({m},0)' for m in months])}) AS total
            FROM (
                {'UNION ALL'.join(union_selects_resumen)}
            ) t
            GROUP BY categoria;
        '''
        db.execute(text(resumen_view_sql))

        # 4. Grant privileges (optional - ignore if current user doesn't have GRANT privileges)
        try:
            db.execute(text("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO arturodlg"))
            db.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres"))
            db.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO arturodlg"))
            db.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres"))
        except Exception as grant_error:
            # Log the error but don't fail the project creation
            print(f"Warning: Could not grant privileges (this is optional): {grant_error}")

        db.commit()
        return {"success": True, "message": f"Project '{project_keyword}' created with all tables, views, and permissions."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/create-comprehensive", status_code=status.HTTP_201_CREATED)
async def create_comprehensive_project(
    payload: ComprehensiveProjectCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a comprehensive project with all necessary tables and initial data:
    - Marketing budget tables and views
    - Payroll entries for variable construction
    - Infrastructure and housing cost entries
    - Project configuration entries
    """
    project_keyword = payload.project_name.lower().strip().replace(" ", "_")
    if not project_keyword:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing project_name")
    
    try:
        # 0. Add project to projects table
        display_name = f"Proyecto {payload.project_name.title()}"
        new_project = Proyecto(
            keyword=project_keyword,
            display_name=display_name,
            description=f"Comprehensive project: {payload.project_name}",
            is_active=True
        )
        db.add(new_project)
        db.flush()  # Flush to check for constraint violations
        
        # 1. Create Marketing Budget Tables (same as existing endpoint)
        table_defs = [
            ("casa_modelo", "CASA MODELO"),
            ("feria_eventos", "FERIA Y EVENTOS"),
            ("gastos_casa_modelo", "GASTOS DE CASA MODELO"),
            ("gastos_publicitarios", "GASTOS PUBLICITARIOS"),
            ("gastos_tramites", "GASTOS DE TRÁMITES"),
            ("promociones_y_bonos", "PROMOCIONES Y BONOS"),
            ("redes_sociales", "REDES SOCIALES")
        ]
        months = get_dynamic_month_columns()
        month_cols_sql = ",\n    ".join([f'amount_{m} DECIMAL(15,2) DEFAULT 0.00' for m in months])

        # Create marketing tables
        for suffix, category in table_defs:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            db.execute(text(f'''
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    concepto VARCHAR(255) NOT NULL,
                    {month_cols_sql},
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
            '''))
            
            # Insert default activities for each table
            default_activities = get_default_activities_for_category(category)
            for activity in default_activities:
                db.execute(text(f'''
                    INSERT INTO {table_name} (concepto) VALUES (:concepto)
                '''), {"concepto": activity})

        # 2. Create Marketing Views
        # Full consolidated view
        union_selects = []
        for suffix, category in table_defs:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            month_sums = ', '.join([f'COALESCE(amount_{m}, 0) AS amount_{m}' for m in months])
            total_sum = ' + '.join([f'COALESCE(amount_{m}, 0)' for m in months])
            union_selects.append(f'''
                SELECT '{category}' AS categoria, concepto AS actividad,
                    {month_sums},
                    ({total_sum}) AS total
                FROM {table_name}
            ''')
        
        consolidated_view_sql = f'''
            CREATE OR REPLACE VIEW v_presupuesto_mercadeo_{project_keyword}_consolidado AS
            {' UNION ALL '.join(union_selects)}
            ORDER BY categoria, actividad;
        '''
        db.execute(text(consolidated_view_sql))

        # Summary view
        union_selects_summary = []
        for suffix, category in table_defs:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            month_sums = ', '.join([f'SUM(COALESCE(amount_{m}, 0)) AS amount_{m}' for m in months])
            total_sum = ' + '.join([f'SUM(COALESCE(amount_{m}, 0))' for m in months])
            union_selects_summary.append(f'''
                SELECT '{category}' AS categoria,
                    {month_sums},
                    ({total_sum}) AS total
                FROM {table_name}
            ''')
        
        summary_view_sql = f'''
            CREATE OR REPLACE VIEW v_presupuesto_mercadeo_{project_keyword}_resumen AS
            {' UNION ALL '.join(union_selects_summary)};
        '''
        db.execute(text(summary_view_sql))

        # 3. Add Project Variable Payroll Configuration
        # First check if the project already has a payroll configuration
        existing_payroll = db.execute(text('''
            SELECT id FROM proyecto_variable_payroll WHERE proyecto = :proyecto
        '''), {"proyecto": project_keyword}).fetchone()
        
        if not existing_payroll:
            # Create a default payroll configuration (12 months active period)
            current_date = datetime.now()
            start_month = f"{current_date.year}_{current_date.month:02d}"
            end_date = datetime(current_date.year + 1, current_date.month, 1)
            end_month = f"{end_date.year}_{end_date.month:02d}"
            
            db.execute(text('''
                INSERT INTO proyecto_variable_payroll (proyecto, start_month, end_month, is_active)
                VALUES (:proyecto, :start_month, :end_month, true)
            '''), {
                "proyecto": project_keyword,
                "start_month": start_month,
                "end_month": end_month
            })

        # 4. Create sample entries for Infrastructure and Housing costs
        # Add sample infrastructure payment entries
        for month in range(1, 13):  # 12 months
            db.execute(text('''
                INSERT INTO infraestructura_pagos (proyecto, tipo, monto, mes, detalles)
                VALUES (:proyecto, 'material', 0.00, :mes, :detalles)
            '''), {
                "proyecto": project_keyword,
                "mes": month,
                "detalles": f"Materiales de infraestructura - Mes {month}"
            })
            
            db.execute(text('''
                INSERT INTO infraestructura_pagos (proyecto, tipo, monto, mes, detalles)
                VALUES (:proyecto, 'mano_obra', 0.00, :mes, :detalles)
            '''), {
                "proyecto": project_keyword,
                "mes": month,
                "detalles": f"Mano de obra infraestructura - Mes {month}"
            })

        # Add sample housing payment entries
        for month in range(1, 13):  # 12 months
            db.execute(text('''
                INSERT INTO vivienda_pagos (proyecto, tipo, monto, mes, detalles)
                VALUES (:proyecto, 'material', 0.00, :mes, :detalles)
            '''), {
                "proyecto": project_keyword,
                "mes": month,
                "detalles": f"Materiales de vivienda - Mes {month}"
            })
            
            db.execute(text('''
                INSERT INTO vivienda_pagos (proyecto, tipo, monto, mes, detalles)
                VALUES (:proyecto, 'mano_obra', 0.00, :mes, :detalles)
            '''), {
                "proyecto": project_keyword,
                "mes": month,
                "detalles": f"Mano de obra vivienda - Mes {month}"
            })

        # 5. Create sample direct cost entries
        cost_activities = [
            "Excavación",
            "Fundaciones",
            "Estructura",
            "Mampostería",
            "Instalaciones Eléctricas",
            "Instalaciones Sanitarias",
            "Acabados",
            "Pintura"
        ]
        
        for activity in cost_activities:
            db.execute(text('''
                INSERT INTO costo_directo (actividad, infraestructura, materiales, mo, equipos, total, proyecto)
                VALUES (:actividad, 0.00, 0.00, 0.00, 0.00, 0.00, :proyecto)
            '''), {
                "actividad": activity,
                "proyecto": project_keyword
            })

        # 6. Create sample cost per housing unit entry
        db.execute(text('''
            INSERT INTO costo_x_vivienda (viviendas, materiales, mo, otros, proyecto)
            VALUES (0, 0.00, 0.00, 0.00, :proyecto)
        '''), {"proyecto": project_keyword})

        # 7. Grant privileges (optional - ignore if current user doesn't have GRANT privileges)
        try:
            db.execute(text("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO arturodlg"))
            db.execute(text("GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres"))
            db.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO arturodlg"))
            db.execute(text("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres"))
        except Exception as grant_error:
            # Log the error but don't fail the project creation
            print(f"Warning: Could not grant privileges (this is optional): {grant_error}")

        db.commit()
        
        return {
            "success": True, 
            "message": f"Comprehensive project '{project_keyword}' created successfully with all tables, views, and initial data.",
            "project_keyword": project_keyword,
            "tables_created": {
                "marketing": [f"presupuesto_mercadeo_{project_keyword}_{suffix}" for suffix, _ in table_defs],
                "infrastructure_entries": 24,  # 12 months * 2 types
                "housing_entries": 24,  # 12 months * 2 types  
                "direct_cost_entries": len(cost_activities),
                "housing_cost_entries": 1,
                "payroll_config": 1
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

def get_default_activities_for_category(category: str) -> List[str]:
    """Get default activities for each marketing category"""
    activities_map = {
        "CASA MODELO": [
            "Alquiler de Local",
            "Decoración y Mobiliario",
            "Servicios Públicos",
            "Mantenimiento"
        ],
        "FERIA Y EVENTOS": [
            "Participación en Ferias",
            "Eventos de Lanzamiento",
            "Stand y Equipos",
            "Material Promocional"
        ],
        "GASTOS DE CASA MODELO": [
            "Decoración",
            "Mobiliario",
            "Equipamiento",
            "Ambientación"
        ],
        "GASTOS PUBLICITARIOS": [
            "Publicidad Digital",
            "Publicidad Impresa",
            "Radio y TV",
            "Vallas Publicitarias"
        ],
        "GASTOS DE TRÁMITES": [
            "Permisos y Licencias",
            "Trámites Legales",
            "Documentación",
            "Gestorías"
        ],
        "PROMOCIONES Y BONOS": [
            "Bonos de Enganche",
            "Descuentos Especiales",
            "Promociones Temporales",
            "Incentivos de Venta"
        ],
        "REDES SOCIALES": [
            "Facebook Ads",
            "Instagram Marketing",
            "Google Ads",
            "Community Management"
        ]
    }
    return activities_map.get(category, ["Actividad General"])

@router.delete("/{project_keyword}")
async def delete_project(
    project_keyword: str,
    db: Session = Depends(get_db)
):
    """Delete all tables and data associated with a project"""
    try:
        # Delete marketing tables
        table_suffixes = ["casa_modelo", "feria_eventos", "gastos_casa_modelo", 
                         "gastos_publicitarios", "gastos_tramites", "promociones_y_bonos", "redes_sociales"]
        
        for suffix in table_suffixes:
            table_name = f"presupuesto_mercadeo_{project_keyword}_{suffix}"
            # Drop views first
            db.execute(text(f"DROP VIEW IF EXISTS v_{table_name} CASCADE"))
            # Drop table
            db.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
        
        # Drop consolidated views
        db.execute(text(f"DROP VIEW IF EXISTS v_presupuesto_mercadeo_{project_keyword}_consolidado CASCADE"))
        db.execute(text(f"DROP VIEW IF EXISTS v_presupuesto_mercadeo_{project_keyword}_resumen CASCADE"))
        
        # Delete from projects table
        project_to_delete = db.query(Proyecto).filter(Proyecto.keyword == project_keyword).first()
        if project_to_delete:
            db.delete(project_to_delete)
        
        # Delete project data from other tables
        db.execute(text("DELETE FROM infraestructura_pagos WHERE proyecto = :proyecto"), {"proyecto": project_keyword})
        db.execute(text("DELETE FROM vivienda_pagos WHERE proyecto = :proyecto"), {"proyecto": project_keyword})
        db.execute(text("DELETE FROM costo_directo WHERE proyecto = :proyecto"), {"proyecto": project_keyword})
        db.execute(text("DELETE FROM costo_x_vivienda WHERE proyecto = :proyecto"), {"proyecto": project_keyword})
        db.execute(text("DELETE FROM proyecto_variable_payroll WHERE proyecto = :proyecto"), {"proyecto": project_keyword})
        db.execute(text("DELETE FROM planilla_variable_construccion WHERE proyecto = :proyecto"), {"proyecto": project_keyword})
        
        db.commit()
        
        return {"success": True, "message": f"Project '{project_keyword}' and all associated data deleted successfully."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/list")
async def list_all_projects(db: Session = Depends(get_db)):
    """
    Get a list of all existing projects from the projects table
    """
    try:
        # Query all active projects from the projects table
        projects = db.query(Proyecto).filter(Proyecto.is_active == True).order_by(Proyecto.display_name).all()
        
        return {
            "projects": [
                {
                    "keyword": project.keyword,
                    "display_name": project.display_name
                }
                for project in projects
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
