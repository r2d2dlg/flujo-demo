from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
import re
from .. import auth
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from pydantic import BaseModel, Field
from decimal import Decimal

# Define table names as constants
LINEAS_CREDITO_TABLE_NAME = "lineas_credito"
LINEA_CREDITO_USOS_TABLE_NAME = "linea_credito_usos"

# Pydantic model for creating a marketing proyecto
class MarketingProyectoCreate(BaseModel):
    nombre: str

# Pydantic model for returning a marketing proyecto (includes id)
class MarketingProyecto(BaseModel):
    id: int
    nombre: str
    # created_at: datetime # Optional, if you want to return it
    # updated_at: datetime # Optional, if you want to return it

    class Config:
        # orm_mode = True # For Pydantic V1
        from_attributes = True # For Pydantic V2

# Pydantic models for Linea de Credito
# Definitions for LineaCreditoBase, LineaCreditoCreate, LineaCredito, LineaCreditoUpdate,
# LineaCreditoUsoBase, LineaCreditoUsoCreate, LineaCreditoUso
# are being moved to backend/app/schemas.py

router = APIRouter(prefix="/api/tables", tags=["tables"])

def format_table_name(name: str) -> str:
    """Convert a display name to a URL-friendly table name"""
    # Convert to lowercase
    name = name.lower()
    # Replace spaces and special characters with underscores
    name = re.sub(r'[^a-z0-9]+', '_', name)
    # Remove leading/trailing underscores
    name = name.strip('_')
    return name

@router.post("/create")
async def create_table(
    project_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Create a new set of tables for a marketing budget project
    """
    try:
        # Validate project name
        if not project_name or not project_name.strip():
            raise HTTPException(
                status_code=400,
                detail="El nombre del proyecto no puede estar vacío"
            )
        
        # Convert project name to URL-friendly format
        project_name = format_table_name(project_name)
        
        if not project_name:  # In case the name becomes empty after formatting
            raise HTTPException(
                status_code=400,
                detail="El nombre del proyecto debe contener al menos un carácter válido"
            )
        
        # Define all the table names for this project
        table_names = [
            f"presupuesto_mercadeo_{project_name}_casa_modelo",
            f"presupuesto_mercadeo_{project_name}_ferias_eventos",
            f"presupuesto_mercadeo_{project_name}_gastos_casa_modelo",
            f"presupuesto_mercadeo_{project_name}_gastos_publicitarios",
            f"presupuesto_mercadeo_{project_name}_gastos_tramites",
            f"presupuesto_mercadeo_{project_name}_promociones_y_bonos",
            f"presupuesto_mercadeo_{project_name}_redes_sociales"
        ]
        
        existing_tables = db.execute(
            text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY(:table_names)
            """),
            {"table_names": table_names}
        ).fetchall()
        
        if existing_tables:
            existing_names = ", ".join([t[0] for t in existing_tables])
            raise HTTPException(
                status_code=400,
                detail=f"Ya existen tablas con estos nombres: {existing_names}"
            )
        
        # Create all tables
        for table in table_names:
            db.execute(
                text(f"""
                CREATE TABLE {table} (
                    id SERIAL PRIMARY KEY,
                    categoria VARCHAR(255) NOT NULL,
                    actividad VARCHAR(255) NOT NULL,
                    enero NUMERIC(15, 2) DEFAULT 0,
                    febrero NUMERIC(15, 2) DEFAULT 0,
                    marzo NUMERIC(15, 2) DEFAULT 0,
                    abril NUMERIC(15, 2) DEFAULT 0,
                    mayo NUMERIC(15, 2) DEFAULT 0,
                    junio NUMERIC(15, 2) DEFAULT 0,
                    julio NUMERIC(15, 2) DEFAULT 0,
                    agosto NUMERIC(15, 2) DEFAULT 0,
                    septiembre NUMERIC(15, 2) DEFAULT 0,
                    octubre NUMERIC(15, 2) DEFAULT 0,
                    noviembre NUMERIC(15, 2) DEFAULT 0,
                    diciembre NUMERIC(15, 2) DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )""")
            )
            
            # Create a view for each table
            db.execute(
                text(f"""
                CREATE OR REPLACE VIEW v_{table}_consolidado AS
                SELECT 
                    categoria,
                    actividad,
                    COALESCE(enero, 0) AS enero,
                    COALESCE(febrero, 0) AS febrero,
                    COALESCE(marzo, 0) AS marzo,
                    COALESCE(abril, 0) AS abril,
                    COALESCE(mayo, 0) AS mayo,
                    COALESCE(junio, 0) AS junio,
                    COALESCE(julio, 0) AS julio,
                    COALESCE(agosto, 0) AS agosto,
                    COALESCE(septiembre, 0) AS septiembre,
                    COALESCE(octubre, 0) AS octubre,
                    COALESCE(noviembre, 0) AS noviembre,
                    COALESCE(diciembre, 0) AS diciembre
                FROM {table}
                """)
            )
        
        # Create a consolidated view
        db.execute(
            text(f"""
            CREATE OR REPLACE VIEW v_presupuesto_mercadeo_{project_name}_consolidado AS
            SELECT * FROM v_presupuesto_mercadeo_{project_name}_gastos_publicitarios_consolidado
            UNION ALL
            SELECT * FROM v_presupuesto_mercadeo_{project_name}_gastos_casa_modelo_consolidado
            UNION ALL
            SELECT * FROM v_presupuesto_mercadeo_{project_name}_ferias_eventos_consolidado
            UNION ALL
            SELECT * FROM v_presupuesto_mercadeo_{project_name}_redes_sociales_consolidado
            UNION ALL
            SELECT * FROM v_presupuesto_mercadeo_{project_name}_promociones_bonos_consolidado
            UNION ALL
            SELECT * FROM v_presupuesto_mercadeo_{project_name}_gastos_tramites_consolidado
            """)
        )
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Tablas para '{project_name}' creadas exitosamente",
            "tables_created": table_names,
            "display_name": project_name,
            "table_name": project_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating table: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la tabla: {str(e)}"
        )

