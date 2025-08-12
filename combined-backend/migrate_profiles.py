"""
Database migration script for profile system
This script will add the profile tables and migrate existing data
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.database.models import UserProfile, AnalysisSession, PDFCollection
import os

DATABASE_URL = "sqlite:///./data/pdf_history.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate_database():
    """Migrate database to include profile system"""
    
    print("🔄 Starting database migration for profile system...")
    
    # Create all tables
    print("📋 Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")
    
    db = SessionLocal()
    try:
        # Check if columns need to be added
        print("🔍 Checking if migration is needed...")
        
        # Check if profile_id column exists in analysis_sessions
        try:
            db.execute(text("SELECT profile_id FROM analysis_sessions LIMIT 1"))
            sessions_have_profile = True
        except Exception:
            sessions_have_profile = False
            print("📋 Need to add profile_id to analysis_sessions table")
        
        # Check if profile_id column exists in pdf_collections
        try:
            db.execute(text("SELECT profile_id FROM pdf_collections LIMIT 1"))
            collections_have_profile = True
        except Exception:
            collections_have_profile = False
            print("📋 Need to add profile_id to pdf_collections table")
        
        # Create default profile first
        default_profile = db.query(UserProfile).filter(UserProfile.is_default == True).first()
        
        if not default_profile:
            print("👤 Creating default profile...")
            default_profile = UserProfile(
                profile_name="Default Profile",
                persona="Researcher",
                job_description="Analyze documents for relevant insights and information",
                is_default=True,
                is_active=True
            )
            db.add(default_profile)
            db.commit()
            db.refresh(default_profile)
            print(f"✅ Created default profile with ID: {default_profile.id}")
        else:
            print(f"✅ Default profile already exists with ID: {default_profile.id}")
        
        # Add profile_id column to analysis_sessions if needed
        if not sessions_have_profile:
            print("� Adding profile_id column to analysis_sessions...")
            db.execute(text(f"ALTER TABLE analysis_sessions ADD COLUMN profile_id INTEGER REFERENCES user_profiles(id)"))
            print("✅ Added profile_id column to analysis_sessions")
            
            # Update existing sessions to use default profile
            print("📊 Updating existing analysis sessions...")
            db.execute(text(f"UPDATE analysis_sessions SET profile_id = {default_profile.id} WHERE profile_id IS NULL"))
            db.commit()
            print("✅ Updated existing sessions to use default profile")
        
        # Add profile_id column to pdf_collections if needed
        if not collections_have_profile:
            print("� Adding profile_id column to pdf_collections...")
            db.execute(text(f"ALTER TABLE pdf_collections ADD COLUMN profile_id INTEGER REFERENCES user_profiles(id)"))
            print("✅ Added profile_id column to pdf_collections")
            
            # Update existing collections to use default profile
            print("📁 Updating existing collections...")
            db.execute(text(f"UPDATE pdf_collections SET profile_id = {default_profile.id} WHERE profile_id IS NULL"))
            db.commit()
            print("✅ Updated existing collections to use default profile")
        
        print("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def create_sample_profiles():
    """Create some sample profiles for testing"""
    print("👥 Creating sample profiles...")
    
    db = SessionLocal()
    try:
        sample_profiles = [
            {
                "profile_name": "Academic Researcher",
                "persona": "PhD Researcher in Computer Science",
                "job_description": "Conducting literature reviews and extracting methodological insights from academic papers for my dissertation research",
                "is_default": False
            },
            {
                "profile_name": "Investment Analyst",
                "persona": "Senior Financial Analyst",
                "job_description": "Analyzing company reports and market research to extract key financial metrics and investment opportunities",
                "is_default": False
            },
            {
                "profile_name": "Medical Student",
                "persona": "Third-year Medical Student",
                "job_description": "Studying medical literature and case studies to understand disease mechanisms and treatment protocols",
                "is_default": False
            },
            {
                "profile_name": "Legal Researcher",
                "persona": "Corporate Lawyer",
                "job_description": "Reviewing legal documents and case law to identify relevant precedents and regulatory requirements",
                "is_default": False
            }
        ]
        
        for profile_data in sample_profiles:
            # Check if profile already exists
            existing = db.query(UserProfile).filter(UserProfile.profile_name == profile_data["profile_name"]).first()
            if not existing:
                profile = UserProfile(**profile_data)
                db.add(profile)
        
        db.commit()
        print("✅ Sample profiles created successfully")
        
    except Exception as e:
        print(f"❌ Failed to create sample profiles: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    success = migrate_database()
    if success:
        create_sample_profiles()
        print("\n🚀 Migration complete! You can now start the backend server.")
    else:
        print("\n❌ Migration failed. Please check the errors above.")
