# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import logging
from urllib.parse import quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
if os.path.exists(env_path):
    logger.info(f"Loading .env file from: {env_path}")
    # Ensure override is True so .env file takes precedence
    loaded_successfully = load_dotenv(env_path, override=True)
    logger.info(f"load_dotenv from {env_path} successful: {loaded_successfully} (override=True)")
else:
    logger.warning(f".env file not found at {env_path}. Relying on environment variables directly.")

# Database URL constructed from environment variables
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "34.174.189.231")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "grupo11flujo")

if not DB_PASSWORD:
    logger.error("DB_PASSWORD environment variable not set.")
    raise ValueError("DB_PASSWORD environment variable is required.")

# URL-encode the password
encoded_password = quote_plus(DB_PASSWORD)

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Mask password in log output
logged_db_url = SQLALCHEMY_DATABASE_URL
if DB_PASSWORD:
    logged_db_url = logged_db_url.replace(encoded_password, "********")
    # Also attempt to replace non-encoded if it was somehow still there
    logged_db_url = logged_db_url.replace(DB_PASSWORD, "********")

logger.info(f"Connecting to DB with URL: {logged_db_url}")

# Create SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()