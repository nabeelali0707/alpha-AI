#!/usr/bin/env python3
"""
AlphaAI API Test Suite
Tests all major endpoints for functionality and response format.
"""

import requests
import json
from typing import Dict, Any
import time

BASE_URL = "http://localhost:8001/api/v1"

class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    END = "\033[0m"

def print_test(name: str):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}Testing: {name}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(msg: str):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg: str):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg: str):
    print(f"{Colors.YELLOW}ℹ {msg}{Colors.END}")

def test_endpoint(method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
    """Test API endpoint and return response JSON."""
    url = f"{BASE_URL}{endpoint}"
    print_info(f"{method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, **kwargs, timeout=10)
        elif method == "POST":
            response = requests.post(url, **kwargs, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, **kwargs, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            print_error(f"HTTP {response.status_code}: {response.text[:200]}")
            return {}
        
        print_success(f"HTTP {response.status_code}")
        data = response.json()
        print(json.dumps(data, indent=2)[:500])  # Print first 500 chars
        return data
    
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend. Is it running on http://localhost:8001?")
        return {}
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return {}

def run_tests():
    """Run comprehensive API test suite."""
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}AlphaAI API Test Suite{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Health Check
    print_test("Health Check")
    test_endpoint("GET", "/")
    
    # Test 2: Market Overview
    print_test("Market Overview")
    test_endpoint("GET", "/stocks/market/overview")
    
    # Test 3: PSX Market
    print_test("PSX Market Listing")
    test_endpoint("GET", "/stocks/market/psx")
    
    # Test 4: Cryptocurrency Market
    print_test("Cryptocurrency Market")
    test_endpoint("GET", "/stocks/market/crypto")
    
    # Test 5: Forex Market
    print_test("Forex Market")
    test_endpoint("GET", "/stocks/market/forex")
    
    # Test 6: US Stocks
    print_test("US Stock Price (AAPL)")
    test_endpoint("GET", "/stocks/AAPL")
    
    # Test 7: Stock History
    print_test("Stock History (AAPL)")
    test_endpoint("GET", "/stocks/AAPL/history", params={"period": "1mo", "interval": "1d"})
    
    # Test 8: Company Info
    print_test("Company Info (AAPL)")
    test_endpoint("GET", "/stocks/AAPL/info")
    
    # Test 9: Technical Indicators
    print_test("Technical Indicators (AAPL)")
    test_endpoint("GET", "/analysis/technical/AAPL")
    
    # Test 10: AI Recommendation
    print_test("AI Recommendation (AAPL)")
    test_endpoint("GET", "/analysis/recommend/AAPL")
    
    # Test 11: Urdu Glossary Translation
    print_test("Urdu Glossary - Translate BULLISH")
    test_endpoint("GET", "/analysis/urdu/translate", params={"term": "BULLISH"})
    
    # Test 12: Urdu Recommendation
    print_test("Urdu Recommendation (AAPL)")
    test_endpoint("GET", "/analysis/urdu/recommend/AAPL")
    
    # Test 13: Autocomplete Search
    print_test("Autocomplete Search - 'AP'")
    test_endpoint("GET", "/stocks/search/autocomplete", params={"q": "AP", "limit": 5})
    
    # Test 14: PSX Autocomplete
    print_test("Autocomplete Search - 'HBL' (PSX)")
    test_endpoint("GET", "/stocks/search/autocomplete", params={"q": "HBL", "limit": 5})
    
    print("\n" + "="*60)
    print(f"{Colors.GREEN}Test Suite Complete!{Colors.END}")
    print("="*60)
    print(f"\n{Colors.YELLOW}Next Steps:{Colors.END}")
    print("1. Verify all endpoints returned HTTP 200")
    print("2. Check response formats match expected schema")
    print("3. Test portfolio endpoints with authentication token")
    print("4. Monitor backend logs for errors")
    print(f"\nFull API Docs: {BASE_URL.replace('/api/v1', '')}/docs")

if __name__ == "__main__":
    run_tests()
