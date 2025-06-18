import os
from fastapi import FastAPI, Depends, HTTPException, status, Form, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import date, datetime, timedelta
from dotenv import load_dotenv, find_dotenv, dotenv_values

# Load environment variables
dotenv_path = find_dotenv(usecwd=True)
print(f"DEBUG: Attempting to load .env from: {dotenv_path if dotenv_path else 'Not found in CWD or parent directories'}")

# Directly inspect values from .env file for debugging
if dotenv_path and os.path.exists(dotenv_path):
    env_file_contents = dotenv_values(dotenv_path)
    print(f"DEBUG: Values directly from .env file ({dotenv_path}):")
    print(f"  DB_USER from .env file: {env_file_contents.get('DB_USER')}")
    print(f"  DATABASE_URL from .env file: {env_file_contents.get('DATABASE_URL')}")
else:
    print("DEBUG: .env file not found by find_dotenv() or path does not exist.")

loaded_successfully = load_dotenv(dotenv_path, override=True)
print(f"DEBUG: load_dotenv successful (override=True): {loaded_successfully}")

# DEBUG: Print environment variables as seen by os.getenv (after load_dotenv)
print(f"DEBUG: os.getenv('DB_USER') after load_dotenv: {os.getenv('DB_USER')}")
print(f"DEBUG: os.getenv('DATABASE_URL') after load_dotenv: {os.getenv('DATABASE_URL')}")

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

from urllib.parse import quote_plus

# Get database URL from environment variables or construct it
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"DEBUG: DATABASE_URL after initial getenv: {DATABASE_URL}")

if not DATABASE_URL:
    print("DEBUG: DATABASE_URL is not set, constructing from parts.")
    # Fallback to constructing from individual components
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    
    if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
        error_msg = "Missing required database environment variables"
        print(f"❌ {error_msg}")
        print("Please set either DATABASE_URL or all of DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME")
        raise ValueError(error_msg)
    
    # URL-encode the password to handle special characters
    encoded_password = quote_plus(DB_PASSWORD)
    DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    print(f"DEBUG: Constructed DATABASE_URL: {DATABASE_URL.replace(encoded_password, '********')}")

print("\n=== Database Connection ===")
print(f"Using database: {DATABASE_URL.split('@')[-1]}")
print("===========================\n")

# Create SQLAlchemy engine
try:
    print("🔧 Creating database engine...")
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Enable connection health checks
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        connect_args={
            "connect_timeout": 5,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5
        }
    )
    
    # Test the connection
    print("🔍 Testing database connection...")
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT current_database(), current_user, version()"))
        db_info = result.fetchone()
        print(f"✅ Successfully connected to PostgreSQL:")
        print(f"   Database: {db_info[0]}")
        print(f"   User: {db_info[1]}")
        print(f"   Version: {db_info[2]}")
        
except Exception as e:
    error_msg = f"❌ Failed to connect to the database: {str(e)}"
    print(error_msg)
    print("\nTroubleshooting steps:")
    print("1. Verify the database server is running and accessible")
    print("2. Check if the username and password are correct")
    print("3. Ensure the user has proper permissions")
    print("4. Check if the database exists")
    print("5. Verify network connectivity and firewall settings")
    print("\nError details:")
    import traceback
    traceback.print_exc()
    raise Exception(error_msg) from e

# Create session factory
print("🔧 Creating session factory...")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
print("✅ Database connection and session factory ready!\n")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create base class for models
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Note: Removed department as it's not in the database

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey("users.id"))

class CashFlow(Base):
    __tablename__ = "cash_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    date = Column(Date)
    type = Column(String)  # 'income' or 'expense'
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))

# Create tables
Base.metadata.create_all(bind=engine)

# Authentication functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data["username"]).first()
    if user is None:
        raise credentials_exception
    return user

