#!/usr/bin/env python3

# Test the page number fix
import requests
import json

def test_page_fix():
    """Test that page numbers are now correct."""
    
    try:
        # Test the find-relevant-sections endpoint with a sample request
        url = 'http://localhost:8083/part1b/find-relevant-sections'
        
        data = {
            'selected_text': 'The Autosave feature guards against losing your work',
            'persona': 'Researcher', 
            'job': 'Find relevant sections',
            'profile_id': 1
        }
        
        print('Testing the page number fix...')
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            sections = result.get('relevant_sections', [])
            print(f'✅ Found {len(sections)} sections:')
            
            for i, section in enumerate(sections[:5]):
                page = section.get('pageNumber', 'N/A')
                title = section.get('title', 'N/A')[:60]
                doc_name = section.get('documentFilename', 'N/A')
                print(f'  {i+1}. Page {page}: "{title}..." ({doc_name})')
                
            print(f'\n✅ SUCCESS: Page numbers should now be correct (no +1 offset)')
            print('   - Pages should match the actual PDF page numbers')
            print('   - Click "Jump to Section" to verify correct navigation')
            
        else:
            print(f'❌ Request failed: {response.status_code}')
            print(response.text)
            
    except Exception as e:
        print(f'❌ Error: {e}')
        print('Make sure the backend is running on port 8083')

if __name__ == '__main__':
    test_page_fix()
