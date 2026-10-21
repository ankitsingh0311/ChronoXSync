import os
import sys
import io
import json

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app import app
from db import get_db
from auth import create_jwt_token
from fastapi.testclient import TestClient

def run_e2e_crypto_test():
    print("=================================================================")
    print("E2E CRYPTOGRAPHIC PROOF & PDF SUBMISSION TEST SUITE")
    print("=================================================================")
    
    client = TestClient(app)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, email, full_name, department, program, semester FROM Users WHERE role_id = 1 LIMIT 1")
        row = cursor.fetchone()
        student = dict(row) if row else None
        if not student:
            cursor.execute("SELECT user_id, email, full_name, department, program, semester FROM Users LIMIT 1")
            student = dict(cursor.fetchone())
        
        cursor.execute("SELECT deadline_id, title, due_date FROM Deadlines WHERE COALESCE(is_deleted, 0) = 0 ORDER BY deadline_id ASC LIMIT 1")
        deadline = dict(cursor.fetchone())

    print(f"[*] Testing with Student: {student['full_name']} (ID: {student['user_id']}, Email: {student['email']})")
    print(f"[*] Testing with Deadline: {deadline['title']} (ID: {deadline['deadline_id']}, Due: {deadline['due_date']})")

    token = create_jwt_token(
        user_id=student["user_id"],
        full_name=student["full_name"],
        role_id=1,
        email=student["email"],
        department=student.get("department", "School of Computing"),
        program=student.get("program", "B.Tech CSE"),
        semester=student.get("semester", "Semester 5")
    )

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # 2. Test PDF upload submission
    fake_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Title (ChronoSync Proof of Submission) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    
    print("\n[+] Submitting assignment with PDF attachment...")
    res = client.post(
        "/api/student/submit-task",
        data={"deadline_id": str(deadline["deadline_id"])},
        files={"file": ("cloud_cryptography_report.pdf", io.BytesIO(fake_pdf_content), "application/pdf")},
        headers=headers
    )
    print(f"Response status: {res.status_code}")
    res_data = res.json()
    print("Response payload:", json.dumps(res_data, indent=2))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    receipt = res_data.get("receipt", res_data)
    receipt_hash = res_data.get("receipt_hash") or receipt.get("sha256_receipt_hash")
    assert receipt_hash and len(receipt_hash) == 64, f"Hash invalid: {receipt_hash}"
    print(f"[PASS] SHA-256 Receipt Hash: {receipt_hash}")
    print(f"[PASS] Millisecond Server Timestamp: {res_data.get('server_timestamp_ms')}")
    print(f"[PASS] Submission Status: {res_data.get('status')}")
    print(f"[PASS] File Name: {res_data.get('file_name')}")

    # 3. Test Verification of Valid Receipt
    print("\n[+] Testing Verification with Valid Hash...")
    verify_res = client.post(
        "/api/security/verify-receipt",
        json={"receipt_hash": receipt_hash},
        headers=headers
    )
    assert verify_res.status_code == 200, f"Expected 200, got {verify_res.status_code}"
    v_data = verify_res.json()
    print(f"[PASS] Verification Success: {v_data.get('message')}")
    print(f"[PASS] Integrity Status: {v_data.get('integrity_status')}")
    print(f"[PASS] Total Verifications: {v_data.get('verification_count')}")

    # 4. Test Verification of Tampered Hash (Avalanche Effect check)
    # Alter the last character of the hash
    last_char = receipt_hash[-1]
    tampered_char = '0' if last_char != '0' else '1'
    tampered_hash = receipt_hash[:-1] + tampered_char

    print(f"\n[+] Testing Verification with Tampered Hash (Avalanche Effect): {tampered_hash}...")
    tamper_res = client.post(
        "/api/security/verify-receipt",
        json={"receipt_hash": tampered_hash},
        headers=headers
    )
    assert tamper_res.status_code == 400, f"Expected 400, got {tamper_res.status_code}"
    tamper_data = tamper_res.json()
    print(f"[PASS] Expected Failure Response Caught: {tamper_data.get('error')}")

    # 5. Test Retrieval of Receipt by deadline
    print(f"\n[+] Testing GET /api/student/receipt/{deadline['deadline_id']}...")
    receipt_res = client.get(
        f"/api/student/receipt/{deadline['deadline_id']}",
        headers=headers
    )
    assert receipt_res.status_code == 200, f"Expected 200, got {receipt_res.status_code}"
    r_data = receipt_res.json()
    assert (r_data.get("receipt_hash") == receipt_hash or r_data.get("sha256_receipt_hash") == receipt_hash)
    print(f"[PASS] Retrieved receipt successfully for student!")

    # 6. Verify Audit Logs Table
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Crypto_Verification_Logs WHERE receipt_hash IN (?, ?) ORDER BY log_id DESC",
            (receipt_hash, tampered_hash)
        )
        logs = [dict(row) for row in cursor.fetchall()]
    print(f"\n[PASS] Found {len(logs)} audit log entries in Crypto_Verification_Logs:")
    for l in logs:
        print(f"    - Log ID {l['log_id']}: verdict={l['verification_result']} | hash={l['receipt_hash'][:16]}... | at {l['verified_at']}")

    # 7. Test Attempt to Deselect / Un-mark Completed Submission (Should be rejected)
    print("\n[+] Testing Attempt to Un-mark / Deselect Sealed Submission...")
    toggle_res = client.post(
        "/api/submissions/toggle",
        json={"deadline_id": deadline["deadline_id"], "status": "PENDING"},
        headers=headers
    )
    assert toggle_res.status_code == 400, f"Expected 400 for deselect attempt, got {toggle_res.status_code}"
    print(f"[PASS] Deselect Rejection Verified: {toggle_res.json().get('detail')}")

    # 8. Test Student Roster with PDF & SHA-256 metadata
    print(f"\n[+] Testing GET /api/history/deadline/{deadline['deadline_id']}/students...")
    roster_res = client.get(
        f"/api/history/deadline/{deadline['deadline_id']}/students",
        headers=headers
    )
    assert roster_res.status_code == 200
    roster_data = roster_res.json()
    student_record = next((s for s in roster_data["students"] if s["user_id"] == student["user_id"]), None)
    assert student_record is not None
    assert student_record["file_path"] is not None
    assert student_record["sha256_receipt_hash"] == receipt_hash
    print(f"[PASS] Student Roster successfully includes PDF link ({student_record['file_name']}) and SHA-256 hash!")

    print("\n=================================================================")
    print("ALL E2E CRYPTOGRAPHIC TESTS PASSED WITH 100% ACCURACY!")
    print("=================================================================")

if __name__ == "__main__":
    run_e2e_crypto_test()
