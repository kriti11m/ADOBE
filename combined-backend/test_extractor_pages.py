#!/usr/bin/env python3

import os
from app.part1a.pdf_structure_extractor import MultilingualPDFExtractor

def test_extractor_pages():
    """Test the PDF extractor's page assignments."""
    
    # Create an instance
    extractor = MultilingualPDFExtractor()
    
    # Test with a PDF
    pdf_path = 'data/collections'
    pdf_files = [f for f in os.listdir(pdf_path) if f.endswith('.pdf')]
    if pdf_files:
        pdf_file = os.path.join(pdf_path, pdf_files[0])
        print(f'Testing with: {os.path.basename(pdf_file)}')
        
        # Extract raw text blocks first
        import fitz
        doc = fitz.open(pdf_file)
        raw_blocks = extractor._get_text_blocks(doc, min(3, len(doc)))
        doc.close()
        
        print(f'\nRaw text blocks from first 3 pages:')
        for i, block in enumerate(raw_blocks[:10]):  # Show first 10 blocks
            page_num = block.get('page', 'N/A')
            text = block.get('text', '')[:40] + ('...' if len(block.get('text', '')) > 40 else '')
            print(f'  Block {i+1}: page={page_num}, text="{text}"')
        
        # Now extract full structure
        print(f'\nFull structure extraction:')
        result = extractor.extract_structure(pdf_file)
        outline = result.get('outline', [])
        
        print(f'Outline items from structure:')
        for i, item in enumerate(outline[:5]):
            page_num = item.get('page', 'N/A')
            text = item.get('text', '')[:40] + ('...' if len(item.get('text', '')) > 40 else '')
            print(f'  Outline {i+1}: page={page_num}, text="{text}"')
            
    else:
        print('No PDF found')

if __name__ == '__main__':
    test_extractor_pages()
