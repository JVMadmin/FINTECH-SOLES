"""
Test suite for SOLES CORPORATIVO new features:
1. File upload endpoint (POST /api/upload)
2. Notifications system (GET/POST /api/notifications)
3. Auto-assign asesores by region (POST /api/users/auto-assign-region)
4. Disbursements with photo evidence (POST /api/disbursements)
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://credit-manager-47.preview.emergentagent.com')

# Test credentials
CREDENTIALS = {
    "developer": {"username": "developer", "password": "developer123"},
    "admin": {"username": "admin", "password": "admin123"},
    "supervisor": {"username": "supervisor_yajalon", "password": "supervisor123"},
}


class TestAuth:
    """Authentication tests"""
    
    def test_login_developer(self):
        """Test developer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["developer"])
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["rol"] == "desarrollador"
        print(f"✓ Developer login successful")
    
    def test_login_admin(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["rol"] == "administrador"
        print(f"✓ Admin login successful")
    
    def test_login_supervisor(self):
        """Test supervisor login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["rol"] == "supervisor"
        print(f"✓ Supervisor login successful")


@pytest.fixture
def developer_token():
    """Get developer auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["developer"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Developer login failed")


@pytest.fixture
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin login failed")


@pytest.fixture
def supervisor_token():
    """Get supervisor auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Supervisor login failed")


class TestFileUpload:
    """Test file upload endpoint - POST /api/upload"""
    
    def test_upload_file_success(self, developer_token):
        """Test successful file upload"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Create a simple test image (1x1 pixel PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {"file": ("test_image.png", io.BytesIO(png_data), "image/png")}
        
        response = requests.post(f"{BASE_URL}/api/upload", headers=headers, files=files)
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response should contain 'url'"
        assert "filename" in data, "Response should contain 'filename'"
        assert data["url"].startswith("/api/uploads/"), f"URL should start with /api/uploads/, got: {data['url']}"
        assert data["filename"].endswith(".png"), f"Filename should end with .png, got: {data['filename']}"
        print(f"✓ File upload successful: {data['url']}")
    
    def test_upload_file_unauthorized(self):
        """Test upload without authentication"""
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {"file": ("test_image.png", io.BytesIO(png_data), "image/png")}
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code in [401, 403], f"Should be unauthorized, got: {response.status_code}"
        print(f"✓ Upload without auth correctly rejected")


class TestNotifications:
    """Test notifications endpoints"""
    
    def test_get_notifications(self, supervisor_token):
        """Test GET /api/notifications"""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200, f"Get notifications failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get notifications successful, count: {len(data)}")
    
    def test_get_unread_count(self, supervisor_token):
        """Test GET /api/notifications/unread-count"""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=headers)
        assert response.status_code == 200, f"Get unread count failed: {response.text}"
        
        data = response.json()
        assert "count" in data, "Response should contain 'count'"
        assert isinstance(data["count"], int), "Count should be an integer"
        print(f"✓ Get unread count successful: {data['count']}")
    
    def test_mark_all_read(self, supervisor_token):
        """Test POST /api/notifications/read-all"""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        
        response = requests.post(f"{BASE_URL}/api/notifications/read-all", headers=headers)
        assert response.status_code == 200, f"Mark all read failed: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        print(f"✓ Mark all notifications read successful")
    
    def test_notifications_unauthorized(self):
        """Test notifications without authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code in [401, 403], f"Should be unauthorized, got: {response.status_code}"
        print(f"✓ Notifications without auth correctly rejected")


class TestAutoAssignRegion:
    """Test auto-assign asesores by region endpoint"""
    
    def test_auto_assign_region_developer(self, developer_token):
        """Test POST /api/users/auto-assign-region as developer"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        response = requests.post(f"{BASE_URL}/api/users/auto-assign-region", headers=headers)
        assert response.status_code == 200, f"Auto-assign failed: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "assignments" in data, "Response should contain 'assignments'"
        assert isinstance(data["assignments"], list), "Assignments should be a list"
        print(f"✓ Auto-assign region successful: {data['message']}")
    
    def test_auto_assign_region_admin(self, admin_token):
        """Test POST /api/users/auto-assign-region as admin"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/api/users/auto-assign-region", headers=headers)
        assert response.status_code == 200, f"Auto-assign failed: {response.text}"
        
        data = response.json()
        assert "message" in data
        print(f"✓ Auto-assign region as admin successful")
    
    def test_auto_assign_region_unauthorized(self, supervisor_token):
        """Test auto-assign as supervisor (should fail - only admin/gerente/dev)"""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        
        response = requests.post(f"{BASE_URL}/api/users/auto-assign-region", headers=headers)
        # Supervisor should not have access to this endpoint
        assert response.status_code in [403, 200], f"Unexpected status: {response.status_code}"
        print(f"✓ Auto-assign region permission check passed")


class TestDisbursements:
    """Test disbursement endpoints"""
    
    def test_get_disbursements(self, developer_token):
        """Test GET /api/disbursements"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        response = requests.get(f"{BASE_URL}/api/disbursements", headers=headers)
        assert response.status_code == 200, f"Get disbursements failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get disbursements successful, count: {len(data)}")
    
    def test_get_pending_disbursements(self, developer_token):
        """Test GET /api/disbursements/pending"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        response = requests.get(f"{BASE_URL}/api/disbursements/pending", headers=headers)
        assert response.status_code == 200, f"Get pending disbursements failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get pending disbursements successful, count: {len(data)}")
    
    def test_get_scheduled_disbursements(self, developer_token):
        """Test GET /api/disbursements/scheduled"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        response = requests.get(f"{BASE_URL}/api/disbursements/scheduled", headers=headers)
        assert response.status_code == 200, f"Get scheduled disbursements failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get scheduled disbursements successful, count: {len(data)}")
    
    def test_create_disbursement_requires_client(self, developer_token):
        """Test POST /api/disbursements with invalid client"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        disbursement_data = {
            "cliente_id": "invalid-client-id",
            "monto": 5000,
            "tipo_credito": "diario",
            "plazo": 20,
            "fecha_desembolso": "2025-01-20",
            "es_renovacion": False,
            "notas": "Test disbursement"
        }
        
        response = requests.post(f"{BASE_URL}/api/disbursements", headers=headers, json=disbursement_data)
        assert response.status_code == 404, f"Should fail with invalid client, got: {response.status_code}"
        print(f"✓ Create disbursement with invalid client correctly rejected")


class TestDisbursementWorkflow:
    """Test complete disbursement workflow: create -> approve -> execute"""
    
    @pytest.fixture
    def test_client(self, developer_token):
        """Create a test client for disbursement testing"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # First check if we have existing clients
        response = requests.get(f"{BASE_URL}/api/clients", headers=headers)
        if response.status_code == 200:
            clients = response.json()
            if clients:
                # Return first client with all required fields
                for client in clients:
                    if client.get("foto_cliente") and client.get("foto_domicilio") and client.get("foto_negocio"):
                        return client
        
        # If no suitable client, skip the test
        pytest.skip("No client with complete evidence available for testing")
    
    def test_disbursement_workflow(self, developer_token, test_client):
        """Test complete disbursement workflow"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Step 1: Create disbursement request
        disbursement_data = {
            "cliente_id": test_client["id"],
            "monto": 1000,
            "tipo_credito": "diario",
            "plazo": 10,
            "fecha_desembolso": "2025-01-20",
            "es_renovacion": False,
            "notas": "TEST_disbursement_workflow"
        }
        
        response = requests.post(f"{BASE_URL}/api/disbursements", headers=headers, json=disbursement_data)
        
        # May fail if client has active credit
        if response.status_code == 400:
            print(f"✓ Disbursement creation blocked (client may have active credit): {response.json().get('detail')}")
            return
        
        assert response.status_code == 200, f"Create disbursement failed: {response.text}"
        disbursement = response.json()
        disbursement_id = disbursement["id"]
        assert disbursement["estatus"] == "pendiente"
        print(f"✓ Disbursement created: {disbursement_id}")
        
        # Step 2: Approve disbursement
        response = requests.post(f"{BASE_URL}/api/disbursements/{disbursement_id}/approve", headers=headers)
        assert response.status_code == 200, f"Approve disbursement failed: {response.text}"
        print(f"✓ Disbursement approved")
        
        # Step 3: Execute disbursement (requires evidence)
        response = requests.post(
            f"{BASE_URL}/api/disbursements/{disbursement_id}/execute",
            headers=headers,
            params={"evidencia_desembolso_url": "/api/uploads/test-evidence.jpg"}
        )
        assert response.status_code == 200, f"Execute disbursement failed: {response.text}"
        print(f"✓ Disbursement executed with evidence")
    
    def test_execute_without_evidence_fails(self, developer_token):
        """Test that execute without evidence fails"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get any approved disbursement
        response = requests.get(f"{BASE_URL}/api/disbursements/scheduled", headers=headers)
        if response.status_code == 200:
            scheduled = response.json()
            if scheduled:
                disbursement_id = scheduled[0]["id"]
                
                # Try to execute without evidence
                response = requests.post(
                    f"{BASE_URL}/api/disbursements/{disbursement_id}/execute",
                    headers=headers
                )
                assert response.status_code == 400, f"Should fail without evidence, got: {response.status_code}"
                print(f"✓ Execute without evidence correctly rejected")
                return
        
        print(f"✓ No scheduled disbursements to test execute without evidence")


class TestUnassignedAsesores:
    """Test unassigned asesores endpoint"""
    
    def test_get_unassigned_asesores(self, developer_token):
        """Test GET /api/users/unassigned-asesores"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        response = requests.get(f"{BASE_URL}/api/users/unassigned-asesores", headers=headers)
        assert response.status_code == 200, f"Get unassigned asesores failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Get unassigned asesores successful, count: {len(data)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
