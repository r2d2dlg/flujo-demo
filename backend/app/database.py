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

# Get the database URL from the environment variable provided by Cloud Run
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set.")
    # Fallback to the old method for local development if needed
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST", "34.174.189.231")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "grupo11flujo")

    if not DB_PASSWORD:
        logger.error("DB_PASSWORD environment variable not set.")
        raise ValueError("In a non-Cloud Run environment, DB_PASSWORD environment variable is required.")
    
    encoded_password = quote_plus(DB_PASSWORD)
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


# Mask password in log output
logged_db_url = "DATABASE_URL is set (password hidden)" if "DATABASE_URL" in os.environ else "DATABASE_URL not set"
if "DATABASE_URL" in os.environ and os.environ["DATABASE_URL"]:
    # A more robust way to mask the password in a URL
    from urllib.parse import urlparse, urlunparse
    parts = urlparse(os.environ["DATABASE_URL"])
    if parts.password:
        safe_parts = parts._replace(netloc=f"{parts.username}:********@{parts.hostname}:{parts.port}")
        logged_db_url = urlunparse(safe_parts)
    else:
        logged_db_url = os.environ["DATABASE_URL"]

logger.info(f"Connecting to DB with URL from DATABASE_URL env var: {logged_db_url}")


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