from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
# from jose import JWTError, jwt # Not needed for mock
from sqlalchemy.orm import Session
from . import models, database # Assuming models.User is the user model
# from passlib.context import CryptContext # Not needed for mock
import os

# SECRET_KEY = os.getenv("SECRET_KEY", "test_secret") # Not needed for mock
# ALGORITHM = os.getenv("ALGORITHM", "HS256") # Not needed for mock

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Not needed for mock
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # Keep for FastAPI dependency system if other parts still use it

# Mock User for disabled authentication
# Ensure this structure matches your models.User structure
# The User model in backend/app/models.py does not have an 'email' field.
MOCK_BACKEND_USER = models.User() # Initialize first
MOCK_BACKEND_USER.id = 1
MOCK_BACKEND_USER.username = 'mock_user_backend'
# MOCK_BACKEND_USER.email = 'mock_backend@example.com' # REMOVE THIS LINE as User model has no email
MOCK_BACKEND_USER.department = 'ventas' # Or any default department
MOCK_BACKEND_USER.is_active = True # Assuming User model has this, if not, remove/adjust
MOCK_BACKEND_USER.is_superuser = False # Assuming User model has this, if not, remove/adjust
MOCK_BACKEND_USER.hashed_password = 'mock_hashed_password' 


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     # For mock: always return True or remove usage
#     return True 

# def get_password_hash(password: str) -> str:
#     # For mock: return a dummy hash or remove usage
#     return "dummy_hash"

# def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
#     # For mock: return a dummy token or remove usage
#     return "dummy_access_token"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print("[AUTH.PY] get_current_user called, returning MOCK_BACKEND_USER as auth is disabled.")
    # For disabled authentication, always return a mock user
    # The token and db parameters are kept to satisfy FastAPI's dependency injection if any part still tries to call it directly,
    # but their values are not used in this mock implementation.
    return MOCK_BACKEND_USER 

def require_role(required_role: str):
    def role_checker(user: models.User = Depends(get_current_user)):
        # With mock user, this will check the mock user's department
        if user.department != required_role:
            print(f"[AUTH.PY] Role check failed for mock user. Required: {required_role}, User has: {user.department}")
            raise HTTPException(status_code=403, detail=f"Not enough permissions. Mock user department: {user.department}, Required: {required_role}")
        print(f"[AUTH.PY] Role check passed for mock user. Required: {required_role}, User has: {user.department}")
        return user
    return role_checker 