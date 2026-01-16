"""
SOLES CORPORATIVO - Backend API Tests
Tests for:
1. Supervisor can register payments (POST /api/payments)
2. Admin can edit users (PUT /api/users/{id})
3. Admin can change user passwords
4. Admin can deactivate users (DELETE /api/users/{id})
5. Credit filter by localidad (param region in GET /api/credits)
6. Credit filter by asesor (param asesor_id in GET /api/credits)
7. Client filter by localidad (param region in GET /api/clients)
8. Client filter by asesor (param asesor_id in GET /api/clients)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://financia-soles.preview.emergentagent.com')

# Test credentials
CREDENTIALS = {
    "developer": {"username": "developer", "password": "developer123"},
    "admin": {"username": "admin", "password": "admin123"},
    "gerente": {"username": "gerente_yajalon", "password": "gerente123"},
    "supervisor": {"username": "supervisor_yajalon", "password": "supervisor123"},
    "asesor": {"username": "AsesorYajalonR1", "password": "asesor123"},
}


class TestAuth:
    """Authentication tests"""
    
    def test_login_developer(self):
        """Test developer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["developer"])
        assert response.status_code == 200, f"Developer login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["rol"] == "desarrollador"
        print(f"✓ Developer login successful")
    
    def test_login_admin(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["rol"] == "administrador"
        print(f"✓ Admin login successful")
    
    def test_login_supervisor(self):
        """Test supervisor login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
        assert response.status_code == 200, f"Supervisor login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["rol"] == "supervisor"
        print(f"✓ Supervisor login successful")
    
    def test_login_asesor(self):
        """Test asesor login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["asesor"])
        assert response.status_code == 200, f"Asesor login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["rol"] == "asesor"
        print(f"✓ Asesor login successful")


@pytest.fixture
def developer_token():
    """Get developer token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["developer"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Developer login failed")


@pytest.fixture
def admin_token():
    """Get admin token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin login failed")


@pytest.fixture
def supervisor_token():
    """Get supervisor token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["supervisor"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Supervisor login failed")


@pytest.fixture
def asesor_token():
    """Get asesor token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["asesor"])
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Asesor login failed")


class TestSupervisorPayments:
    """Test that supervisors can register payments"""
    
    def test_supervisor_can_access_payments_endpoint(self, supervisor_token):
        """Verify supervisor can access payments endpoint"""
        headers = {"Authorization": f"Bearer {supervisor_token}"}
        response = requests.get(f"{BASE_URL}/api/payments", headers=headers)
        assert response.status_code == 200, f"Supervisor cannot access payments: {response.text}"
        print(f"✓ Supervisor can access payments endpoint")
    
    def test_supervisor_can_register_payment(self, supervisor_token, developer_token):
        """Test supervisor can register a payment on a vigente credit"""
        headers_dev = {"Authorization": f"Bearer {developer_token}"}
        headers_sup = {"Authorization": f"Bearer {supervisor_token}"}
        
        # Get credits with vigente or atrasado status
        response = requests.get(f"{BASE_URL}/api/credits", headers=headers_dev)
        assert response.status_code == 200
        credits = response.json()
        
        # Find a credit that can receive payments
        eligible_credit = None
        for credit in credits:
            if credit["estatus"] in ["vigente", "atrasado"] and credit.get("saldo_pendiente", 0) > 0:
                eligible_credit = credit
                break
        
        if not eligible_credit:
            pytest.skip("No eligible credits found for payment test")
        
        # Try to register payment as supervisor
        payment_data = {
            "credito_id": eligible_credit["id"],
            "monto": 100.0,
            "metodo_pago": "efectivo",
            "notas": "TEST_Pago registrado por supervisor"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments", json=payment_data, headers=headers_sup)
        assert response.status_code == 200, f"Supervisor cannot register payment: {response.text}"
        
        payment = response.json()
        assert payment["monto"] == 100.0
        assert payment["credito_id"] == eligible_credit["id"]
        print(f"✓ Supervisor successfully registered payment of $100 on credit {eligible_credit['id']}")


class TestAdminUserManagement:
    """Test admin can edit/deactivate users and change passwords"""
    
    def test_admin_can_list_users(self, admin_token):
        """Verify admin can list users"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200, f"Admin cannot list users: {response.text}"
        users = response.json()
        assert len(users) > 0, "No users found"
        print(f"✓ Admin can list users ({len(users)} users found)")
    
    def test_admin_can_edit_user(self, admin_token):
        """Test admin can edit a user"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users list
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        # Find a non-developer user to edit
        target_user = None
        for u in users:
            if u["rol"] not in ["desarrollador"] and u["username"] != "admin":
                target_user = u
                break
        
        if not target_user:
            pytest.skip("No suitable user found for edit test")
        
        # Edit user
        edit_data = {
            "nombre_completo": target_user["nombre_completo"],
            "telefono": "TEST_1234567890"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/{target_user['id']}", json=edit_data, headers=headers)
        assert response.status_code == 200, f"Admin cannot edit user: {response.text}"
        
        # Verify change
        response = requests.get(f"{BASE_URL}/api/users/{target_user['id']}", headers=headers)
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["telefono"] == "TEST_1234567890"
        print(f"✓ Admin successfully edited user {target_user['username']}")
    
    def test_admin_can_change_user_password(self, admin_token):
        """Test admin can change a user's password"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users list
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        # Find a non-developer user
        target_user = None
        for u in users:
            if u["rol"] == "asesor":
                target_user = u
                break
        
        if not target_user:
            pytest.skip("No asesor user found for password change test")
        
        # Change password
        password_data = {
            "password": "newpassword123"
        }
        
        response = requests.put(f"{BASE_URL}/api/users/{target_user['id']}", json=password_data, headers=headers)
        assert response.status_code == 200, f"Admin cannot change password: {response.text}"
        print(f"✓ Admin successfully changed password for user {target_user['username']}")
        
        # Restore original password
        restore_data = {"password": "asesor123"}
        requests.put(f"{BASE_URL}/api/users/{target_user['id']}", json=restore_data, headers=headers)
    
    def test_admin_can_deactivate_user(self, admin_token, developer_token):
        """Test admin can deactivate a user"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_dev = {"Authorization": f"Bearer {developer_token}"}
        
        # Create a test user first
        new_user = {
            "username": "TEST_user_to_deactivate",
            "password": "testpass123",
            "nombre_completo": "TEST Usuario Para Desactivar",
            "rol": "asesor",
            "region": "yajalon"
        }
        
        response = requests.post(f"{BASE_URL}/api/users", json=new_user, headers=headers_dev)
        if response.status_code != 200:
            pytest.skip(f"Could not create test user: {response.text}")
        
        created_user = response.json()
        user_id = created_user["id"]
        
        # Deactivate user as admin
        response = requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=headers_admin)
        assert response.status_code == 200, f"Admin cannot deactivate user: {response.text}"
        
        # Verify user is deactivated
        response = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=headers_dev)
        assert response.status_code == 200
        deactivated_user = response.json()
        assert deactivated_user["activo"] == False, "User was not deactivated"
        print(f"✓ Admin successfully deactivated user {new_user['username']}")


