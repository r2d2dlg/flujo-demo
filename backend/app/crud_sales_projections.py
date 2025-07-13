from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
import json
from . import schemas
from datetime import datetime

def create_sales_projection(db: Session, projection: schemas.SalesProjectionCreate) -> Dict[str, Any]:
    """Create a new sales projection"""
    query = text("""
        INSERT INTO sales_projections 
        (scenario_project_id, scenario_name, monthly_revenue, payment_flows, is_active, created_at)
        VALUES (:scenario_project_id, :scenario_name, :monthly_revenue, :payment_flows, :is_active, :created_at)
        RETURNING id, scenario_project_id, scenario_name, monthly_revenue, payment_flows, is_active, created_at
    """)
    
    result = db.execute(query, {
        "scenario_project_id": projection.scenario_project_id,
        "scenario_name": projection.scenario_name,
        "monthly_revenue": json.dumps(projection.monthly_revenue),
        "payment_flows": json.dumps(projection.payment_flows) if projection.payment_flows else None,
        "is_active": projection.is_active,
        "created_at": datetime.utcnow()
    })
    
    row = result.fetchone()
    if row:
        return {
            "id": row.id,
            "scenario_project_id": row.scenario_project_id,
            "scenario_name": row.scenario_name,
            "monthly_revenue": json.loads(row.monthly_revenue) if isinstance(row.monthly_revenue, str) else row.monthly_revenue,
            "payment_flows": json.loads(row.payment_flows) if row.payment_flows and isinstance(row.payment_flows, str) else row.payment_flows,
            "is_active": row.is_active,
            "created_at": row.created_at
        }
    return None

def get_sales_projection(db: Session, projection_id: int) -> Optional[Dict[str, Any]]:
    """Get a sales projection by ID"""
    query = text("""
        SELECT id, scenario_project_id, scenario_name, monthly_revenue, payment_flows, is_active, created_at
        FROM sales_projections 
        WHERE id = :projection_id
    """)
    
    result = db.execute(query, {"projection_id": projection_id})
    row = result.fetchone()
    
    if row:
        return {
            "id": row.id,
            "scenario_project_id": row.scenario_project_id,
            "scenario_name": row.scenario_name,
            "monthly_revenue": json.loads(row.monthly_revenue) if isinstance(row.monthly_revenue, str) else row.monthly_revenue,
            "payment_flows": json.loads(row.payment_flows) if row.payment_flows and isinstance(row.payment_flows, str) else row.payment_flows,
            "is_active": row.is_active,
            "created_at": row.created_at
        }
    return None

def get_sales_projections_by_project(db: Session, scenario_project_id: int) -> List[Dict[str, Any]]:
    """Get all sales projections for a specific project"""
    query = text("""
        SELECT id, scenario_project_id, scenario_name, monthly_revenue, payment_flows, is_active, created_at
        FROM sales_projections 
        WHERE scenario_project_id = :scenario_project_id
        ORDER BY created_at DESC
    """)
    
    result = db.execute(query, {"scenario_project_id": scenario_project_id})
    rows = result.fetchall()
    
    projections = []
    for row in rows:
        projections.append({
            "id": row.id,
            "scenario_project_id": row.scenario_project_id,
            "scenario_name": row.scenario_name,
            "monthly_revenue": json.loads(row.monthly_revenue) if isinstance(row.monthly_revenue, str) else row.monthly_revenue,
            "payment_flows": json.loads(row.payment_flows) if row.payment_flows and isinstance(row.payment_flows, str) else row.payment_flows,
            "is_active": row.is_active,
            "created_at": row.created_at
        })
    
    return projections

