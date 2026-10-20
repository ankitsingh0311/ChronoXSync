# Test syllabus endpoints
import sys
import os
import requests

from auth import create_jwt_token

faculty_token = create_jwt_token(
    user_id=6,
    full_name="Dr. Meena Iyer",
    role_id=3,
    email="meena.faculty@edutrack.ac",
    department="Computer Science & Engineering",
    program="B.Tech Computer Science & Engineering"
)

headers = {
    "Authorization": f"Bearer {faculty_token}",
    "Content-Type": "application/json"
}

BASE_URL = "http://127.0.0.1:8000"

print("--- 1. Testing GET /api/syllabus ---")
res = requests.get(f"{BASE_URL}/api/syllabus", headers=headers)
print("Status:", res.status_code)
data = res.json()
print("Syllabi count:", len(data.get("syllabi", [])))
assert res.status_code == 200
assert len(data.get("syllabi", [])) > 0
first_syllabus = data["syllabi"][0]
print("First Syllabus:", first_syllabus["course_name"], "-", first_syllabus["program"], f"({first_syllabus['coverage_pct']}%)")
print("Units:", len(first_syllabus["units"]))

print("\n--- 2. Testing POST /api/syllabus (New Dept & Program) ---")
new_payload = {
    "department": "Information Technology",
    "program": "Master of Computer Applications (MCA)",
    "semester": "Semester 2",
    "course_name": "Advanced Cloud Database Architecture",
    "course_code": "MCA204",
    "units": [
        {"unit_number": 1, "unit_label": "Unit 1", "unit_title": "Cloud Distributed Storage & DynamoDB", "description": "LSM trees and partitioning"},
        {"unit_number": 2, "unit_label": "Unit 2", "unit_title": "Spanner & Distributed Concurrency", "description": "TrueTime and Paxos consensus"}
    ]
}
create_res = requests.post(f"{BASE_URL}/api/syllabus", json=new_payload, headers=headers)
print("Create Status:", create_res.status_code, create_res.json())
assert create_res.status_code == 200
new_id = create_res.json()["syllabus_id"]

print("\n--- 3. Testing POST /api/syllabus/{id}/units ---")
add_unit_res = requests.post(f"{BASE_URL}/api/syllabus/{new_id}/units", json={
    "unit_number": 3,
    "unit_label": "Unit 3",
    "unit_title": "Multi-Region Replication & Disaster Recovery",
    "description": "Cross-region active-active clusters"
}, headers=headers)
print("Add Unit Status:", add_unit_res.status_code, add_unit_res.json())
assert add_unit_res.status_code == 200
unit_id = add_unit_res.json()["unit_id"]

print("\n--- 4. Testing PUT /api/syllabus/units/{id}/toggle (Tick unit) ---")
toggle_res = requests.put(f"{BASE_URL}/api/syllabus/units/{unit_id}/toggle", json={"completed": True}, headers=headers)
print("Toggle Status:", toggle_res.status_code, toggle_res.json())
assert toggle_res.status_code == 200
assert toggle_res.json()["completed"] is True

print("\n--- 5. Testing DELETE /api/syllabus/units/{id} ---")
del_unit_res = requests.delete(f"{BASE_URL}/api/syllabus/units/{unit_id}", headers=headers)
print("Delete Unit Status:", del_unit_res.status_code, del_unit_res.json())
assert del_unit_res.status_code == 200

print("\n--- 6. Testing DELETE /api/syllabus/{id} ---")
del_syl_res = requests.delete(f"{BASE_URL}/api/syllabus/{new_id}", headers=headers)
print("Delete Syllabus Status:", del_syl_res.status_code, del_syl_res.json())
assert del_syl_res.status_code == 200

print("\n>>> ALL BACKEND SYLLABUS TESTS PASSED 100%! <<<")
