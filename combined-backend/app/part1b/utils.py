"""
Utility Functions
Helper functions for the document analysis system
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List

def load_config(config_path: str) -> Dict:
    """Load configuration from file"""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_json(data: Dict, filepath: str) -> None:
    """Save data to JSON file"""
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)

def format_timestamp() -> str:
    """Get formatted timestamp"""
    return datetime.now().isoformat()

def validate_pdf_path(path: str) -> bool:
    """Validate PDF file path"""
    import os
    return path.lower().endswith('.pdf') and os.path.exists(path)

def chunk_text(text: str, max_length: int = 500) -> List[str]:
    """Split text into chunks"""
    sentences = re.split(r'[.!?]+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_length:
            current_chunk += sentence + ". "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks