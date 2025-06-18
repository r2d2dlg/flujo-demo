from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .. import models, auth

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str
    department: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(auth.get_db)):
    print(f"Attempting to register username: {user.username}") # DEBUG
    try:
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        print(f"Query result for db_user: {db_user}") # DEBUG
    except Exception as e:
        print(f"Error during database query: {e}") # DEBUG
        raise HTTPException(status_code=500, detail="Database query error during registration")

    if db_user:
        print(f"Username {user.username} found in DB, raising 400.") # DEBUG
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, department=user.department)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/token", response_model=Token)
def login(user: UserLogin, db: Session = Depends(auth.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"} 