@router.get("/list")
async def list_tables(db: Session = Depends(auth.get_db)):
    """
    List all relevant raw table names for project discovery on the frontend.
    """
    try:
        # Get all tables that might be part of a project structure
        # This includes tables created by the new system (presupuesto_mercadeo_KEYWORD_suffix)
        # and potentially older patterns if still relevant.
        result = db.execute(
            text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (
                table_name LIKE 'proyecto_%' OR
                table_name LIKE 'presupuesto_mercadeo_%' 
            )
            ORDER BY table_name;
            """)
        ).fetchall()
        
        print(f"[LIST_TABLES_DEBUG] Raw query result (fetchall): {result}") # ADDED DEBUG
        
        tables = [row[0] for row in result] # Extract table names from result
        print(f"[LIST_TABLES_DEBUG] Processed tables list: {tables}") # ADDED DEBUG
        
        return {"tables": tables} # Return as a dictionary with a "tables" key
        
    except Exception as e:
        print(f"Error listing tables: {e}") # Add logging
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar las tablas: {str(e)}"
        )

@router.get("/{table_name}/data")
async def get_table_data(
    table_name: str, 
    planned_month: str | None = None,
    db: Session = Depends(auth.get_db)
):
    """
    Get all data for a specific table.
    Returns column names and data as a list of lists.
    For 'inversion_mercadeo', can be filtered by 'planned_month' (YYYY-MM).
    """
    try:
        if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
            raise HTTPException(status_code=400, detail="Invalid table name format.")

        # Check if table/view exists
        table_exists_query = text(
            "SELECT EXISTS ("
            "    SELECT 1"
            "    FROM information_schema.tables"
            "    WHERE table_schema = 'public'"
            "    AND (table_name = :table_name OR table_name = :view_name)"
            ")"
        )
        table_exists = db.execute(
            table_exists_query, 
            {"table_name": table_name, "view_name": table_name.lower()}
        ).scalar()

        if not table_exists:
            raise HTTPException(status_code=404, detail=f"Table/View '{table_name}' not found in public schema.")

        # Get columns
        columns_query_sql = (
            "SELECT column_name "
            "FROM information_schema.columns "
            "WHERE table_schema = 'public' "
            "AND table_name = :table_name "
            "ORDER BY ordinal_position"
        )
        columns_result = db.execute(text(columns_query_sql), {"table_name": table_name.lower()}).fetchall()
        columns = [col[0] for col in columns_result]

        # Build the query
        if table_name == "inversion_mercadeo" and planned_month:
            # Special handling for inversion_mercadeo with planned_month filter
            query = text(f"SELECT * FROM {table_name} WHERE planned_month = :planned_month")
            result = db.execute(query, {"planned_month": planned_month})
        else:
            # General case for all other tables/views
            query = text(f"SELECT * FROM {table_name}")
            result = db.execute(query)

        # Convert rows to list of dicts
        rows = []
        for row in result:
            row_dict = {}
            for idx, col in enumerate(columns):
                value = row[idx]
                # Handle Decimal type conversion
                if isinstance(value, Decimal):
                    value = float(value)
                row_dict[col] = value
            rows.append(row_dict)

        return {
            "columns": columns,
            "data": rows
        }

    except HTTPException:  # Specifically catch and re-raise HTTPExceptions
        raise
    except Exception as e: # Catch other, unexpected errors (e.g., actual database operational errors)
        # Consider logging the full traceback here for server-side debugging
        # import traceback
        # traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while fetching data for table '{table_name}'. Error: {str(e)}")

@router.post("/{table_name}/rows", status_code=201)
async def add_table_row(
    table_name: str,
    row_data: Dict[str, Any],
    db: Session = Depends(auth.get_db)
):
    print(f"\n[ADD_ROW_DEBUG] Timestamp: {datetime.utcnow()}") # Added timestamp for clarity
    print(f"[ADD_ROW_DEBUG] Attempting to add row to table: '{table_name}'") 
    print(f"[ADD_ROW_DEBUG] Received row_data from frontend: {row_data}") 
    try:
        if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
            raise HTTPException(status_code=400, detail="Invalid table name format.")

        table_exists_query = text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :table_name)"
        )
        if not db.execute(table_exists_query, {"table_name": table_name}).scalar():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")

        columns_query_sql = (
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = :table_name ORDER BY ordinal_position"
        )
        db_columns_result = db.execute(text(columns_query_sql), {"table_name": table_name}).fetchall()
        db_columns = [row[0] for row in db_columns_result]
        print(f"[ADD_ROW_DEBUG] Actual DB columns found for '{table_name}': {db_columns}") 

        if not db_columns:
            raise HTTPException(status_code=404, detail=f"No columns found for table '{table_name}'.")
        
        # Filter data to only include actual DB columns, excluding id/timestamps
        # This is where mismatches between frontend keys and DB column names become critical.
        data_to_insert = {
            k: v for k, v in row_data.items() 
            if k in db_columns and k not in ['id', 'created_at', 'updated_at']
        }
        print(f"[ADD_ROW_DEBUG] Data prepared for insert (data_to_insert): {data_to_insert}") 

        if not data_to_insert:
            # Log which keys from frontend didn't match db columns or were excluded
            mismatched_or_excluded_keys = [
                k for k in row_data.keys() 
                if k not in db_columns or k in ['id', 'created_at', 'updated_at']
            ]
            # Also log keys from row_data that are NOT in db_columns to specifically identify mismatches
            keys_not_in_db = [k for k in row_data.keys() if k not in db_columns]
            print(f"[ADD_ROW_DEBUG] No valid data for insertion.")
            print(f"[ADD_ROW_DEBUG] Frontend keys from row_data: {list(row_data.keys())}")
            print(f"[ADD_ROW_DEBUG] Keys from row_data that were NOT found in DB columns (excluding id/timestamps): {keys_not_in_db}")
            print(f"[ADD_ROW_DEBUG] All mismatched or excluded keys: {mismatched_or_excluded_keys}")
            raise HTTPException(status_code=400, detail=f"No valid data provided for insertion. Check if frontend keys match DB columns. Mismatched/excluded keys: {keys_not_in_db}")

        # Handle timestamps
        if 'updated_at' in db_columns:
            data_to_insert['updated_at'] = datetime.utcnow()
        # Only set created_at if it doesn't have a DB default for 'created_at'
        if 'created_at' in db_columns:
            created_at_default_check = db.execute(
                text("SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :table_name AND column_name = 'created_at'"),
                {"table_name": table_name}
            ).scalar()
            if created_at_default_check is None: # No DB default for created_at
                print(f"[ADD_ROW_DEBUG] Setting 'created_at' as no DB default found.")
                data_to_insert['created_at'] = datetime.utcnow()
            else:
                print(f"[ADD_ROW_DEBUG] Not setting 'created_at' as DB default '{created_at_default_check}' exists.")
        
        cols_to_insert = list(data_to_insert.keys()) 
        placeholders = [f":{col}" for col in cols_to_insert]
        
        # Quote column names in SQL query as they come directly from db_columns 
        # (which are actual names and might contain spaces, mixed case, or reserved words)
        quoted_cols_to_insert = [f'\"{col}\"' for col in cols_to_insert]

        insert_sql = f"""
            INSERT INTO public.\"{table_name}\" ({", ".join(quoted_cols_to_insert)})
            VALUES ({", ".join(placeholders)})
            RETURNING id, {", ".join(quoted_cols_to_insert)}; 
        """ 
        print(f"[ADD_ROW_DEBUG] Executing INSERT SQL: {insert_sql}") 
        print(f"[ADD_ROW_DEBUG] Parameters for INSERT: {data_to_insert}")

        inserted_row_prox = db.execute(text(insert_sql), data_to_insert).fetchone()
        db.commit()
        print(f"[ADD_ROW_DEBUG] Inserted row proxy (raw from DB after commit): {inserted_row_prox}") 

        if not inserted_row_prox:
            print(f"[ADD_ROW_DEBUG] ERROR: Insert operation returned no data (inserted_row_prox is None).")
            raise HTTPException(status_code=500, detail="Failed to insert row or retrieve inserted data.")
        
        # The keys in inserted_row_prox will match the column names as defined in the DB (e.g., lowercase)
        # Map them to the `cols_to_insert` which are also from db_columns.
        expected_returned_keys_in_order = ['id'] + cols_to_insert 
        
        # Ensure the number of values matches the number of expected keys
        if len(inserted_row_prox) != len(expected_returned_keys_in_order):
            print(f"[ADD_ROW_DEBUG] ERROR: Number of values in inserted_row_prox ({len(inserted_row_prox)}) does not match number of expected keys ({len(expected_returned_keys_in_order)}).")
            print(f"[ADD_ROW_DEBUG] inserted_row_prox values: {list(inserted_row_prox)}")
            print(f"[ADD_ROW_DEBUG] expected_returned_keys_in_order: {expected_returned_keys_in_order}")
            # Fallback or raise error, for now, try to construct with what we have if lengths mismatch but it's risky
            # This part might need adjustment based on how RowProxy behaves with quoted names in RETURNING
            # For now, assume it's ordered correctly as per RETURNING clause.
            
        inserted_row_dict = dict(zip(expected_returned_keys_in_order, list(inserted_row_prox)))
        print(f"[ADD_ROW_DEBUG] Successfully inserted row (constructed dict): {inserted_row_dict}") 
        
        return {"message": "Row added successfully", "data": inserted_row_dict}

    except HTTPException:
        db.rollback()
        # No need to print here, FastAPI handles logging HTTPExceptions
        raise
    except Exception as e:
        db.rollback()
        print(f"[ADD_ROW_DEBUG] EXCEPTION during add_table_row for table '{table_name}':") 
        import traceback 
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Error al agregar fila: {str(e)}")

@router.put("/{table_name}/rows/{row_id}")
async def update_table_row(
    table_name: str,
    row_id: int,
    data: Dict[str, Any],
    db: Session = Depends(auth.get_db)
):
    try:
        if not re.match(r"^[a-zA-Z0-9_]+$", table_name): # Basic validation for table_name
            raise HTTPException(status_code=400, detail="Invalid table name format.")

        # Check if table exists
        table_exists_query = text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :table_name)")
        if not db.execute(table_exists_query, {"table_name": table_name}).scalar():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")

        # Fetch column names for the table
        columns_query = text("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = :table_name")
        db_columns_result = db.execute(columns_query, {"table_name": table_name}).fetchall()
        db_columns = [row[0] for row in db_columns_result]

        if not db_columns:
             raise HTTPException(status_code=404, detail=f"No columns found for table '{table_name}'. Cannot update.")

        # Filter out keys not in db_columns, and 'id' (primary key, should not be updated via this method)
        # 'created_at' should also generally not be updated.
        data_to_update = {k: v for k, v in data.items() if k in db_columns and k not in ['id', 'created_at']}

        # Ensure 'updated_at' is set if the column exists
        if 'updated_at' in db_columns:
            data_to_update['updated_at'] = datetime.utcnow() # Use a consistent timestamp

        if not data_to_update:
            raise HTTPException(status_code=400, detail="No valid data provided for update or data keys do not match table columns.")

        set_clause = ", ".join([f'\"{col}\" = :{col}' for col in data_to_update.keys()])
        
        # Check if row exists before updating
        # Assuming 'id' is the primary key. If not, this needs adjustment.
        row_exists_query = text(f'SELECT EXISTS (SELECT 1 FROM public.\"{table_name}\" WHERE id = :row_id)')
        if not db.execute(row_exists_query, {"row_id": row_id}).scalar():
            raise HTTPException(status_code=404, detail=f"Row with id {row_id} not found in table '{table_name}'.")

        update_sql = f'UPDATE public.\"{table_name}\" SET {set_clause} WHERE id = :row_id RETURNING *;'
        
        params = data_to_update.copy()
        params['row_id'] = row_id
        
        updated_row_prox = db.execute(text(update_sql), params).fetchone()
        db.commit()

        if not updated_row_prox:
            # This case might be redundant if row_exists_query is reliable and commit is successful
            # but good for robustness if RETURNING * didn't yield anything unexpectedly.
            raise HTTPException(status_code=500, detail="Failed to update row or retrieve updated data.")

        # Convert RowProxy to dictionary. The columns returned by RETURNING * should match db_columns.
        updated_row_dict = {col: getattr(updated_row_prox, col) for col in db_columns if hasattr(updated_row_prox, col)}

        return {"message": "Row updated successfully", "data": updated_row_dict}

    except HTTPException:
        db.rollback()
        raise # Re-raise HTTPException to preserve status code and detail
    except Exception as e:
        db.rollback()
        print(f"Error updating row {row_id} in {table_name}: {e}") # Log the error
        raise HTTPException(status_code=500, detail=f"Error al actualizar fila: {str(e)}")

@router.delete("/{table_name}/rows/{row_id}")
async def delete_table_row(
    table_name: str, 
    row_id: int, 
    db: Session = Depends(auth.get_db)
):
    """Delete a specific row from a table by its ID."""
    # Basic validation for table_name to prevent obvious SQL injection vectors
    # A more robust solution would involve checking against a list of allowed table names
    # or using a library that safely formats SQL identifiers.
    if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
        raise HTTPException(status_code=400, detail=f"Invalid table name format: {table_name}")

    try:
        # Check if the row exists
        # Assuming the primary key column is named 'id'. 
        # If it can be different, this logic needs to be more dynamic.
        check_stmt = text(f'SELECT 1 FROM "{table_name}" WHERE id = :id')
        result = db.execute(check_stmt, {"id": row_id})
        if result.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Row with ID {row_id} not found in table {table_name}")

        # Delete the row
        stmt = text(f'DELETE FROM "{table_name}" WHERE id = :id')
        db.execute(stmt, {"id": row_id})
        db.commit()
        return {"message": f"Row with ID {row_id} deleted successfully from table {table_name}"}
    except HTTPException: # Re-raise HTTPException if it was raised intentionally
        raise
    except Exception as e:
        db.rollback()
        # Log the error for debugging
        print(f"Error deleting row {row_id} from table {table_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting row: {str(e)}")

@router.delete("/{table_name}")
async def delete_table(
    table_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Delete a table and all its associated views
    """
    try:
        print(f"Starting deletion of table: {table_name}")
        
        # First verify the table exists
        table_exists = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
            )
            """),
            {"table_name": table_name}
        ).scalar()
        
        print(f"Table {table_name} exists: {table_exists}")
        
        if not table_exists:
            raise HTTPException(
                status_code=404,
                detail=f"Table {table_name} not found"
            )
        
        # Find and drop all views that reference this table
        print("Looking for views that reference this table...")
        views = db.execute(
            text("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            AND definition LIKE :table_pattern
            """),
            {"table_pattern": f"%{table_name}%"}
        ).fetchall()
        
        print(f"Found {len(views)} views that reference this table")
        
        # Drop all related views first
        for view in views:
            view_name = view[0]
            try:
                print(f"Dropping view: {view_name}")
                db.execute(text(f'DROP VIEW IF EXISTS \"{view_name}\" CASCADE'))
                db.commit()
                print(f"Successfully dropped view: {view_name}")
            except Exception as e:
                db.rollback()
                print(f"Error dropping view {view_name}: {e}")
                # Continue even if view drop fails
        
        # Drop the table
        try:
            print(f"Dropping table: {table_name}")
            db.execute(text(f'DROP TABLE IF EXISTS \"{table_name}\" CASCADE'))
            db.commit()
            print(f"Successfully dropped table: {table_name}")
            
            return {
                "success": True,
                "message": f"Table {table_name} and its associated views have been deleted"
            }
            
        except Exception as e:
            db.rollback()
            print(f"Error dropping table {table_name}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Error dropping table: {str(e)}"
            )
        
    except HTTPException as he:
        print(f"HTTP Exception: {he.detail}")
        raise
    except Exception as e:
        db.rollback()
        print(f"Unexpected error in delete_table: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error deleting table: {str(e)}"
        )

