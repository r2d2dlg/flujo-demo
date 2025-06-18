from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from .. import models, auth
from ..auth import get_db

router = APIRouter(prefix="/marketing", tags=["marketing"])

@router.get("/{project}/tables")
async def get_tables(project: str, db: Session = Depends(auth.get_db)):
    """
    Get all tables for the specified project.
    """
    try:
        # Print current database and user for debugging
        db_info = db.execute(text("SELECT current_database(), current_user")).fetchone()
        print(f"[DEBUG] Connected to DB: {db_info[0]}, as user: {db_info[1]}")
        # Query to get all tables that contain the project name
        result = db.execute(
            text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND table_name LIKE :pattern
            ORDER BY table_name
            """),
            {"pattern": f"%{project}%"}
        )
        
        tables = [row[0] for row in result.fetchall()]
        print(f"[DEBUG /{project}/tables] Tables found: {tables}")
        return {"tables": tables}
    except Exception as e:
        print(f"Error fetching tables: {e}")
        # Fallback to sample data in case of error
        return {"tables": [f"presupuesto_mercadeo_{project}_gastos_publicitarios"]}

@router.get("/{project}/table/{table_name}/raw")
async def get_raw_table_data(
    project: str, 
    table_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Get raw data for a specific table exactly as it exists in the database.
    """
    try:
        # First verify the table exists and belongs to the project
        table_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
                AND table_name LIKE :project_pattern
            )
            """),
            {
                "table_name": table_name,
                "project_pattern": f"%{project}%"
            }
        ).scalar()
        
        if not table_exists:
            raise HTTPException(status_code=404, detail=f"Table {table_name} not found for project {project}")
        
        # Get column names
        columns_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :table_name
            ORDER BY ordinal_position
            """),
            {"table_name": table_name}
        )
        columns = [row[0] for row in columns_result.fetchall()]
        
        if not columns:
            return {
                "columns": [],
                "data": []
            }
        
        # Get table data exactly as it is
        columns_str = ', '.join(f'"{col}"' for col in columns)
        query = f'SELECT {columns_str} FROM "{table_name}"'
        data_result = db.execute(text(query))
        rows = data_result.fetchall()
        
        # Convert rows to list of dictionaries
        data = []
        for row in rows:
            row_dict = {}
            for i, col in enumerate(columns):
                value = row[i]
                if isinstance(value, Decimal):
                    row_dict[col] = float(value)
                else:
                    row_dict[col] = value
            data.append(row_dict)
        
        return {
            "columns": columns,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching raw table data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching raw table data: {str(e)}")

@router.get("/{project}/table/{table_name}")
async def get_table_data(
    project: str, 
    table_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Get data for a specific table with dynamic period transformation.
    """
    try:
        # First verify the table exists and belongs to the project
        table_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
                AND table_name LIKE :project_pattern
            )
            """),
            {
                "table_name": table_name,
                "project_pattern": f"%{project}%"
            }
        ).scalar()
        
        if not table_exists:
            raise HTTPException(status_code=404, detail=f"Table {table_name} not found for project {project}")
        
        # Get column names
        columns_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :table_name
            ORDER BY ordinal_position
            """),
            {"table_name": table_name}
        )
        db_columns = [row[0] for row in columns_result.fetchall()]
        
        if not db_columns:
            return {
                "columns": [],
                "data": []
            }
        
        # Calculate dynamic period (3 months before current, 36 months forward)
        current_date = datetime.now()
        start_date = current_date - timedelta(days=90)  # Approximately 3 months back
        start_year = start_date.year
        start_month = start_date.month
        
        # Generate 39 months of dynamic columns (3 back + 36 forward)
        dynamic_periods = []
        year, month = start_year, start_month
        for i in range(39):
            dynamic_periods.append(f"{year:04d}_{month:02d}")
            month += 1
            if month > 12:
                month = 1
                year += 1
        
        # Get table data
        columns_str = ', '.join(f'"{col}"' for col in db_columns)
        query = f'SELECT {columns_str} FROM "{table_name}"'
        data_result = db.execute(text(query))
        rows = data_result.fetchall()
        
        # Transform columns: CONCEPTO -> actividad, amount_YYYY_MM -> YYYY_MM (only for dynamic periods)
        transformed_columns = ['actividad']  # Always start with actividad
        
        # Add dynamic period columns
        for period in dynamic_periods:
            transformed_columns.append(period)
        
        # Transform data
        transformed_data = []
        for row in rows:
            row_dict = dict(zip(db_columns, row))
            transformed_row = []
            
            # Add actividad (from CONCEPTO)
            concepto_value = row_dict.get('CONCEPTO', '')
            transformed_row.append(concepto_value)
            
            # Add dynamic period values
            for period in dynamic_periods:
                amount_col = f'amount_{period}'
                if amount_col in row_dict:
                    value = row_dict[amount_col]
                    if value is not None:
                        transformed_row.append(float(value))
                    else:
                        transformed_row.append(0.0)
                else:
                    transformed_row.append(0.0)
            
            transformed_data.append(transformed_row)
        
        return {
            "columns": transformed_columns,
            "data": transformed_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching table data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching table data: {str(e)}")

@router.get("/{project}/view/{view_name}")
async def get_view_data(
    project: str, 
    view_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Get data for a specific view from the database.
    """
    try:
        # First, verify the view exists and belongs to the project
        view_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.views 
                WHERE table_schema = 'public' 
                AND table_name = :view_name
                AND table_name LIKE :project_pattern
            )
            """),
            {
                "view_name": view_name,
                "project_pattern": f"%{project}%"
            }
        ).scalar()
        
        if not view_exists:
            # Try with the full view name pattern
            full_view_name = f"v_presupuesto_mercadeo_{project}_{view_name}"
            view_exists = db.execute(
                text("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.views 
                    WHERE table_schema = 'public' 
                    AND table_name = :full_view_name
                )
                """),
                {"full_view_name": full_view_name}
            ).scalar()
            
            if not view_exists:
                raise HTTPException(status_code=404, detail=f"View {view_name} not found for project {project}")
            view_name = full_view_name
        
        # Get column names
        columns_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :view_name
            ORDER BY ordinal_position
            """),
            {"view_name": view_name}
        )
        columns = [row[0] for row in columns_result.fetchall()]
        
        # Get view data with proper column names
        data_result = db.execute(text(f'SELECT * FROM \"{view_name}\"'))
        
        # Convert rows to dictionaries with column names
        data = []
        for row in data_result.fetchall():
            data.append(dict(zip(columns, row)))
        
        return {
            "columns": columns,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching view data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching view data: {str(e)}")

@router.put("/{project}/table/{table_name}/{row_id}/raw")
async def update_table_row_raw(
    project: str,
    table_name: str,
    row_id: str,
    data: Dict[str, Any],
    db: Session = Depends(auth.get_db)
):
    """
    Update a row in the specified table with raw data (no transformations).
    
    The first column in the table is assumed to be the primary key.
    """
    try:
        # Verify the table exists and belongs to the project
        table_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
                AND table_name LIKE :project_pattern
            )
            """),
            {
                "table_name": table_name,
                "project_pattern": f"%{project}%"
            }
        ).scalar()
        
        if not table_exists:
            raise HTTPException(status_code=404, detail=f"Table {table_name} not found for project {project}")
        
        # Get the primary key column (first column in the table)
        pk_column_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :table_name
            ORDER BY ordinal_position
            LIMIT 1
            """),
            {"table_name": table_name}
        )
        
        pk_column_row = pk_column_result.fetchone()
        if not pk_column_row:
            raise HTTPException(status_code=400, detail=f"Could not determine primary key for table {table_name}")
            
        pk_column = pk_column_row[0]
        
        # Build the SET clause for the UPDATE query
        set_clauses = []
        params = {"row_id": row_id}
        
        for i, (column, value) in enumerate(data.items()):
            param_name = f"val_{i}"
            set_clauses.append(f'"{column}" = :{param_name}')
            params[param_name] = value
        
        if not set_clauses:
            raise HTTPException(status_code=400, detail="No columns to update")
        
        # Execute the update query
        query = f"""
            UPDATE "{table_name}"
            SET {', '.join(set_clauses)}
            WHERE "{pk_column}" = :row_id
            RETURNING *
        """
        
        result = db.execute(text(query), params)
        db.commit()
        
        # Get the updated row
        updated_row = result.fetchone()
        
        if not updated_row:
            raise HTTPException(status_code=404, detail=f"Row with {pk_column} = {row_id} not found in table {table_name}")
        
        # Convert row to dict
        columns = [col for col in updated_row._mapping.keys()]
        updated_data = dict(zip(columns, updated_row))
        
        return {
            "status": "success",
            "data": updated_data
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating table row: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating table row: {str(e)}")

@router.put("/{project}/table/{table_name}/{row_id}")
async def update_table_row(
    project: str,
    table_name: str,
    row_id: str,
    data: Dict[str, Any],
    db: Session = Depends(auth.get_db)
):
    """
    Update a row in the specified table.
    
    The first column in the table is assumed to be the primary key.
    """
    try:
        # Verify the table exists and belongs to the project
        table_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
                AND table_name LIKE :project_pattern
            )
            """),
            {
                "table_name": table_name,
                "project_pattern": f"%{project}%"
            }
        ).scalar()
        
        if not table_exists:
            raise HTTPException(status_code=404, detail=f"Table {table_name} not found for project {project}")
        
        # Get the primary key column (first column in the table)
        pk_column_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :table_name
            ORDER BY ordinal_position
            LIMIT 1
            """),
            {"table_name": table_name}
        )
        
        pk_column_row = pk_column_result.fetchone()
        if not pk_column_row:
            raise HTTPException(status_code=400, detail=f"Could not determine primary key for table {table_name}")
            
        pk_column = pk_column_row[0]
        
        # Build the SET clause for the UPDATE query
        set_clauses = []
        params = {"row_id": row_id}
        
        for i, (column, value) in enumerate(data.items()):
            param_name = f"val_{i}"
            set_clauses.append(f'"{column}" = :{param_name}')
            params[param_name] = value
        
        if not set_clauses:
            raise HTTPException(status_code=400, detail="No columns to update")
        
        # Execute the update query
        query = f"""
            UPDATE "{table_name}"
            SET {', '.join(set_clauses)}
            WHERE "{pk_column}" = :row_id
            RETURNING *
        """
        
        result = db.execute(text(query), params)
        db.commit()
        
        # Get the updated row
        updated_row = result.fetchone()
        
        if not updated_row:
            raise HTTPException(status_code=404, detail=f"Row with {pk_column} = {row_id} not found in table {table_name}")
        
        # Convert row to dict
        columns = [col for col in updated_row._mapping.keys()]
        updated_data = dict(zip(columns, updated_row))
        
        return {
            "status": "success",
            "data": updated_data
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating table row: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating table row: {str(e)}")

@router.post("/{project}/table/{table_name}/data")
async def add_table_row(
    project: str,
    table_name: str,
    data: Dict[str, Any],
    db: Session = Depends(auth.get_db)
):
    """
    Add a row to the specified marketing table.
    Transforms frontend data format (actividad, YYYY_MM) to database format (CONCEPTO, amount_YYYY_MM).
    """
    try:
        # Verify the table exists and belongs to the project
        table_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
                AND table_name LIKE :project_pattern
            )
            """),
            {
                "table_name": table_name,
                "project_pattern": f"%{project}%"
            }
        ).scalar()
        
        if not table_exists:
            raise HTTPException(status_code=404, detail=f"Table {table_name} not found for project {project}")
        
        # Get column names
        columns_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :table_name
            ORDER BY ordinal_position
            """),
            {"table_name": table_name}
        )
        db_columns = [row[0] for row in columns_result.fetchall()]
        
        # Transform frontend data to database format
        data_to_insert = {}
        
        # Transform actividad -> CONCEPTO
        if 'actividad' in data:
            data_to_insert['CONCEPTO'] = data['actividad']
        
        # Get the actual database periods by checking what amount_ columns exist
        db_periods = []
        for col in db_columns:
            if col.startswith('amount_'):
                period = col.replace('amount_', '')
                db_periods.append(period)
        db_periods.sort()  # Sort to ensure consistent order
        
        # Calculate dynamic periods (same logic as GET)
        current_date = datetime.now()
        start_date = current_date - timedelta(days=90)  # Approximately 3 months back
        start_year = start_date.year
        start_month = start_date.month
        
        # Generate 39 months of dynamic columns (3 back + 36 forward)
        dynamic_periods = []
        year, month = start_year, start_month
        for i in range(39):
            dynamic_periods.append(f"{year:04d}_{month:02d}")
            month += 1
            if month > 12:
                month = 1
                year += 1
        
        # Transform dynamic YYYY_MM -> database amount_YYYY_MM
        for key, value in data.items():
            if key != 'actividad' and '_' in key and len(key) == 7:  # YYYY_MM format
                # Find which dynamic period this is
                try:
                    dynamic_index = dynamic_periods.index(key)
                    if dynamic_index < len(db_periods):
                        # Map to corresponding database period
                        db_period = db_periods[dynamic_index]
                        amount_col = f'amount_{db_period}'
                        if amount_col in db_columns:
                            # Only insert non-zero values to avoid cluttering the database
                            if value and float(value) != 0:
                                data_to_insert[amount_col] = float(value)
                except ValueError:
                    # Dynamic period not found, skip
                    continue
        
        # Filter to only include actual DB columns, excluding id/timestamps
        data_to_insert = {
            k: v for k, v in data_to_insert.items() 
            if k in db_columns and k not in ['id', 'created_at', 'updated_at']
        }
        
        if not data_to_insert:
            raise HTTPException(status_code=400, detail="No valid data provided for insertion")
        
        # Ensure CONCEPTO is provided
        if 'CONCEPTO' not in data_to_insert:
            raise HTTPException(status_code=400, detail="actividad field is required")
        
        # Build the INSERT query
        cols_to_insert = list(data_to_insert.keys())
        placeholders = [f":{col}" for col in cols_to_insert]
        quoted_cols_to_insert = [f'"{col}"' for col in cols_to_insert]
        
        insert_sql = f"""
            INSERT INTO public."{table_name}" ({", ".join(quoted_cols_to_insert)})
            VALUES ({", ".join(placeholders)})
            RETURNING *
        """
        
        result = db.execute(text(insert_sql), data_to_insert)
        db.commit()
        
        inserted_row = result.fetchone()
        
        if not inserted_row:
            raise HTTPException(status_code=500, detail="Failed to insert row")
        
        # Convert row to dict and transform back to frontend format
        inserted_row_dict = dict(zip(db_columns, inserted_row))
        
        # Transform response back to frontend format
        response_data = {}
        if 'CONCEPTO' in inserted_row_dict:
            response_data['actividad'] = inserted_row_dict['CONCEPTO']
        
        # Transform amount_YYYY_MM back to YYYY_MM
        for col, value in inserted_row_dict.items():
            if col.startswith('amount_'):
                period = col.replace('amount_', '')
                response_data[period] = float(value) if value is not None else 0.0
        
        return {
            "status": "success",
            "data": response_data
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error adding table row: {e}")
        raise HTTPException(status_code=500, detail=f"Error adding table row: {str(e)}")

@router.post("/{project}/table/{table_name}/populate-defaults")
async def populate_default_activities(
    project: str,
    table_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Populate default activities for marketing tables based on their category.
    """
    try:
        # Define default activities for each table type
        default_activities = {
            'casa_modelo': [
                'Decoración y Mobiliario',
                'Mantenimiento Casa Modelo',
                'Servicios Básicos Casa Modelo',
                'Seguridad Casa Modelo'
            ],
            'gastos_publicitarios': [
                'Impresiones Publicitarias',
                'Vallas Publicitarias',
                'Radio y TV',
                'Publicidad Digital',
                'Material POP'
            ],
            'feria_eventos': [
                'Participación en Ferias',
                'Eventos de Lanzamiento',
                'Activaciones de Marca',
                'Stands y Decoración'
            ],
            'gastos_tramites': [
                'Permisos y Licencias',
                'Trámites Municipales',
                'Documentación Legal',
                'Gestiones Administrativas'
            ],
            'promociones_y_bonos': [
                'Descuentos por Pronto Pago',
                'Bonos de Referidos',
                'Promociones Especiales',
                'Incentivos de Ventas'
            ],
            'redes_sociales': [
                'Gestión de Redes Sociales',
                'Contenido Digital',
                'Publicidad en Redes',
                'Community Management'
            ]
        }
        
        # Determine table category from table name
        table_category = None
        for category in default_activities.keys():
            if category in table_name:
                table_category = category
                break
        
        if not table_category:
            raise HTTPException(status_code=400, detail=f"Unknown table category for {table_name}")
        
        # Check if table already has data
        count_result = db.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
        existing_count = count_result.scalar()
        
        if existing_count > 0:
            return {
                "status": "info",
                "message": f"Table already has {existing_count} rows. Default activities not added.",
                "existing_count": existing_count
            }
        
        # Get table columns to build insert statement
        columns_result = db.execute(
            text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = :table_name
            AND column_name NOT IN ('id', 'created_at', 'updated_at')
            ORDER BY ordinal_position
            """),
            {"table_name": table_name}
        )
        columns = [row[0] for row in columns_result.fetchall()]
        
        # Insert default activities
        activities = default_activities[table_category]
        inserted_count = 0
        
        for activity in activities:
            # Build insert data with only CONCEPTO field
            insert_data = {'CONCEPTO': activity}
            
            # Build the INSERT query
            cols_to_insert = list(insert_data.keys())
            placeholders = [f":{col}" for col in cols_to_insert]
            quoted_cols_to_insert = [f'"{col}"' for col in cols_to_insert]
            
            insert_sql = f"""
                INSERT INTO public."{table_name}" ({", ".join(quoted_cols_to_insert)})
                VALUES ({", ".join(placeholders)})
            """
            
            db.execute(text(insert_sql), insert_data)
            inserted_count += 1
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Added {inserted_count} default activities to {table_name}",
            "activities": activities
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error populating default activities: {e}")
        raise HTTPException(status_code=500, detail=f"Error populating default activities: {str(e)}")

@router.get("/{project}/views")
async def get_views(project: str, db: Session = Depends(auth.get_db)):
    """
    Get all views for the specified project from the database.
    Project can be 'chepo' or 'tanara'.
    """
    try:
        # Define the view patterns for each project
        project_views = {
            'chepo': 'v_presupuesto_mercadeo_chepo_%',
            'tanara': 'v_presupuesto_mercadeo_tanara_%'
        }
        
        # Get the pattern for the requested project, or use a default pattern
        view_pattern = project_views.get(project.lower(), f'%{project}%')
        
        # Query to get all views from the current database that match the project
        result = db.execute(
            text("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            AND table_name LIKE :pattern
            ORDER BY table_name
            """),
            {"pattern": view_pattern}
        )
        
        views = [row[0] for row in result.fetchall()]
        
        # If no views found with the specific pattern, try a more general search
        if not views and project.lower() in ['chepo', 'tanara']:
            result = db.execute(
                text("""
                SELECT table_name 
                FROM information_schema.views 
                WHERE table_schema = 'public'
                AND table_name LIKE :pattern
                ORDER BY table_name
                """),
                {"pattern": f'%{project}%'}
            )
            views = [row[0] for row in result.fetchall()]
        
        return {"views": views}
        
    except Exception as e:
        print(f"Error fetching views: {e}")
        # Fallback to known views based on project
        fallback_views = {
            'chepo': ['v_presupuesto_mercadeo_chepo_gastos_tramites'],
            'tanara': ['v_presupuesto_mercadeo_tanara_gastos_tramites']
        }
        return {"views": fallback_views.get(project.lower(), [])}

