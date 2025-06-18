from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, extract
from typing import List, Optional, Dict, Any
# from ..auth import get_current_user, get_db # get_current_user no longer used here
from ..auth import get_db # Only get_db is needed now
# from ..models import User # User model no longer used here
from .. import crud, schemas, models # Added crud, schemas, models imports
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta # For easy month manipulation
import calendar # To get month names
from ..routers import vendedores # Import the vendedores router module
import json # Added for json handling

router = APIRouter(
    prefix="/api/ventas",
    tags=["ventas"]
)

# Schemas for the new endpoint
class CommissionRow(schemas.BaseModel): # Assuming schemas.BaseModel exists or use Pydantic's BaseModel
    activity_name: str
    monthly_values: List[float]
    row_total: float

class VentasCashflowProjectionResponse(schemas.BaseModel):
    month_headers: List[str]
    commission_rows: List[CommissionRow]
    group_totals: Dict[str, List[float]] # Totals for each activity group
    group_row_totals: Dict[str, float] # Row totals for each activity group
    grand_total_monthly: List[float]
    grand_total_overall: float


@router.get("/cashflow-projection", response_model=VentasCashflowProjectionResponse)
async def get_ventas_cashflow_projection(db: Session = Depends(get_db)):
    # 1. Date Calculation (3 months before current + 36 months forward = 39 months total)
    # This matches the dynamic period format used in other cash flow tables
    month_headers = []
    current_date = datetime.now()
    
    # 3 months before current
    for i in range(3, 0, -1):
        month = current_date - relativedelta(months=i)
        month_headers.append(f"{calendar.month_name[month.month].upper()} {month.year}")
    
    # Current month + 35 months forward (36 months total including current)
    for i in range(0, 36):
        month = current_date + relativedelta(months=i)
        month_headers.append(f"{calendar.month_name[month.month].upper()} {month.year}")
    
    num_months = len(month_headers)  # Should be 39 months total

    # 2. Generate period columns for database query (use same logic as commission template)
    period_columns = []
    current_date = datetime.now()
    start_date = current_date - relativedelta(months=3)
    end_date = current_date + relativedelta(months=35)  # 36 months forward including current
    
    # Generate period columns dynamically
    current_period = start_date.replace(day=1)
    while current_period <= end_date:
        period_str = f"amount_{current_period.year}_{current_period.month:02d}"
        period_columns.append(period_str)
        current_period += relativedelta(months=1)

    # 3. Fetch commission data from template table
    try:
        # Get all commission template data
        # First check what columns actually exist in the template table
        check_columns_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'plantilla_comisiones_template' 
        AND column_name LIKE 'amount_%'
        ORDER BY column_name
        """
        
        columns_result = db.execute(text(check_columns_query))
        existing_columns = [row[0] for row in columns_result.fetchall()]
        
        # Filter period_columns to only include existing columns
        valid_period_columns = [col for col in period_columns if col in existing_columns]
        
        if not valid_period_columns:
            print(f"No valid period columns found. Requested: {period_columns[:5]}..., Available: {existing_columns[:5]}...")
            # Fallback to empty data
            commission_template_data = {}
        else:
            template_query = f"""
            SELECT concepto, {', '.join(valid_period_columns)}
            FROM plantilla_comisiones_template
            ORDER BY concepto
            """
        
            result = db.execute(text(template_query))
            template_rows = result.fetchall()
            
            # Convert to dictionary for easier access
            commission_template_data = {}
            for row in template_rows:
                row_dict = dict(row._mapping)
                concepto = row_dict.pop('concepto')
                monthly_values = []
                
                # Use valid_period_columns instead of period_columns
                for col in valid_period_columns:
                    value = row_dict.get(col, 0.0)
                    monthly_values.append(float(value) if value is not None else 0.0)
                
                # Pad with zeros if we have fewer valid columns than requested periods
                while len(monthly_values) < num_months:
                    monthly_values.append(0.0)
                
                # Trim if we have more columns than requested periods
                monthly_values = monthly_values[:num_months]
                
                commission_template_data[concepto] = monthly_values
            
    except Exception as e:
        print(f"Error fetching commission template data: {e}")
        # Fallback to empty data if template table doesn't exist
        commission_template_data = {}

    # 4. Data Assembly
    commission_rows_data: List[Dict[str, Any]] = []
    
    # Get "Comisión Ventas General" from template (this is the main sales commission)
    comision_ventas_general = commission_template_data.get("Comisión Ventas General", [0.0] * num_months)
    commission_rows_data.append({
        "activity_name": "Comision Ventas",
        "monthly_values": comision_ventas_general,
        "row_total": sum(comision_ventas_general)
    })

    # Add individual salesperson commissions from template
    salesperson_commissions = []
    for concepto, monthly_values in commission_template_data.items():
        if concepto.startswith("Comisión Vendedor") or concepto == "Comision Vendedor":
            # Map template concept names to display names
            if concepto == "Comision Vendedor":
                activity_name = "Comision Vendedor"
            else:
                activity_name = concepto.replace("Comisión", "Comision")
            
            commission_rows_data.append({
                "activity_name": activity_name,
                "monthly_values": monthly_values,
                "row_total": sum(monthly_values)
            })
            salesperson_commissions.append(monthly_values)

    # Group total for "unidades vendidas" (sum of all sales commissions)
    total_unidades_vendidas_group_monthly = [0.0] * num_months
    for i in range(num_months):
        # Add general sales commission
        total_unidades_vendidas_group_monthly[i] += comision_ventas_general[i]
        # Add all salesperson commissions
        for sp_commission_list in salesperson_commissions:
            total_unidades_vendidas_group_monthly[i] += sp_commission_list[i]
    total_unidades_vendidas_group_row_total = sum(total_unidades_vendidas_group_monthly)

    # Comision captador from template
    comision_captador = commission_template_data.get("Comisión Captador", [0.0] * num_months)
    commission_rows_data.append({
        "activity_name": "Comision captador",
        "monthly_values": comision_captador,
        "row_total": sum(comision_captador)
    })
    total_clientes_captados_group_monthly = comision_captador
    total_clientes_captados_group_row_total = sum(total_clientes_captados_group_monthly)
    
    # Comision referido from template
    comision_referido = commission_template_data.get("Comisión Referido", [0.0] * num_months)
    commission_rows_data.append({
        "activity_name": "Comision referido",
        "monthly_values": comision_referido,
        "row_total": sum(comision_referido)
    })
    total_clientes_referidos_group_monthly = comision_referido
    total_clientes_referidos_group_row_total = sum(total_clientes_referidos_group_monthly)

    # Grand Totals
    grand_total_monthly = [
        total_unidades_vendidas_group_monthly[i] + 
        total_clientes_captados_group_monthly[i] + 
        total_clientes_referidos_group_monthly[i]
        for i in range(num_months)
    ]
    grand_total_overall = sum(grand_total_monthly)

    return VentasCashflowProjectionResponse(
        month_headers=month_headers,
        commission_rows=[CommissionRow(**row) for row in commission_rows_data],
        group_totals={
            "unidades_vendidas": total_unidades_vendidas_group_monthly,
            "clientes_captados": total_clientes_captados_group_monthly,
            "clientes_referidos": total_clientes_referidos_group_monthly
        },
        group_row_totals={
            "unidades_vendidas": total_unidades_vendidas_group_row_total,
            "clientes_captados": total_clientes_captados_group_row_total,
            "clientes_referidos": total_clientes_referidos_group_row_total
        },
        grand_total_monthly=grand_total_monthly,
        grand_total_overall=grand_total_overall
    )

@router.post("/refresh-comisiones-view", status_code=status.HTTP_200_OK)
async def refresh_sales_commissions_view(
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user) # Temporarily removed for testing
):
    """
    Refreshes the vista_plantilla_comisiones_venedores dynamic view.
    AUTH TEMPORARILY DISABLED FOR TESTING.
    """
    # Temporarily removed for testing
    # if not current_user: 
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Authentication required to perform this action."
    #     )
    
    try:
        db.execute(text("SELECT refresh_vista_plantilla_comisiones_venedores();"))
        db.commit()
        return {"message": "Sales commissions view refreshed successfully."}
    except Exception as e:
        db.rollback()
        print(f"Error refreshing sales commissions view: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh sales commissions view: {str(e)}"
        )

@router.get("/consolidated/cash-flow")
async def get_consolidated_ventas_cash_flow(db: Session = Depends(get_db)):
    """
    Get consolidated sales commission cash flow data with dynamic periods.
    Returns data in the same format as marketing consolidated endpoint.
    """
    try:
        # Calculate dynamic periods: 3 months before current + 36 months forward
        # But limit to the actual table structure (March 2024 to May 2027)
        current_date = datetime.now()
        start_period = current_date - relativedelta(months=3)
        
        # Ensure we don't go before March 2024 or after May 2027
        table_start = datetime(2024, 3, 1)
        table_end = datetime(2027, 5, 1)
        
        if start_period < table_start:
            start_period = table_start
        
        # Calculate 39 periods from March 2024 to May 2027
        period_columns = []
        current_period = table_start
        
        while current_period <= table_end:
            period_str = f"amount_{current_period.year}_{current_period.month:02d}"
            period_columns.append(period_str)
            current_period += relativedelta(months=1)
        
        # Get commission data from the new template table
        commission_query = f"""
        SELECT concepto as actividad, {', '.join(period_columns)}
        FROM plantilla_comisiones_template
        ORDER BY concepto
        """
        
        result = db.execute(text(commission_query))
        rows = result.fetchall()
        
        # Transform data to match frontend expectations
        data = []
        for row in rows:
            row_dict = dict(row._mapping)
            actividad = row_dict.pop('actividad')  # Use 'actividad' since that's what we aliased in SQL
            
            # Create months dictionary with proper formatting
            months = {}
            for col in period_columns:
                if col in row_dict:
                    # Extract year and month from column name
                    year_month = col.replace('amount_', '')
                    months[year_month] = float(row_dict[col] or 0)
            
            data.append({
                "concepto": actividad,  # Still use 'concepto' for frontend compatibility
                "months": months
            })
        
        # Calculate TOTAL row
        total_months = {}
        for period in period_columns:
            year_month = period.replace('amount_', '')
            total_months[year_month] = sum(
                float(row.get(period, 0) or 0) for row in [dict(r._mapping) for r in rows]
            )
        
        # Add TOTAL row
        data.append({
            "concepto": "TOTAL",
            "months": total_months
        })
        
        # Group periods by year for frontend tabs
        period_groups = {}
        for period in period_columns:
            year_month = period.replace('amount_', '')
            year, month = year_month.split('_')
            year = int(year)
            
            if year not in period_groups:
                period_groups[year] = {
                    "start_month": month,
                    "end_month": month,
                    "periods": []
                }
            
            period_groups[year]["end_month"] = month
            period_groups[year]["periods"].append(year_month)
        
        # Format period group names
        formatted_groups = {}
        for year, group_info in period_groups.items():
            start_month_name = calendar.month_name[int(group_info["start_month"])]
            end_month_name = calendar.month_name[int(group_info["end_month"])]
            
            if group_info["start_month"] == group_info["end_month"]:
                group_name = f"{start_month_name} {year}"
            else:
                group_name = f"{start_month_name} - {end_month_name} {year}"
            
            formatted_groups[group_name] = group_info["periods"]
        
        return {
            "data": data,
            "period_groups": formatted_groups
        }
        
    except Exception as e:
        print(f"Error in get_consolidated_ventas_cash_flow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving consolidated sales cash flow: {str(e)}"
        )

@router.get("/plantilla-comisiones/", status_code=status.HTTP_200_OK)
def get_plantilla_comisiones(
    db: Session = Depends(get_db),
    year: int = Query(..., description="Year to filter by"),
    month: int = Query(..., description="Month to filter by (1-12)")
):
    """
    Get commission data for a specific year and month.
    """
    try:
        # Build query to get commission data for the specified month
        query = f"""
        SELECT id, actividad, amount_{year}_{month:02d} as amount, created_at, updated_at
        FROM plantilla_comisiones_template
        WHERE amount_{year}_{month:02d} IS NOT NULL
        ORDER BY id
        """
        
        result = db.execute(text(query))
        rows = result.fetchall()
        
        # Transform to expected format
        records = []
        for row in rows:
            records.append({
                "id": row[0],
                "actividad": row[1],
                "amount": float(row[2]) if row[2] is not None else 0.0,
                "created_at": row[3],
                "updated_at": row[4]
            })
        
        return records
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching commission data: {str(e)}"
        )

# CRUD Endpoints for plantilla_comisiones_ventas table

@router.post("/plantilla-comisiones/", status_code=status.HTTP_201_CREATED)
def create_comision_record(
    data: dict, db: Session = Depends(get_db)
):
    """
    Create a new commission record with full sales structure.
    """
    try:
        # Validate required fields
        if not data.get("fecha_venta"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="fecha_venta field is required"
            )
        
        # Build insert query with all possible fields
        fields = []
        values = []
        params = {}
        
        # Map all the possible fields from the full structure
        field_mappings = {
            'entidad': 'entidad',
            'etapa': 'etapa', 
            'inmueble': 'inmueble',
            'modelo': 'modelo',
            'n_proceso_entrega': 'n_proceso_entrega',
            'contrato_firmado_con': 'contrato_firmado_con',
            'nombre_del_banco': 'nombre_del_banco',
            'identificacion': 'identificacion',
            'ingreso': 'ingreso',
            'fecha_empleo': 'fecha_empleo',
            'tiempo_trabajando': 'tiempo_trabajando',
            'profesion': 'profesion',
            'fecha_ingreso_al': 'fecha_ingreso_al',
            'cotitular': 'cotitular',
            'vendedor': 'vendedor',
            'fecha_reserva': 'fecha_reserva',
            'servicio': 'servicio',
            'cpf': 'cpf',
            'importe_cpf': 'importe_cpf',
            'fecha_venta': 'fecha_venta',
            'fecha_ingreso_etapa': 'fecha_ingreso_etapa',
            'ultima_etapa': 'ultima_etapa',
            'responsable': 'responsable',
            'personal_comisiones': 'personal_comisiones',
            'cliente': 'cliente',
            'producto_servicio': 'producto_servicio',
            'monto_venta': 'monto_venta'
        }
        
        for field_name, db_column in field_mappings.items():
            if field_name in data and data[field_name] is not None:
                fields.append(db_column)
                values.append(f":{field_name}")
                
                # Handle special data types
                if field_name == 'personal_comisiones':
                    params[field_name] = json.dumps(data[field_name]) if data[field_name] else '{}'
                elif field_name in ['monto_venta', 'importe_cpf']:
                    params[field_name] = float(data[field_name]) if data[field_name] else 0.0
                else:
                    params[field_name] = data[field_name]
        
        if not fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided"
            )
        
        # Insert new record
        insert_query = f"""
        INSERT INTO plantilla_comisiones_ventas_old_backup ({', '.join(fields)}) 
        VALUES ({', '.join(values)}) 
        RETURNING id
        """
        
        result = db.execute(text(insert_query), params)
        db.commit()
        
        new_id = result.scalar()
        return {"id": new_id, "message": "Commission record created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating commission record: {str(e)}"
        )

@router.get("/plantilla-comisiones/{comision_id}", status_code=status.HTTP_200_OK)
def read_comision_record(comision_id: int, db: Session = Depends(get_db)):
    """
    Get a specific commission record with full sales structure.
    """
    try:
        # First try the backup table which has the full structure
        query = "SELECT * FROM plantilla_comisiones_ventas_old_backup WHERE id = :comision_id"
        result = db.execute(text(query), {"comision_id": comision_id})
        record = result.fetchone()
        
        if not record:
            raise HTTPException(status_code=404, detail="Registro de comisión no encontrado")
        
        # Convert to dict format
        columns = result.keys()
        record_dict = dict(zip(columns, record))
        
        # Convert dates to strings for JSON serialization
        for key, value in record_dict.items():
            if hasattr(value, 'isoformat'):  # datetime/date objects
                record_dict[key] = value.isoformat()
        
        return record_dict
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving commission record: {str(e)}"
        )

@router.put("/plantilla-comisiones/{comision_id}", status_code=status.HTTP_200_OK)
def update_comision_record(
    comision_id: int, updates: dict, db: Session = Depends(get_db)
):
    """
    Update a commission record with full sales structure.
    """
    try:
        # Check if record exists in backup table
        check_query = "SELECT id FROM plantilla_comisiones_ventas_old_backup WHERE id = :comision_id"
        existing = db.execute(text(check_query), {"comision_id": comision_id}).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Registro de comisión no encontrado para actualizar")
        
        # Build update query
        set_clauses = []
        params = {"comision_id": comision_id}
        
        # Map all the possible fields from the full structure
        field_mappings = {
            'entidad': 'entidad',
            'etapa': 'etapa', 
            'inmueble': 'inmueble',
            'modelo': 'modelo',
            'n_proceso_entrega': 'n_proceso_entrega',
            'contrato_firmado_con': 'contrato_firmado_con',
            'nombre_del_banco': 'nombre_del_banco',
            'identificacion': 'identificacion',
            'ingreso': 'ingreso',
            'fecha_empleo': 'fecha_empleo',
            'tiempo_trabajando': 'tiempo_trabajando',
            'profesion': 'profesion',
            'fecha_ingreso_al': 'fecha_ingreso_al',
            'cotitular': 'cotitular',
            'vendedor': 'vendedor',
            'fecha_reserva': 'fecha_reserva',
            'servicio': 'servicio',
            'cpf': 'cpf',
            'importe_cpf': 'importe_cpf',
            'fecha_venta': 'fecha_venta',
            'fecha_ingreso_etapa': 'fecha_ingreso_etapa',
            'ultima_etapa': 'ultima_etapa',
            'responsable': 'responsable',
            'personal_comisiones': 'personal_comisiones',
            'cliente': 'cliente',
            'producto_servicio': 'producto_servicio',
            'monto_venta': 'monto_venta'
        }
        
        for field_name, db_column in field_mappings.items():
            if field_name in updates:
                set_clauses.append(f"{db_column} = :{field_name}")
                
                # Handle special data types
                if field_name == 'personal_comisiones':
                    params[field_name] = json.dumps(updates[field_name]) if updates[field_name] else '{}'
                elif field_name in ['monto_venta', 'importe_cpf']:
                    params[field_name] = float(updates[field_name]) if updates[field_name] else 0.0
                else:
                    params[field_name] = updates[field_name]
        
        if not set_clauses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        update_query = f"""
        UPDATE plantilla_comisiones_ventas_old_backup 
        SET {', '.join(set_clauses)}
        WHERE id = :comision_id
        """
        
        db.execute(text(update_query), params)
        db.commit()
        
        return {"message": "Commission record updated successfully", "id": comision_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating commission record: {str(e)}"
        )

@router.delete("/plantilla-comisiones/{comision_id}", status_code=status.HTTP_200_OK)
def delete_comision_record(comision_id: int, db: Session = Depends(get_db)):
    """
    Delete a commission record from the full sales structure.
    """
    try:
        # Check if record exists in backup table
        check_query = "SELECT cliente FROM plantilla_comisiones_ventas_old_backup WHERE id = :comision_id"
        existing = db.execute(text(check_query), {"comision_id": comision_id}).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Registro de comisión no encontrado para eliminar")
        
        # Delete the record
        delete_query = "DELETE FROM plantilla_comisiones_ventas_old_backup WHERE id = :comision_id"
        db.execute(text(delete_query), {"comision_id": comision_id})
        db.commit()
        
        return {"message": f"Commission record for client '{existing[0] or 'Unknown'}' deleted successfully", "id": comision_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting commission record: {str(e)}"
        )

@router.post("/migrate-to-dynamic-v2", status_code=status.HTTP_200_OK)
async def migrate_plantilla_comisiones_to_dynamic_v2(db: Session = Depends(get_db)):
    """
    Migrate plantilla_comisiones_ventas table to dynamic period format.
    This creates a new table and then swaps them.
    """
    try:
        # First rollback any pending transaction
        db.rollback()
        
        # Check if migration already done
        try:
            result = db.execute(text("SELECT actividad FROM plantilla_comisiones_ventas LIMIT 1"))
            # If this succeeds, migration is already done
            return {"message": "Migration already completed", "status": "already_migrated"}
        except:
            # Table doesn't have actividad column, proceed with migration
            db.rollback()  # Clear any error state
        
        print("Starting migration v2...")
        
        # Step 1: Create new table with dynamic structure
        print("Step 1: Creating new table...")
        create_table_sql = """
        CREATE TABLE plantilla_comisiones_ventas_new (
            id SERIAL PRIMARY KEY,
            actividad TEXT NOT NULL,
            
            -- Dynamic period columns (39 months: March 2024 to May 2027)
            amount_2024_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_12 DECIMAL(15,2) DEFAULT 0.00,
            
            amount_2025_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_12 DECIMAL(15,2) DEFAULT 0.00,
            
            amount_2026_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_12 DECIMAL(15,2) DEFAULT 0.00,
            
            amount_2027_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_05 DECIMAL(15,2) DEFAULT 0.00,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        db.execute(text(create_table_sql))
        db.commit()
        
        # Step 2: Insert sample commission concepts
        print("Step 2: Inserting sample data...")
        insert_sql = """
        INSERT INTO plantilla_comisiones_ventas_new (actividad) VALUES 
        ('Comisión Ventas General'),
        ('Comisión Captador'),
        ('Comisión Referido'),
        ('Comisión Vendedor 1'),
        ('Comisión Vendedor 2'),
        ('Comisión Vendedor 3')
        """
        db.execute(text(insert_sql))
        db.commit()
        
        # Step 3: Add sample data for current period
        print("Step 3: Adding sample amounts...")
        db.execute(text("UPDATE plantilla_comisiones_ventas_new SET amount_2025_06 = 1500.00 WHERE actividad = 'Comisión Ventas General'"))
        db.execute(text("UPDATE plantilla_comisiones_ventas_new SET amount_2025_06 = 800.00 WHERE actividad = 'Comisión Captador'"))
        db.execute(text("UPDATE plantilla_comisiones_ventas_new SET amount_2025_06 = 1200.00 WHERE actividad = 'Comisión Referido'"))
        db.commit()
        
        # Step 4: Rename tables to swap them
        print("Step 4: Swapping tables...")
        db.execute(text("ALTER TABLE plantilla_comisiones_ventas RENAME TO plantilla_comisiones_ventas_old_backup"))
        db.execute(text("ALTER TABLE plantilla_comisiones_ventas_new RENAME TO plantilla_comisiones_ventas"))
        db.commit()
        
        # Step 5: Create indexes
        print("Step 5: Creating indexes...")
        db.execute(text("CREATE INDEX idx_plantilla_comisiones_actividad ON plantilla_comisiones_ventas(actividad)"))
        db.execute(text("CREATE INDEX idx_plantilla_comisiones_created_at ON plantilla_comisiones_ventas(created_at)"))
        db.commit()
        
        # Verify the migration
        result = db.execute(text("SELECT actividad, amount_2025_06 FROM plantilla_comisiones_ventas ORDER BY actividad"))
        rows = result.fetchall()
        
        print("Migration v2 completed successfully!")
        
        return {
            "message": "Migration v2 completed successfully",
            "migrated_rows": len(rows),
            "sample_data": [{"actividad": row[0], "amount_2025_06": float(row[1])} for row in rows]
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error in migration v2: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration v2 failed: {str(e)}"
        )

@router.get("/check-table-structure", status_code=status.HTTP_200_OK)
async def check_plantilla_comisiones_structure(db: Session = Depends(get_db)):
    """
    Check the current structure of plantilla_comisiones_ventas table.
    """
    try:
        # Check table structure
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plantilla_comisiones_ventas' 
            ORDER BY ordinal_position
        """))
        columns = result.fetchall()
        
        # Check if table has data
        count_result = db.execute(text("SELECT COUNT(*) FROM plantilla_comisiones_ventas"))
        row_count = count_result.scalar()
        
        return {
            "table_exists": len(columns) > 0,
            "columns": [{"name": col[0], "type": col[1]} for col in columns],
            "row_count": row_count,
            "has_dynamic_structure": any(col[0].startswith('amount_') for col in columns)
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "table_exists": False
        }

@router.post("/create-commission-template", status_code=status.HTTP_200_OK)
async def create_commission_template_table(db: Session = Depends(get_db)):
    """
    Create the commission template table with dynamic period structure.
    This creates a new table specifically for commission templates.
    """
    try:
        # Check if table already exists
        check_result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'plantilla_comisiones_template'
            )
        """))
        table_exists = check_result.scalar()
        
        if table_exists:
            return {"message": "Commission template table already exists", "status": "already_exists"}
        
        print("Creating commission template table...")
        
        # Create the commission template table
        create_table_sql = """
        CREATE TABLE plantilla_comisiones_template (
            id SERIAL PRIMARY KEY,
            actividad TEXT NOT NULL,
            
            -- Dynamic period columns (39 months: March 2024 to May 2027)
            amount_2024_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2024_12 DECIMAL(15,2) DEFAULT 0.00,
            
            amount_2025_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2025_12 DECIMAL(15,2) DEFAULT 0.00,
            
            amount_2026_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_05 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_06 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_07 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_08 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_09 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_10 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_11 DECIMAL(15,2) DEFAULT 0.00,
            amount_2026_12 DECIMAL(15,2) DEFAULT 0.00,
            
            amount_2027_01 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_02 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_03 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_04 DECIMAL(15,2) DEFAULT 0.00,
            amount_2027_05 DECIMAL(15,2) DEFAULT 0.00,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        db.execute(text(create_table_sql))
        db.commit()
        
        # Insert sample commission concepts
        print("Inserting sample commission data...")
        insert_sql = """
        INSERT INTO plantilla_comisiones_template (actividad) VALUES 
        ('Comisión Ventas General'),
        ('Comisión Captador'),
        ('Comisión Referido'),
        ('Comisión Vendedor 1'),
        ('Comisión Vendedor 2'),
        ('Comisión Vendedor 3')
        """
        db.execute(text(insert_sql))
        db.commit()
        
        # Add sample data for current period
        print("Adding sample amounts...")
        db.execute(text("UPDATE plantilla_comisiones_template SET amount_2025_06 = 1500.00 WHERE actividad = 'Comisión Ventas General'"))
        db.execute(text("UPDATE plantilla_comisiones_template SET amount_2025_06 = 800.00 WHERE actividad = 'Comisión Captador'"))
        db.execute(text("UPDATE plantilla_comisiones_template SET amount_2025_06 = 1200.00 WHERE actividad = 'Comisión Referido'"))
        db.commit()
        
        # Create indexes
        print("Creating indexes...")
        db.execute(text("CREATE INDEX idx_plantilla_comisiones_template_actividad ON plantilla_comisiones_template(actividad)"))
        db.execute(text("CREATE INDEX idx_plantilla_comisiones_template_created_at ON plantilla_comisiones_template(created_at)"))
        db.commit()
        
        # Verify the creation
        result = db.execute(text("SELECT actividad, amount_2025_06 FROM plantilla_comisiones_template ORDER BY actividad"))
        rows = result.fetchall()
        
        print("Commission template table created successfully!")
        
        return {
            "message": "Commission template table created successfully",
            "table_name": "plantilla_comisiones_template",
            "rows_created": len(rows),
            "sample_data": [{"actividad": row[0], "amount_2025_06": float(row[1])} for row in rows]
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error creating commission template table: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create commission template table: {str(e)}"
        )

@router.get("/commission-template/", status_code=status.HTTP_200_OK)
async def get_commission_template_data(db: Session = Depends(get_db)):
    """
    Get all commission template data with dynamic periods.
    Always 3 months before current + 36 months forward = 39 months total.
    """
    try:
        # Calculate dynamic periods (3 months before current + 36 months forward)
        current_date = datetime.now()
        start_date = current_date - relativedelta(months=3)
        end_date = current_date + relativedelta(months=35)  # Changed from 36 to 35 to get exactly 39 months
        
        # Generate period columns dynamically
        period_columns = []
        current_period = start_date.replace(day=1)
        while current_period <= end_date:
            period_str = f"amount_{current_period.year}_{current_period.month:02d}"
            period_columns.append(period_str)
            current_period += relativedelta(months=1)
        
        # Get commission data - only select columns that exist in the table
        # First, get the table structure to see which columns exist
        table_columns_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'plantilla_comisiones_template' 
        AND column_name LIKE 'amount_%'
        ORDER BY column_name
        """
        
        table_result = db.execute(text(table_columns_query))
        existing_columns = [row[0] for row in table_result.fetchall()]
        
        # Filter period_columns to only include existing columns
        valid_period_columns = [col for col in period_columns if col in existing_columns]
        
        # Get commission data
        query = f"""
        SELECT id, concepto, {', '.join(valid_period_columns)}
        FROM plantilla_comisiones_template
        ORDER BY concepto
        """
        
        result = db.execute(text(query))
        rows = result.fetchall()
        
        # Transform data for frontend
        data = []
        for row in rows:
            row_dict = dict(row._mapping)
            commission_data = {
                "id": row_dict["id"],
                "concepto": row_dict["concepto"],
                "months": {}
            }
            
            # Include all requested periods, even if column doesn't exist (will be 0)
            for col in period_columns:
                year_month = col.replace('amount_', '')
                if col in row_dict:
                    commission_data["months"][year_month] = float(row_dict[col] or 0)
                else:
                    commission_data["months"][year_month] = 0.0
            
            data.append(commission_data)
        
        return {"data": data, "periods": [col.replace('amount_', '') for col in period_columns]}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving commission template data: {str(e)}"
        )

