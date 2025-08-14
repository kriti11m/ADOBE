import hashlib
import os
import shutil
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database.database import get_db
from ..database.models import PDFCollection, PDFDocument

router = APIRouter(prefix="/collections", tags=["PDF Collections"])

@router.post("/create")
async def create_collection(
    name: str = Form(...),
    files: List[UploadFile] = File(...),
    description: str = Form(None),
    profile_id: int = Form(None),
    db: Session = Depends(get_db)
):
    """
    Create a new PDF collection with uploaded files.
    
    Args:
        name: Collection name
        files: List of PDF files
        description: Optional collection description
        db: Database session
        
    Returns:
        Dict containing collection info and document IDs
    """
    try:
        # Require profile_id - no default profile logic
        if profile_id is None:
            raise HTTPException(status_code=400, detail="Profile ID is required")
        
        # Create collection in database
        new_collection = PDFCollection(
            name=name,
            description=description,
            profile_id=profile_id,
            status="ready"
        )
        db.add(new_collection)
        db.flush()  # Get the ID without committing
        
        collection_documents = []
        collection_dir = os.path.abspath(f"data/collections/{new_collection.id}")
        os.makedirs(collection_dir, exist_ok=True)
        
        for file in files:
            # Validate file type
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
            
            # Read file content and calculate hash
            file_content = await file.read()
            file_hash = hashlib.sha256(file_content).hexdigest()
            
            print(f"📄 Processing file: {file.filename}")
            print(f"📁 Target collection directory: {collection_dir}")
            
            # Check if document already exists
            existing_doc = db.query(PDFDocument).filter(PDFDocument.file_hash == file_hash).first()
            
            if existing_doc:
                print(f"🔍 Found existing document with same hash: {existing_doc.file_path}")
                # Use existing document but update its path to the collection directory
                permanent_file_path = os.path.join(collection_dir, file.filename)
                
                # If the existing document has a temp path or the file doesn't exist, save to permanent location
                if not existing_doc.file_path or not os.path.exists(existing_doc.file_path) or 'temp' in existing_doc.file_path.lower():
                    print(f"💾 Saving file to permanent location: {permanent_file_path}")
                    with open(permanent_file_path, 'wb') as f:
                        f.write(file_content)
                    existing_doc.file_path = permanent_file_path
                    db.flush()
                    print(f"✅ Updated existing document path to: {permanent_file_path}")
                
                document = existing_doc
            else:
                # Save file to disk in permanent location
                file_path = os.path.join(collection_dir, file.filename)
                print(f"💾 Creating new document at: {file_path}")
                with open(file_path, 'wb') as f:
                    f.write(file_content)
                
                # Create new document record
                document = PDFDocument(
                    filename=file.filename,
                    file_path=file_path,
                    file_size=len(file_content),
                    file_hash=file_hash
                )
                db.add(document)
                db.flush()
                print(f"✅ Created new document: {file_path}")
            
            # Add document to collection
            new_collection.documents.append(document)
            collection_documents.append({
                "id": document.id,
                "filename": document.filename,
                "file_size": document.file_size,
                "upload_timestamp": document.upload_timestamp.isoformat()
            })
        
        db.commit()
        
        return {
            "collection_id": new_collection.id,
            "name": new_collection.name,
            "description": new_collection.description,
            "created_at": new_collection.created_at.isoformat(),
            "status": new_collection.status,
            "documents": collection_documents,
            "document_count": len(collection_documents)
        }
        
    except Exception as e:
        db.rollback()
        # Clean up any created files
        if 'collection_dir' in locals() and os.path.exists(collection_dir):
            shutil.rmtree(collection_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Error creating collection: {str(e)}")

@router.get("/")
async def get_collections(
    limit: int = 100,
    offset: int = 0,
    profile_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all collections, optionally filtered by profile."""
    try:
        query = db.query(PDFCollection)
        
        if profile_id is not None:
            query = query.filter(PDFCollection.profile_id == profile_id)
            
        collections = query.order_by(desc(PDFCollection.created_at)).offset(offset).limit(limit).all()
        
        result = []
        for collection in collections:
            collection_data = {
                "id": collection.id,
                "name": collection.name,
                "description": collection.description,
                "profile_id": collection.profile_id,
                "profile_name": collection.profile.profile_name if collection.profile else None,
                "created_at": collection.created_at.isoformat(),
                "updated_at": collection.updated_at.isoformat(),
                "status": collection.status,
                "document_count": len(collection.documents),
                "documents": [
                    {
                        "id": doc.id,
                        "filename": doc.filename,
                        "file_size": doc.file_size,
                        "upload_timestamp": doc.upload_timestamp.isoformat()
                    }
                    for doc in collection.documents
                ]
            }
            result.append(collection_data)
        
        return {
            "collections": result,
            "total": len(result)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collections: {str(e)}")

@router.get("/{collection_id}")
async def get_collection(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific collection with all its documents."""
    try:
        collection = db.query(PDFCollection).filter(PDFCollection.id == collection_id).first()
        
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        return {
            "id": collection.id,
            "name": collection.name,
            "description": collection.description,
            "created_at": collection.created_at.isoformat(),
            "updated_at": collection.updated_at.isoformat(),
            "status": collection.status,
            "documents": [
                {
                    "id": doc.id,
                    "filename": doc.filename,
                    "file_path": doc.file_path,
                    "file_size": doc.file_size,
                    "upload_timestamp": doc.upload_timestamp.isoformat()
                }
                for doc in collection.documents
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collection: {str(e)}")

@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db)
):
    """Delete a collection (but keep the documents)."""
    try:
        collection = db.query(PDFCollection).filter(PDFCollection.id == collection_id).first()
        
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Remove collection directory
        collection_dir = f"data/collections/{collection_id}"
        if os.path.exists(collection_dir):
            shutil.rmtree(collection_dir, ignore_errors=True)
        
        db.delete(collection)
        db.commit()
        
        return {"message": f"Collection '{collection.name}' deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting collection: {str(e)}")
