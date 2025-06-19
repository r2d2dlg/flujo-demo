from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from datetime import datetime
from .. import auth
from ..models import Proyecto, User

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)

# Templates configuration
templates = Jinja2Templates(directory="templates")

# Pydantic models for user management
class UserCreateRequest(BaseModel):
    username: str
    email: str = None
    password: str
    role: str = "user"

class UserUpdateRequest(BaseModel):
    role: str = None
    is_active: bool = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str = None
    role: str
    is_active: bool
    created_at: datetime = None
    last_login: datetime = None

    class Config:
        from_attributes = True

# Admin Panel Routes
@router.get("/panel", response_class=HTMLResponse)
async def admin_panel(request: Request, current_user: User = Depends(auth.require_admin), db: Session = Depends(auth.get_db)):
    """
    Render the admin panel HTML page
    """
    users = db.query(User).all()
    return templates.TemplateResponse("admin_panel.html", {
        "request": request,
        "users": users,
        "current_user": current_user
    })

# User Management Endpoints
@router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(auth.require_admin), db: Session = Depends(auth.get_db)):
    """
    Get all users for admin management
    """
    users = db.query(User).all()
    return users

@router.post("/create-user")
async def create_user(user_data: UserCreateRequest, current_user: User = Depends(auth.require_admin), db: Session = Depends(auth.get_db)):
    """
    Create a new user (admin only)
    """
    try:
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            return {"success": False, "error": "El nombre de usuario ya existe"}
        
        # Check if email already exists (if provided)
        if user_data.email:
            existing_email = db.query(User).filter(User.email == user_data.email).first()
            if existing_email:
                return {"success": False, "error": "El email ya está registrado"}
        
        # Create new user
        hashed_password = auth.get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"success": True, "message": f"Usuario '{user_data.username}' creado exitosamente"}
        
    except Exception as e:
        db.rollback()
        return {"success": False, "error": f"Error al crear usuario: {str(e)}"}

@router.post("/update-user-status")
async def update_user_status(user_id: int, is_active: bool, current_user: User = Depends(auth.require_admin), db: Session = Depends(auth.get_db)):
    """
    Update user active status (admin only)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"success": False, "error": "Usuario no encontrado"}
        
        # Prevent deactivating yourself
        if user.id == current_user.id and not is_active:
            return {"success": False, "error": "No puedes desactivar tu propia cuenta"}
        
        user.is_active = is_active
        db.commit()
        
        status_text = "activado" if is_active else "desactivado"
        return {"success": True, "message": f"Usuario '{user.username}' {status_text} exitosamente"}
        
    except Exception as e:
        db.rollback()
        return {"success": False, "error": f"Error al actualizar estado: {str(e)}"}

@router.post("/update-user-role")
async def update_user_role(user_id: int, role: str, current_user: User = Depends(auth.require_admin), db: Session = Depends(auth.get_db)):
    """
    Update user role (admin only)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"success": False, "error": "Usuario no encontrado"}
        
        # Prevent changing your own role from admin to user
        if user.id == current_user.id and current_user.role == "admin" and role != "admin":
            return {"success": False, "error": "No puedes cambiar tu propio rol de administrador"}
        
        if role not in ["user", "admin"]:
            return {"success": False, "error": "Rol inválido"}
        
        user.role = role
        db.commit()
        
        return {"success": True, "message": f"Rol de '{user.username}' actualizado a '{role}' exitosamente"}
        
    except Exception as e:
        db.rollback()
        return {"success": False, "error": f"Error al actualizar rol: {str(e)}"}

