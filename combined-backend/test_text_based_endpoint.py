import requests
import json

# Test the new find-relevant-sections endpoint
def test_text_based_analysis():
    url = "http://localhost:8083/part1b/find-relevant-sections"
    
    test_data = {
        "selected_text": "Artificial intelligence and machine learning applications in healthcare diagnostics and patient care systems"
    }
    
    try:
        print("🚀 Testing new text-based Part 1B endpoint...")
        print(f"   URL: {url}")
        print(f"   Selected text: {test_data['selected_text']}")
        
        response = requests.post(url, json=test_data, timeout=30)
        
        print(f"\n📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS!")
            print(f"   Total sections analyzed: {data.get('total_sections_analyzed', 'N/A')}")
            print(f"   Relevant sections found: {len(data.get('relevant_sections', []))}")
            print(f"   Processing time: {data.get('metadata', {}).get('processing_time', 'N/A')} seconds")
            
            # Show top sections
            sections = data.get('relevant_sections', [])[:3]  # Top 3
            for i, section in enumerate(sections, 1):
                print(f"\n   {i}. {section.get('section_title', 'Untitled')}")
                print(f"      Relevance: {section.get('relevance_score', 0):.3f}")
                print(f"      Document: {section.get('document_name', 'Unknown')}")
                print(f"      Snippet: {section.get('snippet', 'No snippet')[:100]}...")
            
        else:
            print("❌ ERROR!")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the backend server running on port 8083?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_text_based_analysis()
