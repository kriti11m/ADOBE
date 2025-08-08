import json, os
from typing import List, Dict, Any

def load_input_json(path: str) -> Dict[str, Any]:
    """
    Reads `input.json` and returns:
        pdf_paths   -> list of absolute paths to the PDFs
        persona     -> str
        job         -> str
    
    Supports both old format (with documents array) and new format (with pdf_paths array)
    """
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    # Handle new format (with pdf_paths array)
    if "pdf_paths" in data:
        return {
            "pdf_paths": data["pdf_paths"],
            "persona": data["persona"],
            "job": data["job"]
        }
    
    # Handle old format (with documents array)
    elif "documents" in data:
        base_dir = os.path.dirname(path)
        pdf_paths = [os.path.join(base_dir, doc["filename"]) for doc in data["documents"]]
        return {
            "pdf_paths": pdf_paths,
            "persona": data["persona"]["role"],
            "job": data["job_to_be_done"]["task"]
        }
    
    else:
        raise ValueError("Input JSON must contain either 'pdf_paths' (new format) or 'documents' (old format)")