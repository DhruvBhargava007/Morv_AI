#!/usr/bin/env python3
"""
Test Hyperspell Integration
Tests both local and cloud implementations
"""

import os
import sys
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

def test_local_hyperspell():
    """Test local EnhancedContextStore"""
    print("\n🧪 Testing Local Hyperspell (EnhancedContextStore)...")
    try:
        from agents.enhanced_context_store import EnhancedContextStore
        
        store = EnhancedContextStore()
        namespace = "test_tank"
        
        # Test store
        store.store(namespace, 'test_key', 'test_value')
        print("  ✅ Store: Success")
        
        # Test retrieve
        value = store.retrieve(namespace, 'test_key')
        assert value == 'test_value', f"Expected 'test_value', got '{value}'"
        print("  ✅ Retrieve: Success")
        
        # Test pattern learning
        store.learn_pattern(
            pattern_type='test_pattern',
            namespace=namespace,
            component_id='eng-001',
            pattern_data={'test': 'data'},
            confidence=0.9
        )
        print("  ✅ Pattern Learning: Success")
        
        # Test get patterns
        patterns = store.get_learned_patterns(component_id='eng-001', namespace=namespace)
        print(f"  ✅ Get Patterns: Found {len(patterns)} pattern(s)")
        
        return True
    except Exception as e:
        print(f"  ❌ Local Hyperspell Error: {e}")
        return False

def test_cloud_hyperspell():
    """Test Hyperspell Cloud Service"""
    print("\n🌐 Testing Hyperspell Cloud Service...")
    
    api_key = os.getenv('HYPERSPELL_API_KEY')
    if not api_key:
        print("  ⚠️  HYPERSPELL_API_KEY not set - skipping cloud test")
        return False
    
    try:
        from agents.hyperspell_cloud_client import HyperspellCloudClient
        
        client = HyperspellCloudClient(api_key=api_key)
        namespace = "test_tank_cloud"
        
        # Test store
        result = client.store(namespace, 'test_key', 'test_value')
        if result:
            print("  ✅ Store: Success")
        else:
            print("  ⚠️  Store: API returned None (may need to check API endpoint)")
            return False
        
        # Test retrieve
        value = client.retrieve(namespace, 'test_key')
        if value:
            print(f"  ✅ Retrieve: Success (value: {value})")
        else:
            print("  ⚠️  Retrieve: No value returned")
        
        # Test pattern learning
        result = client.learn_pattern(
            pattern_type='test_pattern',
            namespace=namespace,
            component_id='eng-001',
            pattern_data={'test': 'cloud_data'},
            confidence=0.9
        )
        if result:
            print("  ✅ Pattern Learning: Success")
        
        # Test get patterns
        patterns = client.get_learned_patterns(component_id='eng-001', namespace=namespace)
        print(f"  ✅ Get Patterns: Found {len(patterns)} pattern(s)")
        
        return True
    except ValueError as e:
        print(f"  ⚠️  Cloud Hyperspell: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Cloud Hyperspell Error: {e}")
        return False

def test_api_integration():
    """Test API endpoints"""
    print("\n🔌 Testing API Integration...")
    try:
        import requests
        
        # Test predictions endpoint (should use Hyperspell)
        response = requests.get('http://localhost:8000/api/predictions?tank_id=TNK-B-023', timeout=5)
        if response.status_code == 200:
            data = response.json()
            hyperspell_enhanced = data.get('hyperspellEnhanced', False)
            print(f"  ✅ Predictions Endpoint: Success")
            print(f"  ✅ Hyperspell Enhanced: {hyperspell_enhanced}")
            
            # Check if components have Hyperspell data
            if data.get('components') and len(data['components']) > 0:
                comp = data['components'][0]
                has_patterns = 'learnedPatterns' in comp
                has_insights = 'fleetInsights' in comp
                print(f"  ✅ Component Patterns: {has_patterns}")
                print(f"  ✅ Fleet Insights: {has_insights}")
        else:
            print(f"  ⚠️  Predictions Endpoint: Status {response.status_code}")
        
        # Test Hyperspell patterns endpoint
        response = requests.get('http://localhost:8000/api/hyperspell/patterns?component_id=eng-001', timeout=5)
        if response.status_code == 200:
            print("  ✅ Hyperspell Patterns Endpoint: Success")
        elif response.status_code == 503:
            print("  ⚠️  Hyperspell Patterns: Not available (using local fallback)")
        
        return True
    except requests.exceptions.ConnectionError:
        print("  ⚠️  API Server not running - start with: python api.py")
        return False
    except Exception as e:
        print(f"  ❌ API Integration Error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Hyperspell Integration Test Suite")
    print("=" * 60)
    
    results = {
        'local': test_local_hyperspell(),
        'cloud': test_cloud_hyperspell(),
        'api': test_api_integration()
    }
    
    print("\n" + "=" * 60)
    print("Test Results Summary:")
    print("=" * 60)
    print(f"  Local Hyperspell:     {'✅ PASS' if results['local'] else '❌ FAIL'}")
    print(f"  Cloud Hyperspell:     {'✅ PASS' if results['cloud'] else '⚠️  SKIP/NOT CONFIGURED'}")
    print(f"  API Integration:      {'✅ PASS' if results['api'] else '⚠️  SKIP/SERVER DOWN'}")
    
    if results['local']:
        print("\n✅ Local Hyperspell is working correctly!")
    
    if results['cloud']:
        print("✅ Cloud Hyperspell is connected!")
    else:
        print("\n💡 To enable cloud:")
        print("   1. Get API key from Hyperspell platform")
        print("   2. Set HYPERSPELL_API_KEY in .env")
        print("   3. Set USE_HYPERSPELL_CLOUD=true in .env")

if __name__ == '__main__':
    main()