ALLOWED_MONTH_COLUMNS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

@router.get("/{table_name}/sum/{month_column_name}")
async def get_table_column_sum(
    table_name: str,
    month_column_name: str,
    db: Session = Depends(auth.get_db)
):
    """Get the sum of a specific numeric column for a table."""
    # print(f"[SUM_DEBUG] Attempting to sum column: '{month_column_name}' for table: '{table_name}'") # Removed

    if not re.match(r"^[a-zA-Z0-9_]+$", table_name):
        raise HTTPException(status_code=400, detail=f"Invalid table name format: {table_name}")
    
    if month_column_name.lower() not in ALLOWED_MONTH_COLUMNS:
        raise HTTPException(status_code=400, detail=f"Invalid or not allowed month column name: {month_column_name}")

    try:
        # Check if the table exists
        table_exists_query = text(
            "SELECT EXISTS ("
            "    SELECT 1"
            "    FROM information_schema.tables"
            "    WHERE table_schema = 'public'"
            "    AND table_name = :table_name"
            ")"
        )
        table_exists = db.execute(table_exists_query, {"table_name": table_name}).scalar()
        # print(f"[SUM_DEBUG] Table '{table_name}' exists: {table_exists}") # Removed
        if not table_exists:
            # raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found (debug check).") # Reverted
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")

        # Check if the column exists in the table and is numeric
        column_check_query = text(
            # "SELECT column_name, data_type " # Reverted
            "SELECT data_type "
            "FROM information_schema.columns "
            "WHERE table_schema = 'public' "
            "AND table_name = :table_name "
            "AND column_name = :column_name"
        )
        target_column_name = month_column_name.lower()
        # column_info_result = db.execute(column_check_query, {"table_name": table_name, "column_name": target_column_name}).fetchone() # Reverted
        column_info = db.execute(column_check_query, {"table_name": table_name, "column_name": target_column_name}).fetchone()
        
        # print(f"[SUM_DEBUG] Column info for '{target_column_name}' in '{table_name}': {column_info_result}") # Removed

        # if not column_info_result: # Reverted
        if not column_info:
            # raise HTTPException(status_code=404, detail=f"[DEBUG] Column '{target_column_name}' (queried as lowercase) not found in table '{table_name}'.") # Reverted
            raise HTTPException(status_code=404, detail=f"Column '{target_column_name}' not found in table '{table_name}'.")
        
        # column_db_name, column_data_type = column_info_result # Reverted
        column_data_type = column_info[0]

        if not any(numeric_type in column_data_type.lower() for numeric_type in ["numeric", "decimal", "integer", "bigint", "smallint", "real", "double precision"]):
            # raise HTTPException(status_code=400, detail=f"Column '{target_column_name}' is not of a summable numeric type (type: {column_data_type}).") # Reverted
            raise HTTPException(status_code=400, detail=f"Column '{target_column_name}' is not of a summable numeric type.")

        sum_query = text(f'SELECT SUM("{target_column_name}") FROM "{table_name}"')
        total_sum = db.execute(sum_query).scalar()
        
        return {"table_name": table_name, "month_column": month_column_name, "sum": total_sum if total_sum is not None else 0}
        
    except HTTPException: # Re-raise HTTPException directly
        raise
    except Exception as e:
        print(f"Error calculating sum for column {month_column_name} in table {table_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating sum: {str(e)}")

