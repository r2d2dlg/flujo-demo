from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from .. import models, auth

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str = None
    password: str
    department: str = None
    role: str = "user"

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    department: str | None = None
    role: str
    is_active: bool
    created_at: datetime | None = None
    last_login: datetime | None = None

    class Config:
        from_attributes = True

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(auth.get_db)):
    print(f"Attempting to register username: {user.username}")
    try:
        # Check if user exists
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        print(f"Query result for db_user: {db_user}")
        
        if db_user:
            print(f"Username {user.username} found in DB, raising 400.")
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Check if email exists (if provided)
        if user.email:
            db_user_email = db.query(models.User).filter(models.User.email == user.email).first()
            if db_user_email:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password properly
        hashed_password = auth.get_password_hash(user.password)
        
        new_user = models.User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            department=user.department,
            role=user.role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = auth.create_access_token(data={"sub": new_user.username})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Database error during registration")

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/token", response_model=Token)
def login(user: UserLogin, db: Session = Depends(auth.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not db_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Update last login
    db_user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token-form", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user 