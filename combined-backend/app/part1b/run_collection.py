#!/usr/bin/env python3
"""
Helper script to run document analysis on collections
Usage: python run_collection.py collection1
"""

import sys
import subprocess
import os

def run_collection(collection_name):
    """Run analysis on a specific collection"""
    if not os.path.exists(f"sample_data/{collection_name}"):
        print(f"Collection '{collection_name}' not found!")
        print("Available collections:")
        for item in os.listdir("sample_data"):
            if os.path.isdir(os.path.join("sample_data", item)) and item.startswith("collection"):
                print(f"  - {item}")
        return False
    
    print(f"Running analysis on collection: {collection_name}")
    print("=" * 50)
    
    # Run the main script with the collection argument
    result = subprocess.run([
        sys.executable, "main.py", 
        "--collection", collection_name
    ], capture_output=False)
    
    if result.returncode == 0:
        print(f"\n✅ Analysis completed successfully for {collection_name}")
        print(f"Results saved to: sample_data/{collection_name}/output.json")
        return True
    else:
        print(f"\n❌ Analysis failed for {collection_name}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python run_collection.py <collection_name>")
        print("Example: python run_collection.py collection1")
        return
    
    collection_name = sys.argv[1]
    run_collection(collection_name)

if __name__ == "__main__":
    main() 