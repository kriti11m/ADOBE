from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..database.database import get_db
from ..services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["User Profiles"])

class ProfileCreate(BaseModel):
    profile_name: str
    description: Optional[str] = None

class ProfileUpdate(BaseModel):
    profile_name: Optional[str] = None
    description: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    profile_name: str
    description: Optional[str] = None
    is_default: bool
    is_active: bool
    created_at: str
    updated_at: str

@router.post("/", response_model=Dict[str, Any])
async def create_profile(
    profile_data: ProfileCreate,
    db: Session = Depends(get_db)
):
    """Create a new user profile"""
    try:
        profile_service = ProfileService(db)
        
        # Check if profile name already exists
        existing_profile = profile_service.get_profile_by_name(profile_data.profile_name)
        if existing_profile:
            raise HTTPException(
                status_code=400, 
                detail=f"Profile with name '{profile_data.profile_name}' already exists"
            )
        
        profile = profile_service.create_profile(
            profile_name=profile_data.profile_name,
            description=profile_data.description
        )
        
        return {
            "id": profile.id,
            "profile_name": profile.profile_name,
            "persona": profile.persona,
            "job_description": profile.job_description,
            "is_active": profile.is_active,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat(),
            "message": "Profile created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")

@router.get("/", response_model=Dict[str, Any])
async def get_all_profiles(db: Session = Depends(get_db)):
    """Get all active user profiles"""
    try:
        profile_service = ProfileService(db)
        profiles = profile_service.get_all_profiles()
        
        return {
            "profiles": [
                {
                    "id": profile.id,
                    "profile_name": profile.profile_name,
                    "persona": profile.persona,
                    "job_description": profile.job_description,
                    "is_default": profile.is_default,
                    "is_active": profile.is_active,
                    "created_at": profile.created_at.isoformat(),
                    "updated_at": profile.updated_at.isoformat()
                }
                for profile in profiles
            ],
            "total": len(profiles)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profiles: {str(e)}")

@router.get("/{profile_id}", response_model=Dict[str, Any])
async def get_profile(
    profile_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific profile by ID"""
    try:
        profile_service = ProfileService(db)
        profile = profile_service.get_profile_by_id(profile_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "id": profile.id,
            "profile_name": profile.profile_name,
            "persona": profile.persona,
            "job_description": profile.job_description,
            "is_default": profile.is_default,
            "is_active": profile.is_active,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile: {str(e)}")

@router.put("/{profile_id}", response_model=Dict[str, Any])
async def update_profile(
    profile_id: int,
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing profile"""
    try:
        profile_service = ProfileService(db)
        
        # Check if new profile name already exists (if provided)
        if profile_data.profile_name:
            existing_profile = profile_service.get_profile_by_name(profile_data.profile_name)
            if existing_profile and existing_profile.id != profile_id:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Profile with name '{profile_data.profile_name}' already exists"
                )
        
        profile = profile_service.update_profile(
            profile_id=profile_id,
            profile_name=profile_data.profile_name,
            description=profile_data.description
        )
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {
            "id": profile.id,
            "profile_name": profile.profile_name,
            "persona": profile.persona,
            "job_description": profile.job_description,
            "is_active": profile.is_active,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat(),
            "message": "Profile updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

@router.delete("/{profile_id}", response_model=Dict[str, str])
async def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a profile"""
    try:
        profile_service = ProfileService(db)
        success = profile_service.delete_profile(profile_id)
        
        if not success:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete profile - it may not exist or be the only remaining profile"
            )
        
        return {"message": "Profile deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")

@router.get("/{profile_id}/stats", response_model=Dict[str, Any])
async def get_profile_stats(
    profile_id: int,
    db: Session = Depends(get_db)
):
    """Get statistics for a specific profile"""
    try:
        profile_service = ProfileService(db)
        stats = profile_service.get_profile_stats(profile_id)
        
        if not stats:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return stats
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching profile stats: {str(e)}")

# History endpoint removed - no longer tracking analysis sessions
