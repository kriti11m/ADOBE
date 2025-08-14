#!/usr/bin/env python3
"""
Migration script to remove history functionality and keep only profile-based collections
"""

import sqlite3
import os
from pathlib import Path

def migrate_from_history_db():
    """Migrate collections data from old history database to new collections database"""
    old_db_path = Path("data/pdf_history.db")
    new_db_path = Path("data/pdf_collections.db")
    
    if not old_db_path.exists():
        print("No old history database found. Starting fresh.")
        return
    
    if not new_db_path.exists():
        print("New collections database not found. Please run init_db.py first.")
        return
    
    print("Migrating collections data from history database...")
    
    try:
        # Connect to both databases
        old_conn = sqlite3.connect(old_db_path)
        new_conn = sqlite3.connect(new_db_path)
        
        old_cursor = old_conn.cursor()
        new_cursor = new_conn.cursor()
        
        # Check if collections table exists in old database
        old_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pdf_collections';")
        if old_cursor.fetchone():
            # Get all collections
            old_cursor.execute("""
                SELECT id, name, description, profile_id, created_at, updated_at, status 
                FROM pdf_collections
            """)
            collections = old_cursor.fetchall()
            
            # Insert collections into new database
            for collection in collections:
                new_cursor.execute("""
                    INSERT OR REPLACE INTO pdf_collections 
                    (id, name, description, profile_id, created_at, updated_at, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, collection)
                print(f"Migrated collection: {collection[1]}")
        
        # Check if user profiles exist in old database
        old_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles';")
        if old_cursor.fetchone():
            # Get all profiles
            old_cursor.execute("""
                SELECT id, profile_name, persona, job_description, created_at, updated_at, is_active, is_default
                FROM user_profiles
            """)
            profiles = old_cursor.fetchall()
            
            # Insert profiles into new database
            for profile in profiles:
                new_cursor.execute("""
                    INSERT OR REPLACE INTO user_profiles 
                    (id, profile_name, persona, job_description, created_at, updated_at, is_active, is_default)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, profile)
                print(f"Migrated profile: {profile[1]}")
        
        # Check if documents exist in old database
        old_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pdf_documents';")
        if old_cursor.fetchone():
            # Get all documents
            old_cursor.execute("""
                SELECT id, filename, file_path, file_size, upload_timestamp, file_hash
                FROM pdf_documents
            """)
            documents = old_cursor.fetchall()
            
            # Insert documents into new database
            for document in documents:
                new_cursor.execute("""
                    INSERT OR REPLACE INTO pdf_documents 
                    (id, filename, file_path, file_size, upload_timestamp, file_hash)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, document)
                print(f"Migrated document: {document[1]}")
        
        # Check if collection_documents relationship exists
        old_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='collection_documents';")
        if old_cursor.fetchone():
            # Get all collection-document relationships
            old_cursor.execute("""
                SELECT collection_id, document_id
                FROM collection_documents
            """)
            relationships = old_cursor.fetchall()
            
            # Insert relationships into new database
            for relationship in relationships:
                new_cursor.execute("""
                    INSERT OR REPLACE INTO collection_documents 
                    (collection_id, document_id)
                    VALUES (?, ?)
                """, relationship)
                print(f"Migrated collection-document relationship: {relationship}")
        
        # Commit changes
        new_conn.commit()
        
        # Close connections
        old_conn.close()
        new_conn.close()
        
        print("Migration completed successfully!")
        print(f"You can now safely delete the old database: {old_db_path}")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        
if __name__ == "__main__":
    migrate_from_history_db()