@router.post("/commission-template/", status_code=status.HTTP_201_CREATED)
async def create_commission_template_row(
    concepto: str,
    db: Session = Depends(get_db)
):
    """
    Create a new commission template row.
    """
    try:
        # Check if concepto already exists
        check_query = "SELECT id FROM plantilla_comisiones_template WHERE concepto = :concepto"
        existing = db.execute(text(check_query), {"concepto": concepto}).fetchone()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Commission concept already exists"
            )
        
        # Insert new row
        insert_query = "INSERT INTO plantilla_comisiones_template (concepto) VALUES (:concepto) RETURNING id"
        result = db.execute(text(insert_query), {"concepto": concepto})
        db.commit()
        
        new_id = result.scalar()
        return {"id": new_id, "concepto": concepto, "message": "Commission template row created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating commission template row: {str(e)}"
        )

@router.put("/commission-template/{row_id}", status_code=status.HTTP_200_OK)
async def update_commission_template_row(
    row_id: int,
    updates: dict,
    db: Session = Depends(get_db)
):
    """
    Update a commission template row.
    """
    try:
        # Check if row exists
        check_query = "SELECT id FROM plantilla_comisiones_template WHERE id = :row_id"
        existing = db.execute(text(check_query), {"row_id": row_id}).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commission template row not found"
            )
        
        # Build update query
        set_clauses = []
        params = {"row_id": row_id}
        
        for key, value in updates.items():
            if key == "concepto":
                set_clauses.append("concepto = :concepto")
                params["concepto"] = value
            elif key.startswith("amount_"):
                set_clauses.append(f"{key} = :{key}")
                params[key] = float(value) if value is not None else 0.0
        
        if not set_clauses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        update_query = f"""
        UPDATE plantilla_comisiones_template 
        SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = :row_id
        """
        
        db.execute(text(update_query), params)
        db.commit()
        
        return {"message": "Commission template row updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating commission template row: {str(e)}"
        )

