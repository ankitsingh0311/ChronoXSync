import sqlite3
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("=== Testing Quick Roster & Account Registration Synchronization ===")
    test_email = "vikram.student@edutrack.ac"

    # Pre-clean test account
    conn = sqlite3.connect("edutrack.db")
    c = conn.cursor()
    c.execute("DELETE FROM Users WHERE LOWER(email) = ?", (test_email.lower(),))
    conn.commit()
    conn.close()
    
    # 1. Fetch current roster
    r1 = requests.get(f"{BASE_URL}/api/auth/roster")
    assert r1.status_code == 200, f"Expected 200 from /api/auth/roster, got {r1.status_code}"
    data1 = r1.json()
    initial_count = data1.get("total_registered", 0)
    print(f"Step 1: Current registered users in roster: {initial_count}")

    reg_payload = {
        "full_name": "Vikram Malhotra",
        "email": test_email,
        "password": "Password@123",
        "selected_role": "Student",
        "department": "Information Technology",
        "program": "B.Tech Information Technology",
        "course_name": "B.Tech Information Technology (Semester 4)",
        "semester": "Semester 4"
    }

    print(f"Step 2: Registering fresh user: {test_email}...")
    reg_res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed ({reg_res.status_code}): {reg_res.text}"
    print("  [OK] Successfully registered in SQLite database!")

    # 3. Fetch roster again and verify the new user is immediately present
    r2 = requests.get(f"{BASE_URL}/api/auth/roster")
    assert r2.status_code == 200
    data2 = r2.json()
    new_count = data2.get("total_registered", 0)
    print(f"Step 3: Roster after enrollment: {new_count} users (increased from {initial_count})")
    assert new_count == initial_count + 1, f"Expected {initial_count + 1}, got {new_count}"

    found = None
    for u in data2.get("registered_users", []):
        if u["email"].lower() == test_email.lower():
            found = u
            break
            
    assert found is not None, f"Enrolled user '{test_email}' was not found in roster!"
    print(f"  [OK] Found in roster:")
    print(f"       Name: {found['name']}")
    print(f"       Email: {found['email']}")
    print(f"       Role: {found['role']}")
    print(f"       Department: {found['department']}")
    print(f"       Program: {found['program']}")
    print(f"       Semester: {found['semester']}")
    print(f"       DB Enrolled: {found.get('is_registered')}")

    # 4. Verify login with the newly created account
    login_payload = {
        "email": test_email,
        "password": "Password@123",
        "selected_role": "Student"
    }
    print(f"Step 4: Logging in with newly enrolled credentials...")
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("token")
    assert token, "No JWT token issued!"
    print(f"  [OK] Login successful! JWT Token: {token[:25]}...")

    print("\n[PASS] ALL TESTS PASSED WITH 100% ACCURACY!")

if __name__ == "__main__":
    run_test()