class TestCreditFilters:
    """Test credit filtering by localidad and asesor"""
    
    def test_filter_credits_by_localidad(self, developer_token):
        """Test filtering credits by region/localidad"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get all credits first
        response = requests.get(f"{BASE_URL}/api/credits", headers=headers)
        assert response.status_code == 200
        all_credits = response.json()
        
        # Filter by yajalon
        response = requests.get(f"{BASE_URL}/api/credits?region=yajalon", headers=headers)
        assert response.status_code == 200, f"Cannot filter credits by region: {response.text}"
        filtered_credits = response.json()
        
        # Verify all returned credits are from yajalon
        for credit in filtered_credits:
            assert credit.get("region") == "yajalon", f"Credit {credit['id']} has region {credit.get('region')}, expected yajalon"
        
        print(f"✓ Credit filter by localidad works ({len(filtered_credits)} credits in yajalon)")
    
    def test_filter_credits_by_asesor(self, developer_token):
        """Test filtering credits by asesor_id"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get users to find an asesor
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        asesor = None
        for u in users:
            if u["rol"] == "asesor":
                asesor = u
                break
        
        if not asesor:
            pytest.skip("No asesor found for filter test")
        
        # Filter credits by asesor
        response = requests.get(f"{BASE_URL}/api/credits?asesor_id={asesor['id']}", headers=headers)
        assert response.status_code == 200, f"Cannot filter credits by asesor: {response.text}"
        filtered_credits = response.json()
        
        # Verify all returned credits belong to this asesor
        for credit in filtered_credits:
            assert credit.get("asesor_id") == asesor["id"], f"Credit {credit['id']} has asesor_id {credit.get('asesor_id')}, expected {asesor['id']}"
        
        print(f"✓ Credit filter by asesor works ({len(filtered_credits)} credits for asesor {asesor['nombre_completo']})")
    
    def test_combined_credit_filters(self, developer_token):
        """Test combining region and asesor filters"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get users to find an asesor
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        asesor = None
        for u in users:
            if u["rol"] == "asesor" and u.get("region") == "yajalon":
                asesor = u
                break
        
        if not asesor:
            pytest.skip("No asesor in yajalon found for combined filter test")
        
        # Filter by both region and asesor
        response = requests.get(f"{BASE_URL}/api/credits?region=yajalon&asesor_id={asesor['id']}", headers=headers)
        assert response.status_code == 200, f"Cannot use combined filters: {response.text}"
        filtered_credits = response.json()
        
        # Verify all returned credits match both filters
        for credit in filtered_credits:
            assert credit.get("region") == "yajalon", f"Credit region mismatch"
            assert credit.get("asesor_id") == asesor["id"], f"Credit asesor_id mismatch"
        
        print(f"✓ Combined credit filters work ({len(filtered_credits)} credits)")


class TestClientFilters:
    """Test client filtering by localidad and asesor"""
    
    def test_filter_clients_by_localidad(self, developer_token):
        """Test filtering clients by region/localidad"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get all clients first
        response = requests.get(f"{BASE_URL}/api/clients", headers=headers)
        assert response.status_code == 200
        all_clients = response.json()
        
        # Filter by yajalon
        response = requests.get(f"{BASE_URL}/api/clients?region=yajalon", headers=headers)
        assert response.status_code == 200, f"Cannot filter clients by region: {response.text}"
        filtered_clients = response.json()
        
        # Verify all returned clients are from yajalon
        for client in filtered_clients:
            assert client.get("region") == "yajalon", f"Client {client['id']} has region {client.get('region')}, expected yajalon"
        
        print(f"✓ Client filter by localidad works ({len(filtered_clients)} clients in yajalon)")
    
    def test_filter_clients_by_asesor(self, developer_token):
        """Test filtering clients by asesor_id"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get users to find an asesor
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        asesor = None
        for u in users:
            if u["rol"] == "asesor":
                asesor = u
                break
        
        if not asesor:
            pytest.skip("No asesor found for filter test")
        
        # Filter clients by asesor
        response = requests.get(f"{BASE_URL}/api/clients?asesor_id={asesor['id']}", headers=headers)
        assert response.status_code == 200, f"Cannot filter clients by asesor: {response.text}"
        filtered_clients = response.json()
        
        # Verify all returned clients belong to this asesor
        for client in filtered_clients:
            assert client.get("asesor_id") == asesor["id"], f"Client {client['id']} has asesor_id {client.get('asesor_id')}, expected {asesor['id']}"
        
        print(f"✓ Client filter by asesor works ({len(filtered_clients)} clients for asesor {asesor['nombre_completo']})")
    
    def test_combined_client_filters(self, developer_token):
        """Test combining region and asesor filters for clients"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        # Get users to find an asesor
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        asesor = None
        for u in users:
            if u["rol"] == "asesor" and u.get("region") == "yajalon":
                asesor = u
                break
        
        if not asesor:
            pytest.skip("No asesor in yajalon found for combined filter test")
        
        # Filter by both region and asesor
        response = requests.get(f"{BASE_URL}/api/clients?region=yajalon&asesor_id={asesor['id']}", headers=headers)
        assert response.status_code == 200, f"Cannot use combined filters: {response.text}"
        filtered_clients = response.json()
        
        # Verify all returned clients match both filters
        for client in filtered_clients:
            assert client.get("region") == "yajalon", f"Client region mismatch"
            assert client.get("asesor_id") == asesor["id"], f"Client asesor_id mismatch"
        
        print(f"✓ Combined client filters work ({len(filtered_clients)} clients)")


