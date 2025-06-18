from fastapi import APIRouter, Depends
from ..auth import require_role

router = APIRouter()

@router.get("/dashboard")
def get_master_dashboard(user=Depends(require_role("Administracion"))):
    # TODO: Query and aggregate all tables for master dashboard
    return {"msg": "Master dashboard data (Administracion only)"} 