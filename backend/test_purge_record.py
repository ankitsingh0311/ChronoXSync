# =============================================================================
# Automated Test: Permanent Record Deletion and Foreign Key Cascades
# Verifies that deleted records are permanently removed and related records
# are handled according to the configured foreign key rules.
# =============================================================================
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app import app
from auth import create_jwt_token
from db import get_db

client = TestClient(app)

def test_purge_record_with_cascades():
    # 1. Create a dummy deadline with linked submissions, reminders, and delegations
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO Deadlines (course_id, posted_by, title, description, due_date, department, program)
            VALUES (9, 31, 'Assignment to be Purged', 'Test Purge Desc', '2026-10-28 12:00:00', 'School of Computer Science and Engineering', 'B.Tech CSE (Artificial Intelligence & Machine Learning)')
        ''')
        target_id = c.lastrowid

        # Insert submission
        c.execute('''
            INSERT INTO Submissions (deadline_id, student_id, user_id, student_email, status, sha256_receipt_hash)
            VALUES (?, 31, 31, 'ankit.cr@gmail.com', 'Completed', 'fakehashforpurgetesting123456789012345678901234567890123456789012')
        ''', (target_id,))
        sub_id = c.lastrowid

        # Insert crypto verification log referencing this submission
        c.execute('''
            INSERT INTO Crypto_Verification_Logs (receipt_hash, submission_id, verified_by_user_id, verified_by_role, verification_result)
            VALUES ('fakehashforpurgetesting123456789012345678901234567890123456789012', ?, 38, 'FACULTY', 'SUCCESS')
        ''', (sub_id,))

        # Insert reminder
        c.execute('''
            INSERT INTO Deadline_Reminders (deadline_id, user_id, title, due_date, hours_remaining)
            VALUES (?, 31, 'Reminder Purge Test', '2026-10-28 12:00:00', 5.0)
        ''', (target_id,))

        # Insert delegation referencing published_deadline_id
        c.execute('''
            INSERT INTO Faculty_CR_Delegations (faculty_id, faculty_name, cr_id, cr_name, department, program, semester, subject, title, due_date, status, published_deadline_id)
            VALUES (38, 'Prof. Rishi', 31, 'Ankit Singh', 'School of Computer Science and Engineering', 'B.Tech CSE (Artificial Intelligence & Machine Learning)', 'Semester 3', 'OS', 'Delegation Purge Test', '2026-10-28 12:00:00', 'PUBLISHED', ?)
        ''', (target_id,))

    # 2. Test Soft Delete first (as happens when user first deletes from active feed)
    tok_cr = create_jwt_token(31, 'Ankit singh', 2, 'ankit.cr@gmail.com',
                              'School of Computer Science and Engineering',
                              'B.Tech CSE (Artificial Intelligence & Machine Learning)', 'Semester 3')

    res_soft = client.delete(f'/api/deadlines/{target_id}', headers={'Authorization': f'Bearer {tok_cr}'})
    assert res_soft.status_code == 200
    assert res_soft.json().get('archived_in_history') is True
    print(f"[PASS] Soft delete succeeded for deadline {target_id}.")

    # 3. Test Permanent Purge (when user clicks 'Purge Record' in History)
    res_purge = client.delete(f'/api/deadlines/{target_id}?permanent=true', headers={'Authorization': f'Bearer {tok_cr}'})
    assert res_purge.status_code == 200
    assert res_purge.json().get('archived_in_history') is False
    print(f"[PASS] Permanent purge succeeded for deadline {target_id} without any FK constraint error.")

    # 4. Verify everything is cleanly removed/decoupled from DB
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM Deadlines WHERE deadline_id = ?', (target_id,))
        assert c.fetchone()[0] == 0
        c.execute('SELECT COUNT(*) FROM Submissions WHERE deadline_id = ?', (target_id,))
        assert c.fetchone()[0] == 0
        c.execute('SELECT COUNT(*) FROM Deadline_Reminders WHERE deadline_id = ?', (target_id,))
        assert c.fetchone()[0] == 0
        c.execute('SELECT published_deadline_id FROM Faculty_CR_Delegations WHERE published_deadline_id = ?', (target_id,))
        assert c.fetchone() is None
    print("[PASS] Verified database integrity: all cascading relations decoupled and purged cleanly.")

if __name__ == '__main__':
    test_purge_record_with_cascades()
    print("\n[SUCCESS] PURGE RECORD INTEGRITY TEST PASSED 100%!")
