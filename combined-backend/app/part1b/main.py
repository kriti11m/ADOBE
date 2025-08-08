#!/usr/bin/env python3
"""
Main script for the document analysis system
Handles PDF processing and generates analysis results
"""

import os
import glob
import json
import sys
import argparse
from datetime import datetime
from src.pipeline import DocumentAnalysisPipeline
from src.input_loader import load_input_json

def main():
    """Main function - processes PDFs and generates analysis"""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Document Analysis Pipeline')
    parser.add_argument('--input_json', type=str, help='Path to input JSON configuration file')
    parser.add_argument('--collection', type=str, help='Collection name (e.g., collection1, collection2)')
    args = parser.parse_args()
    
    # Reduce annoying warnings
    os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
    
    # If no arguments provided, process all collections automatically
    if not args.input_json and not args.collection:
        print("No arguments provided. Processing all collections automatically...")
        process_all_collections()
        return
    
    # Determine input and output based on collection structure
    if args.collection:
        # Use collection-based structure
        collection_name = args.collection
        collection_folder = f"sample_data/{collection_name}"
        input_json_path = os.path.join(collection_folder, "input.json")
        output_json_path = os.path.join(collection_folder, "output.json")
        
        if not os.path.exists(collection_folder):
            print(f"Collection folder not found: {collection_folder}")
            return
            
        if not os.path.exists(input_json_path):
            print(f"Input JSON not found: {input_json_path}")
            return
            
        print(f"Using collection: {collection_name}")
        print(f"Input JSON: {input_json_path}")
        print(f"Output JSON: {output_json_path}")
        
        # Load configuration from the collection's input JSON
        try:
            config_data = load_input_json(input_json_path)
            user_persona = config_data["persona"]
            user_task = config_data["job"]
            pdf_paths = config_data["pdf_paths"]
            print(f"Loaded configuration from: {input_json_path}")
            print(f"Persona: {user_persona}")
            print(f"Task: {user_task}")
            print(f"Found {len(pdf_paths)} PDF files in configuration")
        except Exception as e:
            print(f"Error loading configuration from {input_json_path}: {e}")
            return
            
    elif args.input_json and os.path.exists(args.input_json):
        # Legacy support for direct input JSON path
        input_folder = os.path.dirname(args.input_json)
        output_folder = os.path.join(os.path.dirname(input_folder), "output")
        output_json_path = os.path.join(output_folder, "analysis_result.json")
        print(f"Using input folder: {input_folder}")
        print(f"Using output folder: {output_folder}")
        
        # Load configuration from the specified input JSON
        try:
            config_data = load_input_json(args.input_json)
            user_persona = config_data["persona"]
            user_task = config_data["job"]
            pdf_paths = config_data["pdf_paths"]
            print(f"Loaded configuration from: {args.input_json}")
            print(f"Persona: {user_persona}")
            print(f"Task: {user_task}")
            print(f"Found {len(pdf_paths)} PDF files in configuration")
        except Exception as e:
            print(f"Error loading configuration from {args.input_json}: {e}")
            return
    else:
        # Fallback to default behavior
        input_folder = "/app/input"
        output_folder = "/app/output"
        
        # If we're running locally, use the sample data folders
        if not os.path.exists(input_folder):
            input_folder = "sample_data/input"
            output_folder = "sample_data/output"
        
        output_json_path = os.path.join(output_folder, "analysis_result.json")
        print(f"Using default input folder: {input_folder}")
        
        # Default settings - can be overridden by input.json
        user_persona = "Document Analyst"
        user_task = "Extract and analyze the most relevant sections from these documents"
        
        # Check if there's an input.json file with custom settings
        input_config = os.path.join(input_folder, "input.json")
        if os.path.exists(input_config):
            try:
                config_data = load_input_json(input_config)
                # Handle persona as string or object
                persona_val = config_data.get("persona", user_persona)
                if isinstance(persona_val, dict):
                    user_persona = persona_val.get("role", user_persona)
                else:
                    user_persona = persona_val
                # Handle job as string or job_to_be_done as object
                job_val = config_data.get("job", None)
                if job_val is not None:
                    user_task = job_val
                else:
                    job_obj = config_data.get("job_to_be_done", None)
                    if isinstance(job_obj, dict):
                        user_task = job_obj.get("task", user_task)
                print(f"Using persona: {user_persona}")
                print(f"Using task: {user_task}")
            except Exception as e:
                print(f"Couldn't load input config: {e}")
        
        # Grab all the PDF files from the input folder
        pdf_paths = glob.glob(os.path.join(input_folder, "*.pdf"))
    
    if not pdf_paths:
        print("No PDF files found!")
        return
    
    print(f"Found {len(pdf_paths)} PDF files:")
    for pdf in pdf_paths:
        print(f"  - {os.path.basename(pdf)}")
    
    # Set up the analysis pipeline
    print("Setting up the analysis pipeline...")
    try:
        analyzer = DocumentAnalysisPipeline()
    except Exception as e:
        print(f"Failed to initialize pipeline: {e}")
        return
    
    # Process all the documents
    print("Starting document analysis...")
    try:
        print("DEBUG: About to call analyzer.process_documents...")
        analysis_result = analyzer.process_documents(pdf_paths, user_persona, user_task)
        print("DEBUG: analyzer.process_documents completed successfully")
        
        # Save the results
        print("DEBUG: About to save results...")
        output_dir = os.path.dirname(output_json_path)
        os.makedirs(output_dir, exist_ok=True)
        
        with open(output_json_path, 'w') as f:
            json.dump(analysis_result, f, indent=2)
        
        print(f"Analysis complete! Results saved to: {output_json_path}")
        
    except Exception as e:
        print(f"Processing failed: {e}")
        import traceback
        traceback.print_exc()
        return