@router.get("/consolidated/cash-flow")
async def get_consolidated_marketing_cash_flow(db: Session = Depends(auth.get_db)):
    """
    Get consolidated marketing cash flow data for all projects.
    Handles tables with either 'CONCEPTO' or 'actividad' columns and varying month columns.
    """
    try:
        # Get all marketing budget tables
        tables_result = db.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'presupuesto_mercadeo_%'"
        )).fetchall()
        marketing_tables = [t[0] for t in tables_result]
        print(f"[DEBUG] Found marketing tables: {marketing_tables}")

        # Generate all possible dynamic period columns we are interested in (3 months before current + 36 forward)
        now = datetime.now()
        target_periods = []
        for i in range(-3, 36):
            month_date = now + relativedelta(months=i)
            target_periods.append(f"{month_date.year}_{month_date.month:02d}")
        
        print(f"[DEBUG] Target dynamic periods: {target_periods}")

        # Aggregate data from all marketing tables
        consolidated_data = {}
        for table in marketing_tables:
            try:
                # For each table, get its actual columns, preserving case
                db_cols_result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = :table"), {"table": table}).fetchall()
                table_columns = [c[0] for c in db_cols_result]
                table_columns_lower = [c.lower() for c in table_columns]

                # Find the description column, checking for 'concepto' or 'actividad' case-insensitively
                description_col_name = None
                if 'concepto' in table_columns_lower:
                    idx = table_columns_lower.index('concepto')
                    description_col_name = table_columns[idx]
                elif 'actividad' in table_columns_lower:
                    idx = table_columns_lower.index('actividad')
                    description_col_name = table_columns[idx]
                
                if not description_col_name:
                    print(f'[WARNING] Skipping table {table}: No description column found.')
                    continue
                
                description_col_sql = f'"{description_col_name}"'
                
                # Find which of our target period columns actually exist in this table, handling both naming conventions
                existing_amount_cols = []
                col_mapping = {} # To map DB col name back to standard period
                
                for period in target_periods:
                    standard_col_name = f"amount_{period}"
                    colombia_col_name = f"amount_amount_{period}"

                    # Check for existence case-insensitively, but use original name
                    if standard_col_name in table_columns_lower:
                        idx = table_columns_lower.index(standard_col_name)
                        original_col_name = table_columns[idx]
                        existing_amount_cols.append(f'"{original_col_name}"')
                        col_mapping[f'"{original_col_name}"'] = period
                    elif colombia_col_name in table_columns_lower:
                        idx = table_columns_lower.index(colombia_col_name)
                        original_col_name = table_columns[idx]
                        existing_amount_cols.append(f'"{original_col_name}"')
                        col_mapping[f'"{original_col_name}"'] = period

                if not existing_amount_cols:
                    print(f'[WARNING] Skipping table {table}: No relevant amount columns found.')
                    continue
                
                select_cols_str = ", ".join(existing_amount_cols)

                # Build and execute the query for the current table
                query_sql = f'SELECT {description_col_sql}, {select_cols_str} FROM "{table}"'
                
                table_result = db.execute(text(query_sql)).fetchall()
                
                for row in table_result:
                    actividad_key = row[0] if row[0] else "Sin Concepto"

                    if actividad_key not in consolidated_data:
                        # Initialize with all target periods set to 0
                        consolidated_data[actividad_key] = {period: 0.0 for period in target_periods}
                    
                    # Map the returned values back to the correct standard period
                    for i, db_col_name in enumerate(existing_amount_cols):
                        period_key = col_mapping[db_col_name]
                        value = row[i+1] # +1 because row[0] is the description
                        if value is not None:
                            consolidated_data[actividad_key][period_key] += float(value)
            
            except Exception as e:
                print(f"[WARNING] Error processing table {table}: {e}")
                db.rollback()
                continue

        # Convert to list of dictionaries for frontend
        response_data = []
        total_row = {"actividad": "TOTAL"}
        for period in target_periods:
            total_row[period] = 0

        for actividad, data in consolidated_data.items():
            row_data = {"actividad": actividad, **data}
            response_data.append(row_data)
            for period in target_periods:
                total_row[period] += data.get(period, 0)
        
        response_data.append(total_row)
        
        return {
            "data": response_data,
            "columns": ["actividad"] + target_periods
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching consolidated cash flow data: {str(e)}"
        )