# Pydantic models
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserInDB(UserBase):
    id: int
    email: str
    
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class CategoryInDB(CategoryBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

class CashFlowBase(BaseModel):
    amount: float
    description: Optional[str] = None
    date: date
    type: str
    category_id: int

class CashFlowCreate(CashFlowBase):
    pass

class CashFlowInDB(CashFlowBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

# Add project root to Python path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

# Import routers
from api.marketing import router as marketing_router_from_api # Renamed to avoid conflict

# Attempt to import the specific router instance directly
print("Attempting to import tables_router from backend.app.routers.tables...")
try:
    from backend.app.routers.tables import router as actual_tables_router_instance
    print(f"Successfully imported tables_router: {type(actual_tables_router_instance)}")
    if not isinstance(actual_tables_router_instance, APIRouter):
        print("ERROR: actual_tables_router_instance is NOT an APIRouter!")
        # You could even raise an Exception here to stop startup if it's wrong type
except ImportError as e:
    print(f"ERROR: Could not import tables_router from backend.app.routers.tables: {e}")
    actual_tables_router_instance = None # Set to None if import fails
except Exception as e:
    print(f"ERROR: An unexpected error occurred during import of tables_router: {e}")
    actual_tables_router_instance = None

from backend.app.routers import projects as projects_router 
from backend.app.routers import marketing as new_marketing_router 

# Create FastAPI app
app = FastAPI()

# CORS middleware - must be added before including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router for marketing endpoints
marketing_router = APIRouter(prefix="/api/marketing", tags=["marketing"])

@marketing_router.get("/{project}/tables")
async def get_project_tables(project: str, db: Session = Depends(get_db)):
    """Get list of all tables for a project"""
    try:
        # Get list of all tables in the database
        result = db.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in result.fetchall()]
        
        # Filter out system tables and only include relevant ones
        # Adjust this filter based on your table naming convention
        valid_tables = [t for t in tables if not t.startswith(('pg_', 'sql_', 'alembic_'))]
        
        return {"tables": valid_tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tables: {str(e)}")

@marketing_router.get("/{project}/table/{table_name}")
async def get_table_data(
    project: str, 
    table_name: str, 
    db: Session = Depends(get_db),
    skip: int = 0, 
    limit: int = 100
):
    """Get data from a specific table with pagination"""
    try:
        # First, get column names
        columns_result = db.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = :table_name
            ORDER BY ordinal_position;
        """, {"table_name": table_name})
        
        if not columns_result.rowcount:
            raise HTTPException(status_code=404, detail=f"Table {table_name} not found")
            
        columns = [row[0] for row in columns_result.fetchall()]
        
        # Then get the data with pagination
        data_result = db.execute(
            f'SELECT * FROM "{table_name}" ORDER BY id LIMIT :limit OFFSET :skip',
            {"limit": limit, "skip": skip}
        )
        
        # Convert rows to dictionaries
        rows = []
        for row in data_result.fetchall():
            rows.append(dict(zip(columns, row)))
            
        return {
            "data": rows,
            "columns": columns,
            "total": len(rows),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching table data: {str(e)}")

# Include the routers
# Note: The marketing_router defined locally in this file has prefix /api/marketing
# If api.marketing.router also has /api/marketing, there might be conflicts or override.
# Clarify which marketing router should be used or adjust prefixes.

# app.include_router(marketing_router_from_api) # This was from the old api/marketing.py, might be outdated or conflict
app.include_router(marketing_router) # This is the one defined in main.py with /api/marketing prefix

if actual_tables_router_instance:
    print(f"Including actual_tables_router_instance with prefix: {actual_tables_router_instance.prefix}")
    app.include_router(actual_tables_router_instance)
else:
    print("ERROR: actual_tables_router_instance is None, so it cannot be included.")

app.include_router(projects_router.router) # Include the projects router (prefix /projects)
app.include_router(new_marketing_router.router) # Include the marketing router from backend.app.routers.marketing (prefix /marketing)

# Print all routes on startup
print("\n=== Registered Routes ===")
try:
    if hasattr(app, 'routes') and app.routes:
        for i, route in enumerate(app.routes):
            path_str = "Unknown path"
            methods_str = "Unknown methods"
            name_str = "Unknown name"
            
            if hasattr(route, 'path'):
                path_str = route.path
            if hasattr(route, 'methods') and route.methods is not None:
                methods_str = ', '.join(route.methods)
            else:
                methods_str = "N/A (e.g., Mount or WebSocketRoute)"
            if hasattr(route, 'name'):
                name_str = route.name

            print(f"Route {i}: Path='{path_str}', Methods='[{methods_str}]', Name='{name_str}'")
    else:
        print("No routes found on app object or app.routes is empty.")
except Exception as e:
    print(f"Error printing routes: {e}")
print("========================\n")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Grupo 11 Flujo API"}

# User endpoints
@app.post("/auth/register", response_model=UserInDB)
@app.post("/users/", response_model=UserInDB)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        # Check if username already exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Check if email already exists
        db_email = db.query(User).filter(User.email == user.email).first()
        if db_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash the password
        hashed_password = get_password_hash(user.password)
        
        # Create new user
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {str(e)}")  # Add this line for debugging
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

# Authentication endpoint
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

@app.post("/auth/token", response_model=Token)
async def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Authenticate user
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},  # You can add more data here like user roles
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Protected route example
@app.get("/users/me/", response_model=UserInDB)
async def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get the user from the database to ensure we have the latest data
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Category endpoints
@app.post("/categories/", response_model=CategoryInDB)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    # In a real app, add user authentication
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Cash Flow endpoints
@app.post("/cash_flows/", response_model=CashFlowInDB)
def create_cash_flow(cash_flow: CashFlowCreate, db: Session = Depends(get_db)):
    # In a real app, add user authentication
    db_cash_flow = CashFlow(**cash_flow.dict())
    db.add(db_cash_flow)
    db.commit()
    db.refresh(db_cash_flow)
    return db_cash_flow

@app.get("/cash_flows/", response_model=List[CashFlowInDB])
def read_cash_flows(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    # In a real app, add filtering and user authentication
    cash_flows = db.query(CashFlow).offset(skip).limit(limit).all()
    return cash_flows

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
