from fastapi import APIRouter, Depends
from ..auth import require_role

router = APIRouter()

@router.get("/dashboard")
def get_operacion_dashboard(user=Depends(require_role("Operacion"))):
    # TODO: Query operacion tables
    return {"msg": "Operacion dashboard data"} 