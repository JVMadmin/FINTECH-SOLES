#!/usr/bin/env python3
"""
Backend API Testing for SOLES CORPORATIVO Financial System
Tests authentication, dashboard stats, client management, and other core features
"""

import requests
import sys
import json
from datetime import datetime

class SolesAPITester:
    def __init__(self, base_url="https://credit-manager-47.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response.status_code == expected_status, response
        except requests.exceptions.RequestException as e:
            return False, str(e)

    def test_seed_data(self):
        """Test seed data creation"""
        print("\n🌱 Testing seed data creation...")
        success, response = self.make_request('POST', 'seed', expected_status=200)
        
        if success:
            try:
                data = response.json()
                self.log_test("Seed data creation", True, f"Response: {data.get('message', 'Success')}")
            except:
                self.log_test("Seed data creation", True, "Seed endpoint accessible")
        else:
            if isinstance(response, str):
                self.log_test("Seed data creation", False, f"Request failed: {response}")
            else:
                self.log_test("Seed data creation", False, f"Status: {response.status_code}")

    def test_login(self, username, password):
        """Test user login"""
        print(f"\n🔐 Testing login for {username}...")
        
        success, response = self.make_request('POST', 'auth/login', {
            "username": username,
            "password": password
        }, expected_status=200)

        if success:
            try:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    self.user_data = data['user']
                    self.log_test(f"Login {username}", True, f"Role: {data['user']['rol']}")
                    return True
                else:
                    self.log_test(f"Login {username}", False, "Missing token or user data")
                    return False
            except json.JSONDecodeError:
                self.log_test(f"Login {username}", False, "Invalid JSON response")
                return False
        else:
            if isinstance(response, str):
                self.log_test(f"Login {username}", False, f"Request failed: {response}")
            else:
                self.log_test(f"Login {username}", False, f"Status: {response.status_code}", 200, response.status_code)
            return False

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n📊 Testing dashboard statistics...")
        
        success, response = self.make_request('GET', 'stats/dashboard', expected_status=200)
        
        if success:
            try:
                data = response.json()
                required_fields = ['total_clientes', 'total_creditos', 'cobro_hoy', 'saldo_pendiente']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Dashboard stats", True, f"All required fields present. Clients: {data.get('total_clientes', 0)}")
                else:
                    self.log_test("Dashboard stats", False, f"Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                self.log_test("Dashboard stats", False, "Invalid JSON response")
        else:
            if isinstance(response, str):
                self.log_test("Dashboard stats", False, f"Request failed: {response}")
            else:
                self.log_test("Dashboard stats", False, f"Status: {response.status_code}", 200, response.status_code)

    def test_clients_endpoint(self):
        """Test clients listing endpoint"""
        print("\n👥 Testing clients endpoint...")
        
        success, response = self.make_request('GET', 'clients', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Clients listing", True, f"Found {len(data)} clients")
                else:
                    self.log_test("Clients listing", False, "Response is not a list")
            except json.JSONDecodeError:
                self.log_test("Clients listing", False, "Invalid JSON response")
        else:
            if isinstance(response, str):
                self.log_test("Clients listing", False, f"Request failed: {response}")
            else:
                self.log_test("Clients listing", False, f"Status: {response.status_code}", 200, response.status_code)

    def test_create_client(self):
        """Test client creation"""
        print("\n➕ Testing client creation...")
        
        client_data = {
            "nombre_completo": f"Cliente Test {datetime.now().strftime('%H%M%S')}",
            "telefono": "9611234567",
            "direccion": "Calle Test 123, Yajalón",
            "region": "yajalon"
        }
        
        success, response = self.make_request('POST', 'clients', client_data, expected_status=200)
        
        if success:
            try:
                data = response.json()
                if 'id' in data and data.get('nombre_completo') == client_data['nombre_completo']:
                    self.log_test("Client creation", True, f"Client created with ID: {data['id']}")
                    return data['id']
                else:
                    self.log_test("Client creation", False, "Invalid response structure")
                    return None
            except json.JSONDecodeError:
                self.log_test("Client creation", False, "Invalid JSON response")
                return None
        else:
            if isinstance(response, str):
                self.log_test("Client creation", False, f"Request failed: {response}")
            else:
                self.log_test("Client creation", False, f"Status: {response.status_code}", 200, response.status_code)
            return None

    def test_credits_endpoint(self):
        """Test credits listing endpoint"""
        print("\n💳 Testing credits endpoint...")
        
        success, response = self.make_request('GET', 'credits', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Credits listing", True, f"Found {len(data)} credits")
                else:
                    self.log_test("Credits listing", False, "Response is not a list")
            except json.JSONDecodeError:
                self.log_test("Credits listing", False, "Invalid JSON response")
        else:
            if isinstance(response, str):
                self.log_test("Credits listing", False, f"Request failed: {response}")
            else:
                self.log_test("Credits listing", False, f"Status: {response.status_code}", 200, response.status_code)

    def test_alerts_endpoint(self):
        """Test alerts endpoint"""
        print("\n🚨 Testing alerts endpoint...")
        
        success, response = self.make_request('GET', 'alerts', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Alerts listing", True, f"Found {len(data)} alerts")
                else:
                    self.log_test("Alerts listing", False, "Response is not a list")
            except json.JSONDecodeError:
                self.log_test("Alerts listing", False, "Invalid JSON response")
        else:
            if isinstance(response, str):
                self.log_test("Alerts listing", False, f"Request failed: {response}")
            else:
                self.log_test("Alerts listing", False, f"Status: {response.status_code}", 200, response.status_code)

    def test_users_endpoint(self):
        """Test users listing endpoint"""
        print("\n👤 Testing users endpoint...")
        
        success, response = self.make_request('GET', 'users', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Users listing", True, f"Found {len(data)} users")
                else:
                    self.log_test("Users listing", False, "Response is not a list")
            except json.JSONDecodeError:
                self.log_test("Users listing", False, "Invalid JSON response")
        else:
            if isinstance(response, str):
                self.log_test("Users listing", False, f"Request failed: {response}")
            else:
                self.log_test("Users listing", False, f"Status: {response.status_code}", 200, response.status_code)

    def test_cashbox_endpoint(self):
        """Test cashbox today endpoint"""
        print("\n💰 Testing cashbox endpoint...")
        
        success, response = self.make_request('GET', 'cashbox/today', expected_status=200)
        
        if success:
            try:
                data = response.json()
                if 'total_cobrado' in data and 'numero_pagos' in data:
                    self.log_test("Cashbox today", True, f"Total: {data.get('total_cobrado', 0)}")
                else:
                    self.log_test("Cashbox today", False, "Missing required fields")
            except json.JSONDecodeError:
                self.log_test("Cashbox today", False, "Invalid JSON response")
        else:
            if isinstance(response, str):
                self.log_test("Cashbox today", False, f"Request failed: {response}")
            else:
                self.log_test("Cashbox today", False, f"Status: {response.status_code}", 200, response.status_code)

    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting SOLES CORPORATIVO Backend API Tests")
        print("=" * 60)
        
        # Test seed data first
        self.test_seed_data()
        
        # Test developer login
        if self.test_login("developer", "developer123"):
            print(f"\n✅ Logged in as developer: {self.user_data['nombre_completo']}")
            
            # Test all endpoints with developer privileges
            self.test_dashboard_stats()
            self.test_clients_endpoint()
            self.test_create_client()
            self.test_credits_endpoint()
            self.test_alerts_endpoint()
            self.test_users_endpoint()
            self.test_cashbox_endpoint()
        else:
            print("\n❌ Developer login failed - skipping authenticated tests")
        
        # Test admin login
        print("\n" + "=" * 40)
        if self.test_login("admin", "admin123"):
            print(f"\n✅ Admin login successful: {self.user_data['nombre_completo']}")
        else:
            print("\n❌ Admin login failed")
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = SolesAPITester()
    return tester.run_full_test_suite()

if __name__ == "__main__":
    sys.exit(main())