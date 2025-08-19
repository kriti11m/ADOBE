#!/usr/bin/env python3

import os
from app.part1a.pdf_structure_extractor import MultilingualPDFExtractor

def debug_page_conversion():
    """Debug where page number conversion happens."""
    
    # Create an instance
    extractor = MultilingualPDFExtractor()
    
    # Override _get_text_blocks to see page_idx values
    original_get_text_blocks = extractor._get_text_blocks
    
    def debug_get_text_blocks(doc, page_count):
        print(f'_get_text_blocks called with page_count={page_count}')
        
        blocks = []
        for page_idx in range(min(3, page_count)):  # Only first 3 pages for debugging
            print(f'  Processing page_idx={page_idx}')
            page = doc[page_idx]
            text_data = page.get_text("dict")
            page_rect = page.rect
            
            for block in text_data.get("blocks", []):
                if "lines" not in block:  
                    continue
                
                # Debug the call to _process_block_lines
                print(f'    Calling _process_block_lines with page_idx={page_idx}')
                processed_blocks = extractor._process_block_lines(
                    block["lines"], page_idx, page_rect
                )
                
                # Check what page numbers are in the processed blocks
                for pb in processed_blocks:
                    if pb and len(pb.get('text', '')) > 10:
                        text_preview = pb['text'][:30] + ('...' if len(pb['text']) > 30 else '')
                        print(f'      Block result: page={pb.get("page")}, text="{text_preview}"')
                        break  # Just show first block per page
                        
                blocks.extend(processed_blocks)
                break  # Just process first text block per page for debugging
                
        return blocks
    
    extractor._get_text_blocks = debug_get_text_blocks
    
    # Test with a PDF
    pdf_path = 'data/collections'
    pdf_files = [f for f in os.listdir(pdf_path) if f.endswith('.pdf')]
    if pdf_files:
        pdf_file = os.path.join(pdf_path, pdf_files[0])
        print(f'Testing with: {os.path.basename(pdf_file)}')
        print('=' * 50)
        
        result = extractor.extract_structure(pdf_file)
        
        print('=' * 50)
        print('Final outline:')
        outline = result.get('outline', [])
        for i, item in enumerate(outline[:3]):
            page_num = item.get('page', 'N/A')
            text = item.get('text', '')[:30] + ('...' if len(item.get('text', '')) > 30 else '')
            print(f'  Final outline {i+1}: page={page_num}, text="{text}"')
            
    else:
        print('No PDF found')

if __name__ == '__main__':
    debug_page_conversion()
