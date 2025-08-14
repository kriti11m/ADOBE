"""
Database migration script to update UserProfile schema
Removes persona and job_description columns, adds description column
"""
import sqlite3
import os

def migrate_profiles_schema():
    """Migrate the user_profiles table to the new schema"""
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'pdf_collections.db')
    
    if not os.path.exists(db_path):
        print("Database file not found, skipping migration")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_profiles'
        """)
        
        if not cursor.fetchone():
            print("user_profiles table doesn't exist, skipping migration")
            conn.close()
            return
        
        # Check current schema
        cursor.execute("PRAGMA table_info(user_profiles)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        print(f"Current columns: {column_names}")
        
        # Create new table with updated schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles_new (
                id INTEGER PRIMARY KEY,
                profile_name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                is_default BOOLEAN DEFAULT 0
            )
        """)
        
        # Copy data from old table to new table
        if 'persona' in column_names and 'job_description' in column_names:
            # Old schema exists, migrate data
            cursor.execute("""
                INSERT INTO user_profiles_new (
                    id, profile_name, description, created_at, updated_at, is_active, is_default
                )
                SELECT 
                    id, 
                    profile_name, 
                    CASE 
                        WHEN job_description IS NOT NULL AND job_description != '' 
                        THEN job_description 
                        ELSE NULL 
                    END as description,
                    created_at, 
                    updated_at, 
                    is_active, 
                    is_default
                FROM user_profiles
            """)
            print("Data migrated from old schema")
        elif 'description' not in column_names:
            # Current schema without description, copy as is
            cursor.execute("""
                INSERT INTO user_profiles_new (
                    id, profile_name, created_at, updated_at, is_active, is_default
                )
                SELECT 
                    id, profile_name, created_at, updated_at, is_active, is_default
                FROM user_profiles
            """)
            print("Data migrated without description")
        else:
            print("Schema already up to date")
            conn.close()
            return
        
        # Drop old table and rename new table
        cursor.execute("DROP TABLE user_profiles")
        cursor.execute("ALTER TABLE user_profiles_new RENAME TO user_profiles")
        
        # Commit changes
        conn.commit()
        print("✅ Profile schema migration completed successfully")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_profiles_schema()