@router.get("/inversion_mercadeo/current_month_sum")
async def get_inversion_mercadeo_current_month_sum(
    db: Session = Depends(auth.get_db)
):
    """Calculate the sum of 'monto' from 'inversion_mercadeo' for the current month based on 'created_at'."""
    try:
        # Get the first and last day of the current month
        today = date.today() # Corrected: use date.today()
        first_day_current_month = today.replace(day=1)
        
        if today.month == 12:
            # Corrected: use timedelta directly
            last_day_current_month = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1) 
        else:
            # Corrected: use timedelta directly
            last_day_current_month = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

        print("DEBUG: start_date =", first_day_current_month, "end_date =", last_day_current_month)
        sum_query = text("""
            SELECT SUM(monto)
            FROM inversion_mercadeo
            WHERE created_at::date >= :start_date
            AND created_at::date <= :end_date
        """)
        total_sum = db.execute(sum_query, {
            "start_date": first_day_current_month,
            "end_date": last_day_current_month
        }).scalar()
        print("DEBUG: total_sum =", total_sum)
        
        return {"total_sum": total_sum if total_sum is not None else 0}

    except Exception as e:
        print(f"Error calculating current month sum for inversion_mercadeo: {e}")
        # Consider logging the full error with traceback
        # import traceback
        # traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error calculating sum for current month: {str(e)}")

