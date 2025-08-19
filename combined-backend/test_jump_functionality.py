#!/usr/bin/env python3

# Test the jump to section functionality
import requests
import json
import sys

def test_jump_to_section():
    """Test the improved jump to section functionality."""
    
    print("🧪 Testing Jump to Section functionality...")
    
    try:
        # Test the find-relevant-sections endpoint
        url = 'http://localhost:8083/part1b/find-relevant-sections'
        
        test_cases = [
            "The Autosave feature guards against losing your work",
            "Operating System is a System Software",
            "certificate signatures",
        ]
        
        for i, selected_text in enumerate(test_cases, 1):
            print(f"\n--- Test Case {i}: '{selected_text[:30]}...' ---")
            
            data = {
                'text': selected_text,
                'persona': 'Researcher', 
                'job': 'Find relevant sections',
                'profile_id': 1
            }
            
            response = requests.post(url, json=data)
            
            if response.status_code == 200:
                result = response.json()
                sections = result.get('relevant_sections', [])
                
                print(f"✅ Found {len(sections)} sections:")
                
                for j, section in enumerate(sections[:3], 1):
                    page = section.get('pageNumber', section.get('page', 'N/A'))
                    title = section.get('title', section.get('section_title', 'N/A'))[:50]
                    doc_name = section.get('documentFilename', section.get('document_name', 'N/A'))
                    doc_id = section.get('documentId', section.get('document_id', 'N/A'))
                    
                    # Check if jump button would be enabled
                    button_enabled = page != 'N/A' and doc_id != 'N/A' and doc_id is not None
                    status = "🎯 ENABLED" if button_enabled else "❌ DISABLED"
                    
                    print(f"  {j}. {status} | Page: {page} | Doc ID: {doc_id} | Title: \"{title}...\" | Doc: {doc_name}")
                
                # Count enabled vs disabled buttons
                enabled_count = sum(1 for s in sections if s.get('pageNumber', s.get('page')) != 'N/A' and s.get('documentId', s.get('document_id')) not in [None, 'N/A'])
                disabled_count = len(sections) - enabled_count
                
                print(f"   📊 Summary: {enabled_count} ENABLED, {disabled_count} DISABLED buttons")
                
            else:
                print(f"❌ Request failed: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to backend server")
        print("   Make sure the backend is running on http://localhost:8083")
        print("   Run: cd c:\\ADOBE\\combined-backend && python main.py")
    except Exception as e:
        print(f"❌ Error: {e}")

def check_backend_status():
    """Check if backend is running."""
    try:
        response = requests.get("http://localhost:8083/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on http://localhost:8083")
            return True
    except:
        pass
    
    print("❌ Backend is not running")
    return False

if __name__ == '__main__':
    if check_backend_status():
        test_jump_to_section()
    else:
        print("Please start the backend first:")
        print("  cd c:\\ADOBE\\combined-backend")
        print("  python main.py")