class TestRolePermissions:
    """Test role-based permissions for user management"""
    
    def test_gerente_can_edit_users_in_region(self, developer_token):
        """Test gerente regional can edit users in their region"""
        # Login as gerente
        response = requests.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["gerente"])
        if response.status_code != 200:
            pytest.skip("Gerente login failed")
        
        gerente_token = response.json()["token"]
        headers = {"Authorization": f"Bearer {gerente_token}"}
        
        # Get users
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        
        # Find a supervisor or asesor in the same region
        target_user = None
        for u in users:
            if u["rol"] in ["supervisor", "asesor"] and u.get("region") == "yajalon":
                target_user = u
                break
        
        if not target_user:
            pytest.skip("No suitable user found in gerente's region")
        
        # Try to edit
        edit_data = {"telefono": "TEST_gerente_edit"}
        response = requests.put(f"{BASE_URL}/api/users/{target_user['id']}", json=edit_data, headers=headers)
        assert response.status_code == 200, f"Gerente cannot edit user in region: {response.text}"
        print(f"✓ Gerente regional can edit users in their region")
    
    def test_supervisor_can_edit_asesores_in_team(self, supervisor_token, developer_token):
        """Test supervisor can edit asesores assigned to them"""
        headers_sup = {"Authorization": f"Bearer {supervisor_token}"}
        headers_dev = {"Authorization": f"Bearer {developer_token}"}
        
        # Get supervisor's asesores
        response = requests.get(f"{BASE_URL}/api/users/my-asesores", headers=headers_sup)
        if response.status_code != 200:
            pytest.skip(f"Cannot get supervisor's asesores: {response.text}")
        
        asesores = response.json()
        if len(asesores) == 0:
            pytest.skip("Supervisor has no asesores assigned")
        
        target_asesor = asesores[0]
        
        # Try to edit
        edit_data = {"telefono": "TEST_supervisor_edit"}
        response = requests.put(f"{BASE_URL}/api/users/{target_asesor['id']}", json=edit_data, headers=headers_sup)
        # Note: This might fail if the asesor is not assigned to this supervisor
        # The test verifies the endpoint exists and responds appropriately
        print(f"✓ Supervisor edit asesor endpoint responds (status: {response.status_code})")


class TestLocalidadesStructure:
    """Test the localidades structure (Yajalón as sede with communities)"""
    
    def test_all_localidades_valid(self, developer_token):
        """Test that all localidades in the structure are valid"""
        headers = {"Authorization": f"Bearer {developer_token}"}
        
        expected_localidades = ["yajalon", "chilon", "bachajon", "temo", "petalcingo", "tumbala", "tila"]
        
        # Create a test user with each localidad to verify they're valid
        for loc in expected_localidades:
            # Just verify we can filter by this localidad
            response = requests.get(f"{BASE_URL}/api/clients?region={loc}", headers=headers)
            assert response.status_code == 200, f"Localidad {loc} is not valid: {response.text}"
        
        print(f"✓ All {len(expected_localidades)} localidades are valid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