@router.post("/marketing_proyectos", response_model=MarketingProyecto, status_code=201)
async def create_marketing_proyecto(
    marketing_proyecto_data: MarketingProyectoCreate, # Changed from MarketingProyecto
    db: Session = Depends(auth.get_db)
):
    try:
        # Check if the marketing_proyectos table exists, create if not
        # This is a good spot for such a check, or do it once at app startup
        try:
            db.execute(text("SELECT 1 FROM marketing_proyectos LIMIT 1"))
        except Exception: 
            db.rollback()
            db.execute(text("""
                CREATE TABLE marketing_proyectos (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            db.commit()
            print("Created marketing_proyectos table in POST because it did not exist.")

        new_proyecto = text("""
            INSERT INTO marketing_proyectos (nombre)
            VALUES (:nombre)
            RETURNING id, nombre, created_at, updated_at
        """)
        result = db.execute(new_proyecto, {"nombre": marketing_proyecto_data.nombre})
        db.commit()
        created_proyecto = result.fetchone()
        if not created_proyecto:
            raise HTTPException(status_code=500, detail="Failed to create marketing proyecto")
        
        # Manually map to dictionary if Pydantic v2 and from_attributes is being tricky
        # return MarketingProyecto(id=created_proyecto[0], nombre=created_proyecto[1], created_at=created_proyecto[2], updated_at=created_proyecto[3])
        return MarketingProyecto.from_orm(created_proyecto)


    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        # Check for unique constraint violation (specific to PostgreSQL)
        if "unique constraint" in str(e).lower() and "marketing_proyectos_nombre_key" in str(e).lower():
             raise HTTPException(
                status_code=409, # Conflict
                detail=f"Ya existe un proyecto de marketing con el nombre '{marketing_proyecto_data.nombre}'."
            )
        print(f"Error creating marketing proyecto: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno al crear el proyecto de marketing: {str(e)}"
        )

@router.get("/marketing_proyectos", response_model=List[MarketingProyecto])
async def list_marketing_proyectos(db: Session = Depends(auth.get_db)):
    try:
        # Check if the marketing_proyectos table exists, create if not
        try:
            db.execute(text("SELECT 1 FROM marketing_proyectos LIMIT 1"))
        except Exception:
            db.rollback()
            db.execute(text("""
                CREATE TABLE marketing_proyectos (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            db.commit()
            print("Created marketing_proyectos table in GET because it did not exist.")
            return [] # Return empty list as table was just created

        query = text("SELECT id, nombre, created_at, updated_at FROM marketing_proyectos ORDER BY nombre")
        result = db.execute(query).fetchall()
        # return [MarketingProyecto(id=row[0], nombre=row[1], created_at=row[2], updated_at=row[3]) for row in result]
        return [MarketingProyecto.from_orm(row) for row in result]
    except Exception as e:
        print(f"Error listing marketing proyectos: {e}")
        raise HTTPException(status_code=500, detail=f"Error al listar los proyectos de marketing: {str(e)}")

@router.delete("/marketing_proyectos/{proyecto_id}", status_code=200)
async def delete_marketing_proyecto(
    proyecto_id: int,
    db: Session = Depends(auth.get_db)
):
    """
    Delete a marketing proyecto by ID
    """
    try:
        # Check if the proyecto exists
        result = db.execute(
            text("SELECT id, nombre FROM marketing_proyectos WHERE id = :proyecto_id"),
            {"proyecto_id": proyecto_id}
        )
        proyecto = result.fetchone()
        
        if not proyecto:
            raise HTTPException(
                status_code=404,
                detail=f"Marketing proyecto with ID {proyecto_id} not found"
            )
        
        # Delete the proyecto
        db.execute(
            text("DELETE FROM marketing_proyectos WHERE id = :proyecto_id"),
            {"proyecto_id": proyecto_id}
        )
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Marketing proyecto '{proyecto.nombre}' deleted successfully",
            "deleted_proyecto": {
                "id": proyecto.id,
                "nombre": proyecto.nombre
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting marketing proyecto: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting marketing proyecto: {str(e)}"
        )

# Marketing Summary View Endpoints
@router.get("/marketing-summary-view/{view_name}")
async def get_marketing_summary_view(
    view_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Get data from marketing summary views (chepo, tanara, consolidado)
    """
    try:
        # Map view names to actual database view names
        view_mapping = {
            "vista_presupuesto_mercadeo_chepo_resumen": "vista_presupuesto_mercadeo_chepo_resumen",
            "vista_presupuesto_mercadeo_tanara_resumen": "vista_presupuesto_mercadeo_tanara_resumen",
            "consolidado": "vista_presupuesto_mercadeo_consolidado"
        }
        
        if view_name not in view_mapping:
            raise HTTPException(
                status_code=404,
                detail=f"View '{view_name}' not found. Available views: {list(view_mapping.keys())}"
            )
        
        actual_view_name = view_mapping[view_name]
        
        # Execute the query
        result = db.execute(text(f"SELECT * FROM {actual_view_name}"))
        rows = result.fetchall()
        
        if not rows:
            return []
        
        # Convert to list of dictionaries
        columns = result.keys()
        data = [dict(zip(columns, row)) for row in rows]
        
        return data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching marketing summary view '{view_name}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching marketing summary view: {str(e)}"
        )

# Add a separate router for marketing-summary-view endpoints
marketing_router = APIRouter(prefix="/api/marketing-summary-view", tags=["marketing-summary"])

@marketing_router.get("/consolidado")
async def get_marketing_consolidado(db: Session = Depends(auth.get_db)):
    """
    Get consolidated marketing data from vista_presupuesto_mercadeo_consolidado
    """
    try:
        result = db.execute(text("SELECT * FROM vista_presupuesto_mercadeo_consolidado"))
        row = result.fetchone()
        
        if not row:
            return []
        
        # Convert to dict for JSON response
        columns = result.keys()
        data = dict(zip(columns, row))
        
        # Generate dynamic periods: 3 months before current + 36 months forward
        from datetime import datetime, timedelta
        import calendar
        
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # Calculate start date (3 months before current)
        start_date = datetime(current_year, current_month, 1) - timedelta(days=90)
        start_date = start_date.replace(day=1)  # First day of that month
        
        # Generate 39 months (3 before + current + 35 forward)
        dynamic_data = {"categoria": data.get("categoria", "TOTAL")}
        total_sum = 0
        
        current_date = start_date
        for i in range(39):
            month_key = f"{current_date.year}_{current_date.month:02d}"
            db_key = f"amount_{current_date.year}_{current_date.month:02d}"
            
            # Get value from database if it exists, otherwise 0
            value = data.get(db_key, 0) if db_key in data else 0
            dynamic_data[month_key] = value
            total_sum += float(value) if value else 0
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        dynamic_data["total"] = total_sum
        
        return [dynamic_data]  # Return as array since frontend expects an array
        
    except Exception as e:
        print(f"Error fetching consolidated marketing data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching consolidated marketing data: {str(e)}"
        )

@marketing_router.get("/{view_name}")
async def get_marketing_view_data(
    view_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Get data from specific marketing summary views with dynamic periods
    """
    try:
        # Map view names to actual database view names
        view_mapping = {
            "vista_presupuesto_mercadeo_chepo_resumen": "vista_presupuesto_mercadeo_chepo_resumen",
            "vista_presupuesto_mercadeo_tanara_resumen": "vista_presupuesto_mercadeo_tanara_resumen"
        }
        
        if view_name not in view_mapping:
            raise HTTPException(
                status_code=404,
                detail=f"View '{view_name}' not found. Available views: {list(view_mapping.keys())}"
            )
        
        actual_view_name = view_mapping[view_name]
        
        # Execute the query
        result = db.execute(text(f"SELECT * FROM {actual_view_name}"))
        rows = result.fetchall()
        
        if not rows:
            return []
        
        # Convert to list of dictionaries
        columns = result.keys()
        raw_data = [dict(zip(columns, row)) for row in rows]
        
        # Transform each row to dynamic periods
        from datetime import datetime, timedelta
        
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        
        # Calculate start date (3 months before current)
        start_date = datetime(current_year, current_month, 1) - timedelta(days=90)
        start_date = start_date.replace(day=1)  # First day of that month
        
        transformed_data = []
        for row in raw_data:
            # Generate 39 months (3 before + current + 35 forward)
            dynamic_row = {"categoria": row.get("categoria", "")}
            total_sum = 0
            
            current_date = start_date
            for i in range(39):
                month_key = f"{current_date.year}_{current_date.month:02d}"
                db_key = f"amount_{current_date.year}_{current_date.month:02d}"
                
                # Get value from database if it exists, otherwise 0
                value = row.get(db_key, 0) if db_key in row else 0
                dynamic_row[month_key] = value
                total_sum += float(value) if value else 0
                
                # Move to next month
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            dynamic_row["total"] = total_sum
            transformed_data.append(dynamic_row)
        
        return transformed_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching marketing view '{view_name}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching marketing view: {str(e)}"
        )

@marketing_router.get("/consolidated-cash-flow")
async def get_consolidated_cash_flow(db: Session = Depends(auth.get_db)):
    """
    Get consolidated cash flow data from all 'presupuesto_mercadeo_...' tables
    with dynamic period selection.
    """
    try:
        # Get all marketing budget tables
        tables_result = db.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'presupuesto_mercadeo_%'"
        )).fetchall()
        marketing_tables = [t[0] for t in tables_result]
        print(f"[DEBUG] Found marketing tables: {marketing_tables}")

        # Generate dynamic period columns (3 months before current + 36 forward)
        now = datetime.now()
        months = []
        for i in range(-3, 36):
            month_date = now + timedelta(days=i * 30) # Approximate
            month_date = datetime(now.year, now.month, 1) + relativedelta(months=i)
            months.append(f"amount_{month_date.year}_{month_date.month:02d}")
        
        select_cols_str = ", ".join(months)
        print(f"[DEBUG] Dynamic period columns (3 months before current + 36 forward): {months}")

        # Aggregate data from all marketing tables
        consolidated_data = {}
        for table in marketing_tables:
            # Check which column exists in the current table
            db_cols_result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = :table"), {"table": table}).fetchall()
            db_cols = [c[0].lower() for c in db_cols_result]

            description_col = None
            if "concepto" in db_cols:
                description_col = '"CONCEPTO"'
            elif "actividad" in db_cols:
                description_col = '"actividad"'

            if not description_col:
                print(f'[WARNING] Skipping table {table} because it has neither "CONCEPTO" nor "actividad" column.')
                continue

            # Build and execute the query for the current table
            query_sql = f'SELECT {description_col}, {select_cols_str} FROM "{table}"'
            
            try:
                table_result = db.execute(text(query_sql)).fetchall()
                
                for row in table_result:
                    actividad = row[0]
                    if actividad not in consolidated_data:
                        consolidated_data[actividad] = {month: 0 for month in months}
                    
                    for i, month in enumerate(months):
                        consolidated_data[actividad][month] += float(row[i+1]) if row[i+1] is not None else 0
            
            except Exception as e:
                print(f"[WARNING] Error processing table {table}: {e}")
                db.rollback() # Rollback the single failed transaction to allow others to proceed
                continue

        # Convert to list of dictionaries for frontend
        response_data = []
        total_row = {"actividad": "TOTAL"}
        for month in months:
            total_row[month] = 0

        for actividad, data in consolidated_data.items():
            row_data = {"actividad": actividad, **data}
            response_data.append(row_data)
            for month in months:
                total_row[month] += data[month]
        
        response_data.append(total_row)
        
        return {
            "data": response_data,
            "columns": ["actividad"] + months
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching consolidated cash flow data: {str(e)}"
        )

