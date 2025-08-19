#!/usr/bin/env python3

import os
import fitz

def test_raw_page_indexing():
    """Test raw PyMuPDF page indexing."""
    
    pdf_path = 'data/collections'
    pdf_files = [f for f in os.listdir(pdf_path) if f.endswith('.pdf')]
    if pdf_files:
        pdf_file = os.path.join(pdf_path, pdf_files[0])
        print(f'Testing with: {os.path.basename(pdf_file)}')
        
        doc = fitz.open(pdf_file)
        print(f'PDF has {len(doc)} pages')
        
        # Test first few pages
        for page_idx in range(min(5, len(doc))):
            page = doc[page_idx]
            print(f'PyMuPDF: page_idx={page_idx}, page.number={page.number}')
            
            # Get first text block from page
            text_data = page.get_text("dict")
            blocks = text_data.get("blocks", [])
            text_blocks = [b for b in blocks if "lines" in b]
            
            if text_blocks:
                lines = text_blocks[0].get("lines", [])
                if lines:
                    spans = lines[0].get("spans", [])
                    if spans:
                        first_text = spans[0].get("text", "").strip()
                        if first_text:
                            print(f'  First text on page {page_idx}: "{first_text[:50]}..."')
        
        doc.close()
    else:
        print('No PDF found')

if __name__ == '__main__':
    test_raw_page_indexing()
