import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import User, get_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    sys.exit(1)

# Create SQLAlchemy engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        user = db.query(User).filter(User.username == "testuser").first()
        if user:
            print("Test user already exists")
            return
        
        # Create test user
        hashed_password = get_password_hash("testpass123")
        db_user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=hashed_password,
            department="Mercadeo"
        )
        db.add(db_user)
        db.commit()
        print("Test user created successfully!")
        print("Username: testuser")
        print("Password: testpass123")
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