def get_active_sales_projection(db: Session, scenario_project_id: int) -> Optional[Dict[str, Any]]:
    """Get the active sales projection for a project"""
    query = text("""
        SELECT id, scenario_project_id, scenario_name, monthly_revenue, payment_flows, is_active, created_at
        FROM sales_projections 
        WHERE scenario_project_id = :scenario_project_id AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1
    """)
    
    result = db.execute(query, {"scenario_project_id": scenario_project_id})
    row = result.fetchone()
    
    if row:
        return {
            "id": row.id,
            "scenario_project_id": row.scenario_project_id,
            "scenario_name": row.scenario_name,
            "monthly_revenue": json.loads(row.monthly_revenue) if isinstance(row.monthly_revenue, str) else row.monthly_revenue,
            "payment_flows": json.loads(row.payment_flows) if row.payment_flows and isinstance(row.payment_flows, str) else row.payment_flows,
            "is_active": row.is_active,
            "created_at": row.created_at
        }
    return None

def update_sales_projection(db: Session, projection_id: int, projection_update: schemas.SalesProjectionUpdate) -> Optional[Dict[str, Any]]:
    """Update a sales projection"""
    # Build dynamic update query
    update_fields = []
    params = {"projection_id": projection_id}
    
    if projection_update.scenario_name is not None:
        update_fields.append("scenario_name = :scenario_name")
        params["scenario_name"] = projection_update.scenario_name
    
    if projection_update.monthly_revenue is not None:
        update_fields.append("monthly_revenue = :monthly_revenue")
        params["monthly_revenue"] = json.dumps(projection_update.monthly_revenue)
    
    if projection_update.is_active is not None:
        update_fields.append("is_active = :is_active")
        params["is_active"] = projection_update.is_active
        
        # If setting this one as active, deactivate others for the same project
        if projection_update.is_active:
            # First get the project ID
            project_query = text("SELECT scenario_project_id FROM sales_projections WHERE id = :projection_id")
            project_result = db.execute(project_query, {"projection_id": projection_id})
            project_row = project_result.fetchone()
            
            if project_row:
                # Deactivate other projections for this project
                deactivate_query = text("""
                    UPDATE sales_projections 
                    SET is_active = false 
                    WHERE scenario_project_id = :scenario_project_id AND id != :projection_id
                """)
                db.execute(deactivate_query, {
                    "scenario_project_id": project_row.scenario_project_id,
                    "projection_id": projection_id
                })
    
    if not update_fields:
        return get_sales_projection(db, projection_id)
    
    query = text(f"""
        UPDATE sales_projections 
        SET {', '.join(update_fields)}
        WHERE id = :projection_id
        RETURNING id, scenario_project_id, scenario_name, monthly_revenue, is_active, created_at
    """)
    
    result = db.execute(query, params)
    row = result.fetchone()
    
    if row:
        return {
            "id": row.id,
            "scenario_project_id": row.scenario_project_id,
            "scenario_name": row.scenario_name,
            "monthly_revenue": json.loads(row.monthly_revenue) if isinstance(row.monthly_revenue, str) else row.monthly_revenue,
            "is_active": row.is_active,
            "created_at": row.created_at
        }
    return None

def delete_sales_projection(db: Session, projection_id: int) -> bool:
    """Delete a sales projection"""
    query = text("DELETE FROM sales_projections WHERE id = :projection_id")
    result = db.execute(query, {"projection_id": projection_id})
    return result.rowcount > 0

def set_active_projection(db: Session, scenario_project_id: int, projection_id: int) -> bool:
    """Set a specific projection as active and deactivate others"""
    # First deactivate all projections for this project
    deactivate_query = text("""
        UPDATE sales_projections 
        SET is_active = false 
        WHERE scenario_project_id = :scenario_project_id
    """)
    db.execute(deactivate_query, {"scenario_project_id": scenario_project_id})
    
    # Then activate the specified projection
    activate_query = text("""
        UPDATE sales_projections 
        SET is_active = true 
        WHERE id = :projection_id AND scenario_project_id = :scenario_project_id
    """)
    result = db.execute(activate_query, {
        "projection_id": projection_id,
        "scenario_project_id": scenario_project_id
    })
    
    return result.rowcount > 0 