@router.delete("/delete-project/{project_name}")
async def delete_project(
    project_name: str,
    db: Session = Depends(auth.get_db)
):
    """
    Eliminar un proyecto completo incluyendo todas sus tablas, vistas y datos relacionados
    """
    try:
        print(f"🗑️ Iniciando eliminación completa del proyecto: {project_name}")
        
        # Lista de categorías de marketing
        marketing_categories = [
            "gastos_casa_modelo",
            "gastos_publicitarios", 
            "ferias_eventos",
            "redes_sociales",
            "promociones_y_bonos",
            "gastos_tramites"
        ]
        
        # Also include the new table suffixes used by the projects endpoint
        table_suffixes = ["casa_modelo", "feria_eventos", "gastos_casa_modelo", 
                         "gastos_publicitarios", "gastos_tramites", "promociones_y_bonos", "redes_sociales"]
        
        deleted_items = {
            "tables": [],
            "views": [],
            "related_data": []
        }
        
        # 1. Eliminar vistas primero (para evitar dependencias)
        views_to_delete = [
            f"vista_presupuesto_mercadeo_{project_name}_resumen",
            f"vista_presupuesto_mercadeo_{project_name}_full"
        ]
        
        # Agregar vistas individuales por categoría (old format)
        for category in marketing_categories:
            views_to_delete.append(f"vista_presupuesto_mercadeo_{project_name}_{category}")
        
        # Add new format views
        for suffix in table_suffixes:
            views_to_delete.append(f"v_presupuesto_mercadeo_{project_name}_{suffix}")
        
        # Add consolidated views
        views_to_delete.extend([
            f"v_presupuesto_mercadeo_{project_name}_consolidado",
            f"v_presupuesto_mercadeo_{project_name}_resumen"
        ])
        
        for view_name in views_to_delete:
            try:
                # Verificar si la vista existe
                check_view = db.execute(text("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.views 
                        WHERE table_schema = 'public' 
                        AND table_name = :view_name
                    )
                """), {"view_name": view_name}).scalar()
                
                if check_view:
                    db.execute(text(f"DROP VIEW IF EXISTS {view_name} CASCADE"))
                    deleted_items["views"].append(view_name)
                    print(f"✅ Vista eliminada: {view_name}")
                    
            except Exception as e:
                print(f"⚠️ Error eliminando vista {view_name}: {e}")
        
        # 2. Eliminar tablas (both old and new formats)
        tables_to_delete = []
        
        # Old format tables
        for category in marketing_categories:
            tables_to_delete.append(f"presupuesto_mercadeo_{project_name}_{category}")
        
        # New format tables
        for suffix in table_suffixes:
            tables_to_delete.append(f"presupuesto_mercadeo_{project_name}_{suffix}")
        
        for table_name in tables_to_delete:
            try:
                # Verificar si la tabla existe
                check_table = db.execute(text("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = :table_name
                    )
                """), {"table_name": table_name}).scalar()
                
                if check_table:
                    db.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
                    deleted_items["tables"].append(table_name)
                    print(f"✅ Tabla eliminada: {table_name}")
                    
            except Exception as e:
                print(f"⚠️ Error eliminando tabla {table_name}: {e}")
        
        # 3. Delete project data from related tables
        tables_to_clean = [
            "infraestructura_pagos",
            "vivienda_pagos", 
            "costo_directo",
            "costo_x_vivienda",
            "proyecto_variable_payroll",
            "planilla_variable_construccion"
        ]
        
        for table in tables_to_clean:
            try:
                result = db.execute(text(f"DELETE FROM {table} WHERE proyecto = :proyecto"), {"proyecto": project_name})
                if result.rowcount > 0:
                    deleted_items["related_data"].append(f"{table}: {result.rowcount} rows")
                    print(f"✅ Deleted {result.rowcount} rows from {table}")
            except Exception as e:
                print(f"⚠️ Error cleaning {table}: {e}")
        
        # 4. Delete from projects table
        project_to_delete = db.query(Proyecto).filter(Proyecto.keyword == project_name).first()
        if project_to_delete:
            db.delete(project_to_delete)
            deleted_items["related_data"].append(f"proyectos table: 1 row")
            print(f"✅ Deleted project record: {project_name}")
        
        # Confirmar cambios
        db.commit()
        
        print(f"🎉 Proyecto '{project_name}' eliminado completamente")
        
        return {
            "success": True,
            "message": f"Proyecto '{project_name}' eliminado completamente",
            "deleted_items": deleted_items,
            "summary": {
                "tables_deleted": len(deleted_items["tables"]),
                "views_deleted": len(deleted_items["views"]),
                "related_data_cleaned": len(deleted_items["related_data"])
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error eliminando proyecto {project_name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error eliminando proyecto: {str(e)}"
        )

@router.get("/projects")
async def list_projects(db: Session = Depends(auth.get_db)):
    """
    Obtiene la lista de todos los proyectos registrados en la base de datos con información de estado
    """
    try:
        print("📋 Obteniendo lista de proyectos...")
        
        # Obtener proyectos directamente de la tabla proyectos
        projects_from_db = db.query(Proyecto).all()
        
        projects = []
        for project in projects_from_db:
            # Verificar si las tablas de marketing existen para este proyecto
            tables_exist = False
            views_exist = False
            
            # Check if any marketing tables exist (new format)
            table_suffixes = ["casa_modelo", "feria_eventos", "gastos_casa_modelo", 
                             "gastos_publicitarios", "gastos_tramites", "promociones_y_bonos", "redes_sociales"]
            
            for suffix in table_suffixes:
                table_name = f"presupuesto_mercadeo_{project.keyword}_{suffix}"
                check_table = db.execute(text("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = :table_name
                    )
                """), {"table_name": table_name}).scalar()
                
                if check_table:
                    tables_exist = True
                    break
            
            # Check if any views exist
            view_names = [
                f"v_presupuesto_mercadeo_{project.keyword}_consolidado",
                f"v_presupuesto_mercadeo_{project.keyword}_resumen"
            ]
            
            for view_name in view_names:
                check_view = db.execute(text("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.views 
                        WHERE table_schema = 'public' 
                        AND table_name = :view_name
                    )
                """), {"view_name": view_name}).scalar()
                
                if check_view:
                    views_exist = True
                    break
            
            projects.append({
                "keyword": project.keyword,
                "display_name": project.display_name,
                "description": project.description,
                "is_active": project.is_active,
                "created_at": project.created_at.isoformat() if project.created_at else None,
                "marketing_tables_exist": tables_exist,
                "marketing_views_exist": views_exist,
                "status": "active" if project.is_active else "inactive"
            })
        
        print(f"📋 Found {len(projects)} projects")
        return {
            "success": True,
            "projects": projects,
            "total_count": len(projects)
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo proyectos: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo proyectos: {str(e)}"
        ) 