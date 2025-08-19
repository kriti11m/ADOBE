import sqlite3
import os

db_path = 'c:/ADOBE/combined-backend/data/pdf_collections.db'
print(f"Database file exists: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables in database: {tables}")
    conn.close()
else:
    print("Database file does not exist!")
