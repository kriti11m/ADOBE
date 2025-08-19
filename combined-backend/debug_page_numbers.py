#!/usr/bin/env python3

import os
from app.part1a.pdf_structure_extractor import MultilingualPDFExtractor

def debug_page_numbers():
    """Debug page number assignments in PDF structure extractor."""
    
    # Create an instance and patch it to trace page assignments
    extractor = MultilingualPDFExtractor()

    # Override _make_text_block to debug page assignment
    original_make_text_block = extractor._make_text_block

    def debug_make_text_block(spans, page_num, page_rect):
        result = original_make_text_block(spans, page_num, page_rect)
        if result and len(result.get('text', '')) > 10:
            text_preview = result['text'][:30] + ('...' if len(result['text']) > 30 else '')
            print(f'TEXT BLOCK: page_num={page_num}, stored_page={result.get("page")}, text="{text_preview}"')
        return result

    extractor._make_text_block = debug_make_text_block

    # Override _format_headings to debug final output
    original_format_headings = extractor._format_headings

    def debug_format_headings(headings):
        print(f'\nFORMAT_HEADINGS: Processing {len(headings)} headings:')
        for i, heading in enumerate(headings[:3]):
            text_preview = heading.get('text', '')[:30] + ('...' if len(heading.get('text', '')) > 30 else '')
            print(f'  {i+1}. raw_page={heading.get("page")}, text="{text_preview}"')
        
        result = original_format_headings(headings)
        
        print(f'\nFINAL_OUTLINE: Generated {len(result)} outline items:')
        for i, item in enumerate(result[:3]):
            text_preview = item.get('text', '')[:30] + ('...' if len(item.get('text', '')) > 30 else '')
            print(f'  {i+1}. final_page={item.get("page")}, text="{text_preview}"')
        
        return result

    extractor._format_headings = debug_format_headings

    # Test with a PDF
    pdf_path = 'data/collections'
    pdf_files = [f for f in os.listdir(pdf_path) if f.endswith('.pdf')]
    if pdf_files:
        pdf_file = os.path.join(pdf_path, pdf_files[0])
        print(f'Testing with: {os.path.basename(pdf_file)}')
        print('=' * 50)
        result = extractor.extract_structure(pdf_file)
        print('=' * 50)
        print('SUMMARY:')
        outline = result.get('outline', [])
        for item in outline[:3]:
            print(f'  Page {item.get("page")}: {item.get("text", "N/A")[:50]}...')
    else:
        print('No PDF found')

if __name__ == '__main__':
    debug_page_numbers()
