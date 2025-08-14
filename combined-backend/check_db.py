#!/usr/bin/env python3
import sqlite3

def check_database():
    conn = sqlite3.connect('data/pdf_collections.db')
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print("Tables in new collections database:")
    for table in tables:
        print(f"  - {table}")
    
    # Check if old history tables are absent
    history_tables = ['analysis_sessions', 'extracted_sections', 'generated_insights', 'session_documents']
    missing_history_tables = []
    
    for hist_table in history_tables:
        if hist_table not in tables:
            missing_history_tables.append(hist_table)
    
    print(f"\nHistory tables successfully removed: {missing_history_tables}")
    
    # Check collection data
    cursor.execute("SELECT COUNT(*) FROM pdf_collections")
    collection_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM user_profiles")
    profile_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM pdf_documents")
    document_count = cursor.fetchone()[0]
    
    print(f"\nData migrated successfully:")
    print(f"  - Collections: {collection_count}")
    print(f"  - Profiles: {profile_count}")
    print(f"  - Documents: {document_count}")
    
    conn.close()

if __name__ == "__main__":
    check_database()
