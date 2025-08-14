from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path

# Create database directory if it doesn't exist
DB_DIR = Path("data")
DB_DIR.mkdir(exist_ok=True)

# Database URL for profile-based collections
DATABASE_URL = f"sqlite:///{DB_DIR}/pdf_collections.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
