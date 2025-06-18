from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from .. import models, auth
from ..auth import get_current_user, get_db
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import os

router = APIRouter()

class UserResponse(BaseModel):
    username: str
    department: Optional[str] = ""
    id: int

    class Config:
        from_attributes = True

@router.get("/me/", response_model=UserResponse)
async def read_users_me():
    # Return a mock user for now since authentication is disabled
    return UserResponse(
        username="mock_user",
        department="any_department",
        id=1
    )
