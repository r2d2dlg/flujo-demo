from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Proyecto
from sqlalchemy import text

router = APIRouter(prefix="/api/marketing-projects", tags=["marketing-projects"])

class ProjectCreate(BaseModel):
    keyword: str
    display_name: str

@router.get("/", response_model=list[dict])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Proyecto).filter(Proyecto.is_active == True).order_by(Proyecto.created_at).all()
    return [{"id": p.id, "keyword": p.keyword, "display_name": p.display_name, "created_at": p.created_at} for p in projects]

@router.post("/", status_code=201)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    keyword = project.keyword.strip().lower().replace(" ", "_")
    display_name = project.display_name.strip()
    exists = db.query(Proyecto).filter(Proyecto.keyword == keyword).first()
    if exists:
        raise HTTPException(status_code=400, detail="Project keyword already exists")
    
    new_project = Proyecto(
        keyword=keyword,
        display_name=display_name,
        description=f"Marketing project: {display_name}",
        is_active=True
    )
    db.add(new_project)
    db.commit()
    return {"message": "Project created", "keyword": keyword}

@router.delete("/{keyword}", status_code=204)
def delete_project(keyword: str, db: Session = Depends(get_db)):
    project = db.query(Proyecto).filter(Proyecto.keyword == keyword).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return 