def process_all_collections():
    """Process all collections automatically"""
    print("🔍 Scanning for collections...")
    
    # Find all collection folders
    collections = []
    sample_data_dir = "sample_data"
    if os.path.exists(sample_data_dir):
        for item in os.listdir(sample_data_dir):
            collection_path = os.path.join(sample_data_dir, item)
            if os.path.isdir(collection_path) and (item.startswith("collection") or item.startswith("Collection")):
                input_json_path = os.path.join(collection_path, "input.json")
                if os.path.exists(input_json_path):
                    collections.append(item)
    
    if not collections:
        print("❌ No collections found in sample_data/")
        print("Expected structure: sample_data/collection1/, collection2/, etc.")
        return
    
    print(f"✅ Found {len(collections)} collections: {', '.join(collections)}")
    
    # Process each collection
    for i, collection_name in enumerate(collections, 1):
        print(f"\n{'='*60}")
        print(f"📁 Processing Collection {i}/{len(collections)}: {collection_name}")
        print(f"{'='*60}")
        
        try:
            # Set up paths for this collection
            collection_folder = f"sample_data/{collection_name}"
            input_json_path = os.path.join(collection_folder, "input.json")
            output_json_path = os.path.join(collection_folder, "output.json")
            
            # Load configuration
            config_data = load_input_json(input_json_path)
            user_persona = config_data["persona"]
            user_task = config_data["job"]
            pdf_paths = config_data["pdf_paths"]
            
            print(f"📋 Persona: {user_persona}")
            print(f"🎯 Task: {user_task}")
            print(f"📄 PDFs: {len(pdf_paths)} files")
            
            # Set up pipeline
            analyzer = DocumentAnalysisPipeline()
            
            # Process documents
            analysis_result = analyzer.process_documents(pdf_paths, user_persona, user_task)
            
            # Save results
            with open(output_json_path, 'w') as f:
                json.dump(analysis_result, f, indent=2)
            
            print(f"✅ Collection {collection_name} completed successfully!")
            print(f"📁 Results saved to: {output_json_path}")
            
        except Exception as e:
            print(f"❌ Error processing collection {collection_name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"\n🎉 All collections processed! Check the output.json files in each collection folder.")

if __name__ == "__main__":
    main()