#!/usr/bin/env python3

"""
Test script for insights functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.insights.router import get_insights_generator

def test_insights_health():
    """Test the insights health check functionality"""
    try:
        print("Testing insights generator...")
        generator = get_insights_generator()
        print("✅ Insights generator created successfully")
        
        return {
            "status": "healthy",
            "service": "Insights Generation Service",
            "model": "gemini-1.5-flash",
            "api_key_configured": True
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "status": "unhealthy",
            "service": "Insights Generation Service", 
            "error": str(e),
            "api_key_configured": False
        }

if __name__ == "__main__":
    result = test_insights_health()
    print("Health check result:", result)