@router.delete("/commission-template/{row_id}", status_code=status.HTTP_200_OK)
async def delete_commission_template_row(
    row_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a commission template row.
    """
    try:
        # Check if row exists
        check_query = "SELECT concepto FROM plantilla_comisiones_template WHERE id = :row_id"
        existing = db.execute(text(check_query), {"row_id": row_id}).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commission template row not found"
            )
        
        # Delete row
        delete_query = "DELETE FROM plantilla_comisiones_template WHERE id = :row_id"
        db.execute(text(delete_query), {"row_id": row_id})
        db.commit()
        
        return {"message": f"Commission template row '{existing[0]}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting commission template row: {str(e)}"
        )

@router.get("/comisiones-data", status_code=status.HTTP_200_OK)
async def get_comisiones_data(
    salespersonId: Optional[str] = Query(None, description="Filter by salesperson ID"),
    db: Session = Depends(get_db)
):
    """
    Get commission data for sales commissions table.
    If salespersonId is provided, returns detailed data for that salesperson.
    Otherwise returns overview data.
    """
    try:
        if salespersonId:
            # Get the salesperson name from ID
            salesperson_query = "SELECT nombre FROM vendedores WHERE id = :salesperson_id"
            salesperson_result = db.execute(text(salesperson_query), {"salesperson_id": salespersonId})
            salesperson_row = salesperson_result.fetchone()
            
            if not salesperson_row:
                return []
            
            salesperson_name = salesperson_row[0]
            
            # Since there's no actual sales data linked to salespeople yet,
            # return template data showing the expected structure
            # In a real implementation, this would query actual sales data
            template_data = [
                {
                    "id": f"template_{salespersonId}_1",
                    "fecha_venta": "2025-06-01",
                    "cliente": "Cliente Ejemplo 1",
                    "producto_servicio": "Vivienda Modelo A",
                    "monto_venta": 50000.00,
                    "personal_comisiones": {salespersonId: 2500.00},
                    "vendedor": salesperson_name
                },
                {
                    "id": f"template_{salespersonId}_2", 
                    "fecha_venta": "2025-06-15",
                    "cliente": "Cliente Ejemplo 2",
                    "producto_servicio": "Vivienda Modelo B",
                    "monto_venta": 75000.00,
                    "personal_comisiones": {salespersonId: 3750.00},
                    "vendedor": salesperson_name
                }
            ]
            
            return template_data
            
        else:
            # Since the table now has the dynamic structure for commission planning,
            # we'll provide sample sales data for the overview
            # In a real implementation, this would query from a separate sales transactions table
            
            # Check if we have the old backup table with actual sales data
            try:
                # Return individual sales records from backup table
                query = """
                SELECT 
                    id,
                    fecha_venta,
                    cliente,
                    producto_servicio,
                    monto_venta,
                    vendedor,
                    personal_comisiones
                FROM plantilla_comisiones_ventas_old_backup 
                WHERE fecha_venta IS NOT NULL
                ORDER BY fecha_venta DESC
                LIMIT 50
                """
                
                result = db.execute(text(query))
                rows = result.fetchall()
                
                data = []
                for row in rows:
                    data.append({
                        "id": row[0],
                        "fecha_venta": row[1].isoformat() if row[1] else None,
                        "cliente": row[2] or "-",
                        "producto_servicio": row[3] or "-", 
                        "monto_venta": float(row[4]) if row[4] else 0.0,
                        "vendedor": row[5] or "-",
                        "personal_comisiones": row[6] if row[6] else {}
                    })
                
                return data
                
            except:
                # If backup table doesn't exist, return sample sales records
                return [
                    {
                        "id": 1,
                        "fecha_venta": "2025-06-01",
                        "cliente": "Cliente Ejemplo A",
                        "producto_servicio": "Vivienda Modelo Premium",
                        "monto_venta": 85000.0,
                        "vendedor": "Vendedor General",
                        "personal_comisiones": {"general": 4250.0}
                    },
                    {
                        "id": 2,
                        "fecha_venta": "2025-06-15",
                        "cliente": "Cliente Ejemplo B", 
                        "producto_servicio": "Vivienda Modelo Estándar",
                        "monto_venta": 65000.0,
                        "vendedor": "Vendedor General",
                        "personal_comisiones": {"general": 3250.0}
                    }
                ]
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving commission data: {str(e)}"
        )

# You can add other "ventas" related endpoints here later. 