import sqlite3
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_delete_user():
    print("=== Testing User Deletion Endpoint & Database Removal ===")
    
    # 1. Create a dummy/unusual user
    test_email = "unusual.testuser@edutrack.ac"
    
    # Clean up first if present
    conn = sqlite3.connect("edutrack.db")
    c = conn.cursor()
    c.execute("DELETE FROM Users WHERE LOWER(email) = ?", (test_email.lower(),))
    conn.commit()
    conn.close()

    reg_payload = {
        "full_name": "Unusual Test User",
        "email": test_email,
        "password": "Password@123",
        "selected_role": "Student",
        "department": "Civil Engineering",
        "program": "B.Tech Civil Engineering",
        "course_name": "B.Tech Civil Engineering (Semester 1)",
        "semester": "Semester 1"
    }

    print(f"1. Registering '{test_email}'...")
    res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    assert res.status_code == 200, f"Registration failed: {res.text}"
    user_id = res.json()["user"]["user_id"]
    print(f"   [OK] Registered with user_id={user_id}")

    # 2. Check roster contains user
    roster_res = requests.get(f"{BASE_URL}/api/auth/roster")
    assert roster_res.status_code == 200
    roster = roster_res.json()
    found_users = [u for u in roster.get("registered_users", []) if u["user_id"] == user_id]
    assert len(found_users) == 1, "User should be present in roster"
    print(f"2. [OK] User confirmed in Quick Roster list ({found_users[0]['name']})")

    # 3. Call DELETE /api/auth/roster/{user_id}
    print(f"3. Deleting user_id={user_id} via DELETE /api/auth/roster/{user_id}...")
    del_res = requests.delete(f"{BASE_URL}/api/auth/roster/{user_id}")
    assert del_res.status_code == 200, f"Delete failed: {del_res.text}"
    del_data = del_res.json()
    assert del_data["status"] == "success"
    print(f"   [OK] Backend response: {del_data['message']}")

    # 4. Check SQLite DB directly
    conn = sqlite3.connect("edutrack.db")
    c = conn.cursor()
    db_row = c.execute("SELECT user_id, full_name, email FROM Users WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    assert db_row is None, f"User {user_id} should NOT exist in SQLite Users table!"
    print(f"4. [OK] Verified zero records exist in SQLite Users table for user_id={user_id}")

    # 5. Check roster again
    roster_res_after = requests.get(f"{BASE_URL}/api/auth/roster")
    assert roster_res_after.status_code == 200
    after_users = [u for u in roster_res_after.json().get("registered_users", []) if u["user_id"] == user_id]
    assert len(after_users) == 0, "User should be removed from Quick Roster list"
    print(f"5. [OK] Verified user is completely absent from Quick Roster API")

    # 6. Verify login rejection
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": test_email,
        "password": "Password@123",
        "selected_role": "Student"
    })
    assert login_res.status_code == 401, f"Deleted user should be rejected on login, got {login_res.status_code}"
    print(f"6. [OK] Login rejection confirmed with 401 Invalid credentials.")

    print("\n[PASS] USER DELETION VERIFIED 100% SUCCESSFUL IN DATABASE AND API!")

if __name__ == "__main__":
    test_delete_user()
