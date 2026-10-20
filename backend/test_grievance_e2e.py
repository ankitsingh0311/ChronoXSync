import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.abspath("chrono_sync/backend"))

from fastapi.testclient import TestClient
import app

client = TestClient(app.app)

def test_full_grievance_lifecycle():
    print("\n--- 1. Testing HOD Directory Endpoint ---")
    resp = client.get("/api/panic/hod-directory")
    assert resp.status_code == 200, f"Failed to get HOD directory: {resp.text}"
    hod_dir = resp.json()
    print("HOD Directory:", hod_dir)
    assert "hod" in hod_dir
    cse_hod = hod_dir["hod"]
    assert cse_hod["full_name"] == "Dr. Sanjay Desai"
    dept_names = [d["department"] for d in hod_dir.get("departments", [])]
    assert "Computer Science & Engineering" in dept_names
    print(f"[OK] HOD for CSE correctly identified as: {cse_hod['full_name']} ({cse_hod['email']})")

    print("\n--- 2. Student Authentication ---")
    login_resp = client.post("/api/auth/login", json={
        "email": "ankit.student@edutrack.ac",
        "password": "EduTrack@2024",
        "expected_role": "STUDENT"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    student_token = login_resp.json()["token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("[OK] Student logged in successfully.")

    print("\n--- 3. Student Submitting Anonymous Grievance ---")
    grievance_payload = {
        "message": "We have 3 major lab submissions and a mid-semester examination clustered on Monday morning. Need urgent rescheduling.",
        "department": "Computer Science & Engineering",
        "subject": "Lab Submission & Mid-Sem Cluster",
        "category": "WORKLOAD_CLUSTER",
        "course_name": "CS301 Data Structures",
        "urgency": "CRITICAL",
        "is_anonymous": True
    }
    submit_resp = client.post("/api/panic", json=grievance_payload, headers=student_headers)
    assert submit_resp.status_code == 200, f"Submission failed: {submit_resp.text}"
    submit_data = submit_resp.json()
    ticket_no = submit_data.get("ticket_number")
    panic_id = submit_data.get("panic_id")
    print(f"[OK] Grievance submitted. Ticket: {ticket_no}, ID: {panic_id}, Severity: {submit_data.get('severity')}")
    assert ticket_no is not None
    assert panic_id is not None
    assert submit_data.get("hod_name") == "Dr. Sanjay Desai"

    print("\n--- 4. Student Tracking 'My Grievances' ---")
    my_grv_resp = client.get("/api/panic/my-grievances", headers=student_headers)
    assert my_grv_resp.status_code == 200, f"Failed to fetch student grievances: {my_grv_resp.text}"
    my_grvs = my_grv_resp.json().get("grievances", [])
    target_grv = next((g for g in my_grvs if g.get("ticket_number") == ticket_no), None)
    assert target_grv is not None, "Newly submitted grievance not found in student's list"
    assert target_grv["status"] == "PENDING"
    assert target_grv["subject"] == "Lab Submission & Mid-Sem Cluster"
    print(f"[OK] Student can see grievance {ticket_no} with status PENDING.")

    print("\n--- 5. HOD Authentication ---")
    hod_login_resp = client.post("/api/auth/login", json={
        "email": "sanjay.hod@edutrack.ac",
        "password": "EduTrack@2024",
        "expected_role": "HOD"
    })
    assert hod_login_resp.status_code == 200, f"HOD Login failed: {hod_login_resp.text}"
    hod_token = hod_login_resp.json()["token"]
    hod_headers = {"Authorization": f"Bearer {hod_token}"}
    print("[OK] HOD Dr. Sanjay Desai logged in successfully.")

    print("\n--- 6. HOD Viewing Grievances for Department ---")
    logs_resp = client.get("/api/panic/logs", headers=hod_headers)
    assert logs_resp.status_code == 200, f"Failed to fetch panic logs: {logs_resp.text}"
    logs = logs_resp.json().get("panic_logs", [])
    hod_target = next((l for l in logs if l.get("ticket_number") == ticket_no or l.get("panic_id") == panic_id), None)
    assert hod_target is not None, "Grievance did not appear on HOD's dashboard!"
    print(f"[OK] Grievance {ticket_no} successfully visible on HOD dashboard!")
    print(f"      Subject: {hod_target.get('subject')}")
    print(f"      Message: {hod_target.get('message_text') or hod_target.get('message')}")
    print(f"      Student Identity: {repr(hod_target.get('student_display'))}")

    print("\n--- 7. HOD Resolving Grievance with Mitigation Action ---")
    mitigation_notes = "Spoke with CS301 Lab Instructors. Monday Lab submission postponed to next week Thursday. Examination remains as scheduled."
    resolve_resp = client.put(f"/api/panic/{panic_id}/resolve", json={"mitigation_notes": mitigation_notes}, headers=hod_headers)
    assert resolve_resp.status_code == 200, f"Failed to resolve grievance: {resolve_resp.text}"
    print("[OK] HOD successfully resolved grievance and recorded official mitigation notes.")

    print("\n--- 8. Student Live Verification of Resolution ---")
    my_grv_updated = client.get("/api/panic/my-grievances", headers=student_headers)
    assert my_grv_updated.status_code == 200
    updated_target = next((g for g in my_grv_updated.json().get("grievances", []) if g.get("ticket_number") == ticket_no), None)
    assert updated_target is not None
    assert updated_target["status"] == "RESOLVED", f"Expected status RESOLVED, got {updated_target['status']}"
    assert updated_target["resolution_notes"] == mitigation_notes
    print(f"[OK] Student sees grievance {ticket_no} marked RESOLVED with HOD response:")
    print(f"      Resolution: {repr(updated_target['resolution_notes'])}")

    print("\n--- 9. Student Submitting Named Grievance (Confidential Follow-up) ---")
    named_payload = {
        "message": "Project review clashed with campus placement aptitude test.",
        "department": "Computer Science & Engineering",
        "subject": "Placement Test & Review Conflict",
        "category": "EXAM_CONFLICT",
        "course_name": "CS402 Major Project",
        "urgency": "HIGH",
        "is_anonymous": False,
        "student_name": "Ankit Sharma",
        "student_email": "ankit.student@edutrack.ac"
    }
    named_submit_resp = client.post("/api/panic", json=named_payload, headers=student_headers)
    assert named_submit_resp.status_code == 200
    named_ticket = named_submit_resp.json()["ticket_number"]
    named_id = named_submit_resp.json()["panic_id"]
    print(f"[OK] Named grievance submitted with ticket: {named_ticket}")

    logs_resp_named = client.get("/api/panic/logs", headers=hod_headers)
    assert logs_resp_named.status_code == 200
    named_logs = logs_resp_named.json().get("panic_logs", [])
    named_target_hod = next((l for l in named_logs if l.get("ticket_number") == named_ticket or l.get("panic_id") == named_id), None)
    assert named_target_hod is not None
    assert named_target_hod["is_anonymous"] == 0
    assert "Ankit Sharma" in named_target_hod["student_display"]
    print(f"[OK] HOD correctly sees confidential student identification: {repr(named_target_hod['student_display'])}")

    print("\n>>> ALL GRIEVANCE DISPATCH TESTS PASSED 100%! <<<\n")

if __name__ == "__main__":
    test_full_grievance_lifecycle()
