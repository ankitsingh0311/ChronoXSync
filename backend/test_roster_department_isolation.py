from fastapi.testclient import TestClient
from app import app, create_jwt_token

client = TestClient(app)

def test_faculty_cannot_access_users_endpoint():
    # Sunil Rawat (Faculty of CSE)
    token = create_jwt_token(
        user_id=44,
        full_name="sunil rawat",
        role_id=3,
        email="sunil.faculty@gmail.com",
        department="School of Computer Science and Engineering",
        program="B.Tech Computer Science & Engineering"
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/users", headers=headers)
    assert res.status_code == 403, f"Expected 403 for Faculty accessing /api/users, got {res.status_code}"
    print("PASS: Faculty is forbidden (403) from accessing /api/users")

def test_student_cannot_access_users_endpoint():
    # Sujal Singh (Student)
    token = create_jwt_token(
        user_id=15,
        full_name="sujal singh",
        role_id=1,
        email="sujal.student@gmail.com",
        department="School of Computer Science and Engineering",
        program="B.Tech CSE (Artificial Intelligence & Machine Learning)"
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/users", headers=headers)
    assert res.status_code == 403, f"Expected 403 for Student accessing /api/users, got {res.status_code}"
    print("PASS: Student is forbidden (403) from accessing /api/users")

def test_faculty_history_has_no_registered_users():
    token = create_jwt_token(
        user_id=44,
        full_name="sunil rawat",
        role_id=3,
        email="sunil.faculty@gmail.com",
        department="School of Computer Science and Engineering",
        program="B.Tech Computer Science & Engineering"
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/history", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get("registered_users") == []
    assert data.get("stats", {}).get("total_users") == 0
    print("PASS: Faculty history contains empty registered_users and total_users=0")

def test_student_history_has_no_registered_users():
    token = create_jwt_token(
        user_id=15,
        full_name="sujal singh",
        role_id=1,
        email="sujal.student@gmail.com",
        department="School of Computer Science and Engineering",
        program="B.Tech CSE (Artificial Intelligence & Machine Learning)"
    )
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/history", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data.get("registered_users") == []
    assert data.get("stats", {}).get("total_users") == 0
    print("PASS: Student history contains empty registered_users and total_users=0")

def test_hod_history_and_users_department_isolation():
    # 1. CSE HOD: Dr. Krishnendu Rarhi
    token_cse = create_jwt_token(
        user_id=33,
        full_name="dr. krishnendu rarhi",
        role_id=4,
        email="krishnendu.hod@gmail.com",
        department="School of Computer Science and Engineering",
        program="ALL"
    )
    headers_cse = {"Authorization": f"Bearer {token_cse}"}
    
    res_cse = client.get("/api/users", headers=headers_cse)
    assert res_cse.status_code == 200
    users_cse = res_cse.json().get("users", [])
    assert len(users_cse) == 17
    # Verify no users from other departments (e.g., School of Business or Computing)
    for u in users_cse:
        assert "Computer" in u["department"] or "CSE" in u["department"]
    print(f"PASS: CSE HOD sees strictly {len(users_cse)} CSE users in /api/users")

    # 2. Computing HOD: Dr. Mrithunjay S
    token_comp = create_jwt_token(
        user_id=6,
        full_name="Dr. Mrithunjay S",
        role_id=4,
        email="mrithunjay.hod@gmail.com",
        department="School of Computing",
        program="ALL"
    )
    headers_comp = {"Authorization": f"Bearer {token_comp}"}
    
    res_comp = client.get("/api/users", headers=headers_comp)
    assert res_comp.status_code == 200
    users_comp = res_comp.json().get("users", [])
    assert len(users_comp) == 6
    for u in users_comp:
        assert "Computing" in u["department"]
    print(f"PASS: Computing HOD sees strictly {len(users_comp)} Computing users in /api/users")

    # 3. Engineering HOD: Ritika Saxena
    token_eng = create_jwt_token(
        user_id=52,
        full_name="ritika saxena",
        role_id=4,
        email="ritika.hod@gmail.com",
        department="School of Engineering",
        program="ALL"
    )
    headers_eng = {"Authorization": f"Bearer {token_eng}"}
    
    res_eng = client.get("/api/users", headers=headers_eng)
    assert res_eng.status_code == 200
    users_eng = res_eng.json().get("users", [])
    assert len(users_eng) == 7
    for u in users_eng:
        assert "Engineering" in u["department"]
    print(f"PASS: Engineering HOD sees strictly {len(users_eng)} Engineering users in /api/users")

    # 4. Check CSE HOD /api/history registered_users
    res_hist = client.get("/api/history", headers=headers_cse)
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert len(data_hist.get("registered_users", [])) == 17
    assert data_hist.get("stats", {}).get("total_users") == 17
    print("PASS: CSE HOD history contains 17 department-isolated users")

if __name__ == "__main__":
    test_faculty_cannot_access_users_endpoint()
    test_student_cannot_access_users_endpoint()
    test_faculty_history_has_no_registered_users()
    test_student_history_has_no_registered_users()
    test_hod_history_and_users_department_isolation()
    print("\nALL ROSTER DEPARTMENT ISOLATION TESTS PASSED 100%!")
