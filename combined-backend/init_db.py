#!/usr/bin/env python3
"""
Initialize the database with simplified schema
Only PDF documents table - no profiles or collections
"""

def init_database():
    """Create all database tables"""
    # Import here to avoid circular imports
    from app.database.database import engine, Base
    from app.database import models  # This will register all models
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print("📄 Created table: pdf_documents")
    print(f"📁 Database location: data/pdf_collections.db")

if __name__ == "__main__":
    init_database()

if __name__ == "__main__":
    init_database()
