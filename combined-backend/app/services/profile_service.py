from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..database.models import UserProfile, AnalysisSession, PDFCollection

class ProfileService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_profile(self, profile_name: str, persona: str, job_description: str) -> UserProfile:
        """Create a new user profile"""
        profile = UserProfile(
            profile_name=profile_name,
            persona=persona,
            job_description=job_description,
            is_default=False
        )
        
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def get_all_profiles(self) -> List[UserProfile]:
        """Get all active profiles"""
        return (
            self.db.query(UserProfile)
            .filter(UserProfile.is_active == True)
            .order_by(UserProfile.is_default.desc(), UserProfile.created_at.desc())
            .all()
        )
    
    def get_profile_by_id(self, profile_id: int) -> Optional[UserProfile]:
        """Get profile by ID"""
        return (
            self.db.query(UserProfile)
            .filter(and_(UserProfile.id == profile_id, UserProfile.is_active == True))
            .first()
        )
    
    def get_profile_by_name(self, profile_name: str) -> Optional[UserProfile]:
        """Get profile by name"""
        return (
            self.db.query(UserProfile)
            .filter(and_(UserProfile.profile_name == profile_name, UserProfile.is_active == True))
            .first()
        )
    
    def get_default_profile(self) -> Optional[UserProfile]:
        """Get the default profile"""
        return (
            self.db.query(UserProfile)
            .filter(and_(UserProfile.is_default == True, UserProfile.is_active == True))
            .first()
        )
    
    def update_profile(self, profile_id: int, profile_name: str = None, 
                      persona: str = None, job_description: str = None) -> Optional[UserProfile]:
        """Update an existing profile"""
        profile = self.get_profile_by_id(profile_id)
        if not profile:
            return None
        
        # Update fields if provided
        if profile_name is not None:
            profile.profile_name = profile_name
        if persona is not None:
            profile.persona = persona
        if job_description is not None:
            profile.job_description = job_description
        
        profile.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def delete_profile(self, profile_id: int) -> bool:
        """Soft delete a profile (mark as inactive)"""
        profile = self.get_profile_by_id(profile_id)
        if not profile:
            return False
        
        # Don't allow deletion of default profile if it's the only one
        if profile.is_default:
            active_profiles_count = (
                self.db.query(UserProfile)
                .filter(UserProfile.is_active == True)
                .count()
            )
            if active_profiles_count <= 1:
                return False  # Can't delete the only profile
        
        profile.is_active = False
        profile.updated_at = datetime.utcnow()
        
        # If deleting default profile, set another as default
        if profile.is_default:
            new_default = (
                self.db.query(UserProfile)
                .filter(and_(
                    UserProfile.is_active == True,
                    UserProfile.id != profile_id
                ))
                .first()
            )
            if new_default:
                new_default.is_default = True
        
        self.db.commit()
        return True
    
    def set_default_profile(self, profile_id: int) -> bool:
        """Set a profile as the default"""
        profile = self.get_profile_by_id(profile_id)
        if not profile:
            return False
        
        # Unset all other defaults
        self.db.query(UserProfile).update({UserProfile.is_default: False})
        
        # Set new default
        profile.is_default = True
        profile.updated_at = datetime.utcnow()
        
        self.db.commit()
        return True
    
    def get_profile_stats(self, profile_id: int) -> Dict[str, Any]:
        """Get statistics for a specific profile"""
        profile = self.get_profile_by_id(profile_id)
        if not profile:
            return {}
        
        total_sessions = (
            self.db.query(AnalysisSession)
            .filter(AnalysisSession.profile_id == profile_id)
            .count()
        )
        
        total_collections = (
            self.db.query(PDFCollection)
            .filter(PDFCollection.profile_id == profile_id)
            .count()
        )
        
        return {
            "profile_id": profile_id,
            "profile_name": profile.profile_name,
            "persona": profile.persona,
            "job_description": profile.job_description,
            "total_sessions": total_sessions,
            "total_collections": total_collections,
            "created_at": profile.created_at.isoformat(),
            "is_default": profile.is_default
        }
    
    def ensure_default_profile_exists(self) -> UserProfile:
        """Ensure at least one default profile exists"""
        default_profile = self.get_default_profile()
        if not default_profile:
            # Check if any profiles exist
            any_profile = (
                self.db.query(UserProfile)
                .filter(UserProfile.is_active == True)
                .first()
            )
            
            if any_profile:
                # Set the first active profile as default
                any_profile.is_default = True
                self.db.commit()
                return any_profile
            else:
                # Create a default profile
                return self.create_profile(
                    profile_name="Default Profile",
                    persona="Researcher",
                    job_description="Analyze documents for relevant insights",
                    is_default=True
                )
        
        return default_profile
