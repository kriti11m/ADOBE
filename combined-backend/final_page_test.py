#!/usr/bin/env python3

import os
from app.part1a.pdf_structure_extractor import MultilingualPDFExtractor

def final_page_test():
    """Final definitive test of page indexing."""
    
    # Create an instance and patch _make_text_block
    extractor = MultilingualPDFExtractor()
    
    original_make_text_block = extractor._make_text_block
    
    def debug_make_text_block(spans, page_num, page_rect):
        result = original_make_text_block(spans, page_num, page_rect)
        if result and len(result.get('text', '')) > 10:
            text_preview = result['text'][:30] + ('...' if len(result['text']) > 30 else '')
            print(f'    _make_text_block: input_page_num={page_num}, stored_page={result.get("page")}, text="{text_preview}"')
        return result
    
    extractor._make_text_block = debug_make_text_block
    
    # Test with a PDF
    pdf_path = 'data/collections'
    pdf_files = [f for f in os.listdir(pdf_path) if f.endswith('.pdf')]
    if pdf_files:
        pdf_file = os.path.join(pdf_path, pdf_files[0])
        print(f'Testing with: {os.path.basename(pdf_file)}')
        print('=' * 60)
        
        # Also manually check the first few pages with PyMuPDF
        import fitz
        doc = fitz.open(pdf_file)
        print(f'PDF has {len(doc)} pages')
        
        for page_idx in range(min(3, len(doc))):
            page = doc[page_idx]
            print(f'\\nMANUAL CHECK: PyMuPDF page_idx={page_idx}, page.number={page.number}')
            
            text_data = page.get_text("dict")
            blocks = text_data.get("blocks", [])
            text_blocks = [b for b in blocks if "lines" in b]
            
            if text_blocks and text_blocks[0].get("lines"):
                lines = text_blocks[0]["lines"]
                if lines and lines[0].get("spans"):
                    spans = lines[0]["spans"]
                    if spans:
                        first_text = spans[0].get("text", "").strip()
                        if first_text:
                            print(f'  First text: "{first_text[:30]}..."')
                            print(f'  EXPECTED: page_num={page_idx} should be stored as page={page_idx}')
        
        doc.close()
        
        print(f'\\n{"="*60}')
        print('PDF EXTRACTOR OUTPUT:')
        result = extractor.extract_structure(pdf_file)
        
        print(f'\\n{"="*60}')
        print('FINAL SUMMARY:')
        outline = result.get('outline', [])
        for i, item in enumerate(outline[:5]):
            page_num = item.get('page', 'N/A')
            text = item.get('text', '')[:30] + ('...' if len(item.get('text', '')) > 30 else '')
            print(f'  Outline item {i+1}: page={page_num}, text="{text}"')
            
    else:
        print('No PDF found')

if __name__ == '__main__':
    final_page_test()
