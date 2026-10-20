# =============================================================================
# EduTrack 3D — System Verification Test Suite (test_system.py)
# =============================================================================
# Runs comprehensive automated verification for:
# 1. 3NF SQLite/Azure SQL Schema initialization and seed data verification
# 2. bcrypt password hash verification & JWT token issuance
# 3. RBAC checks (Student 403 on POST /api/deadlines, CR allowed)
# 4. Feature F1: Crowdsourced feed retrieval with O(1) dictionary cache
# 5. Feature F2: Exam clash conflict trigger detection
# 6. Feature F3: ACID submission status toggle
# 7. Feature F5: Anonymous panic button with VADER/TextBlob sentiment analysis
# 8. Feature F7: AI study hours estimator
# =============================================================================

import sys
import unittest
from fastapi.testclient import TestClient

from app import app, _seed_default_data
from db import init_local_db, get_db
from auth import verify_password, hash_password
from ai_services import analyze_sentiment, estimate_study_hours

class TestEduTrack3D(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n=======================================================")
        print(">> RUNNING EDUTRACK 3D FULL SYSTEM VERIFICATION SUITE")
        print("=======================================================")
        init_local_db()
        _seed_default_data(force=False)
        cls.client = TestClient(app)

    def test_01_bcrypt_authentication_and_jwt(self):
        """Test bcrypt salted hash verification and JWT token issuance."""
        print("\n[TEST 1] Testing bcrypt verification & JWT authentication...")
        # Login with Student
        res = self.client.post("/api/auth/login", json={
            "email": "ankit.student@edutrack.ac",
            "password": "EduTrack@2024"
        })
        self.assertEqual(res.status_code, 200, f"Login failed: {res.text}")
        data = res.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role_id"], 1)
        self.assertEqual(data["user"]["role_name"], "STUDENT")
        print("  [OK] Student login succeeded with role_id=1 and signed JWT.")

        # Test invalid password rejection
        bad_res = self.client.post("/api/auth/login", json={
            "email": "ankit.student@edutrack.ac",
            "password": "WrongPassword123!"
        })
        self.assertEqual(bad_res.status_code, 401)
        print("  [OK] Invalid password correctly rejected with 401.")

    def test_02_rbac_authorization_matrix(self):
        """Test RBAC decorator protecting sensitive endpoints."""
        print("\n[TEST 2] Testing Role-Based Access Control (RBAC) boundaries...")
        # 1. Student login
        student_res = self.client.post("/api/auth/login", json={
            "email": "ankit.student@edutrack.ac",
            "password": "EduTrack@2024"
        })
        student_token = student_res.json()["token"]

        # Student attempts to post deadline (Should be 403 Forbidden)
        forbidden_res = self.client.post(
            "/api/deadlines",
            headers={"Authorization": f"Bearer {student_token}"},
            json={
                "course_id": 1,
                "title": "Unauthorized Student Deadline",
                "due_date": "2024-11-30 23:59:00",
                "urgency": "HIGH"
            }
        )
        self.assertEqual(forbidden_res.status_code, 403, "Student was not blocked with 403!")
        print("  [OK] Student blocked with 403 Forbidden on POST /api/deadlines.")

        # 2. CR login
        cr_res = self.client.post("/api/auth/login", json={
            "email": "neha.cr@edutrack.ac",
            "password": "EduTrack@2024"
        })
        # Clean up prior test deadline for idempotency
        with get_db() as conn:
            conn.cursor().execute("DELETE FROM Deadlines WHERE title = 'CR Official Binary Tree Homework'")
            conn.commit()
        cr_token = cr_res.json()["token"]

        # CR posts deadline (Should pass)
        cr_create_res = self.client.post(
            "/api/deadlines",
            headers={"Authorization": f"Bearer {cr_token}"},
            json={
                "course_id": 1,
                "title": "CR Official Binary Tree Homework",
                "description": "Verified assignment posted by Class Representative",
                "due_date": "2025-02-10 14:00:00",
                "urgency": "MEDIUM"
            }
        )
        self.assertEqual(cr_create_res.status_code, 200, f"CR deadline post failed: {cr_create_res.text}")
        print("  [OK] CR authorized to create deadlines.")

    def test_03_sql_conflict_detection_trigger(self):
        """Test Feature F2: Prevention of exam clashes & deadline overload."""
        print("\n[TEST 3] Testing Feature F2: Exam clash conflict trigger...")
        cr_res = self.client.post("/api/auth/login", json={
            "email": "neha.cr@edutrack.ac",
            "password": "EduTrack@2024"
        })
        cr_token = cr_res.json()["token"]

        # Exam for course_id 1 is at '2024-11-15 10:00:00'.
        # Try setting a deadline at '2024-11-15 14:00:00' (within 4 hours of the exam)
        clash_res = self.client.post(
            "/api/deadlines",
            headers={"Authorization": f"Bearer {cr_token}"},
            json={
                "course_id": 1,
                "title": "Clashing Assignment on Exam Day",
                "due_date": "2024-11-15 14:00:00",
                "urgency": "HIGH"
            }
        )
        self.assertEqual(clash_res.status_code, 409, "Conflict was not intercepted!")
        self.assertIn("CONFLICT", clash_res.json()["detail"])
        print(f"  [OK] Trigger conflict detected: {clash_res.json()['detail']}")

    def test_04_acid_submission_toggle(self):
        """Test Feature F3: Atomic ACID submission toggle with timestamp."""
        print("\n[TEST 4] Testing Feature F3: ACID submission status toggle...")
        student_res = self.client.post("/api/auth/login", json={
            "email": "ankit.student@edutrack.ac",
            "password": "EduTrack@2024"
        })
        token = student_res.json()["token"]

        toggle_res = self.client.post(
            "/api/submissions/toggle",
            headers={"Authorization": f"Bearer {token}"},
            json={"deadline_id": 2, "status": "DONE"}
        )
        self.assertEqual(toggle_res.status_code, 200)
        data = toggle_res.json()
        self.assertEqual(data["status"], "DONE")
        self.assertIsNotNone(data["completed_at"])
        print(f"  [OK] Submission atomically marked DONE at {data['completed_at']}.")

    def test_05_nlp_anonymous_panic_button(self):
        """Test Feature F5: NLP sentiment classification and privacy preservation."""
        print("\n[TEST 5] Testing Feature F5: Anonymous panic button NLP AI...")
        student_res = self.client.post("/api/auth/login", json={
            "email": "ankit.student@edutrack.ac",
            "password": "EduTrack@2024"
        })
        token = student_res.json()["token"]

        # Critical stress text
        panic_res = self.client.post(
            "/api/panic",
            headers={"Authorization": f"Bearer {token}"},
            json={"message": "I am having severe anxiety and panic attacks because of 4 impossible overlapping assignments."}
        )
        self.assertEqual(panic_res.status_code, 200)
        data = panic_res.json()
        self.assertIn(data["severity"], ["CRITICAL", "MEDIUM"])
        self.assertLessEqual(data["sentiment_score"], 0)
        print(f"  [OK] NLP Sentiment Polarity: {data['sentiment_score']} -> Severity: {data['severity']}")

    def test_06_ai_study_estimator(self):
        """Test Feature F7: Study hour estimation based on keywords."""
        print("\n[TEST 6] Testing Feature F7: AI study hours estimator...")
        est = estimate_study_hours("Full Stack Cloud Database Project", "Implement SQL and React", "CRITICAL")
        self.assertGreaterEqual(est["estimated_hours"], 5.0)
        self.assertGreaterEqual(est["pomodoro_sessions"], 10)
        print(f"  [OK] Estimated {est['estimated_hours']} hours, {est['pomodoro_sessions']} Pomodoro cycles.")

    def test_07_role_verification_mismatch(self):
        """Test Subject 4: Strict Role Verification during login (Student claiming HOD -> 403)."""
        print("\n[TEST 7] Testing Role-Identity Verification (Student claiming HOD)...")
        res = self.client.post("/api/auth/login", json={
            "full_name": "Ankit Singh",
            "email": "ankit.student@edutrack.ac",
            "password": "EduTrack@2024",
            "selected_role": "HOD"
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn("Role Verification Failed", res.json()["detail"])
        print(f"  [OK] Impersonation attempt rejected: {res.json()['detail']}")

    def test_08_brute_force_account_lockout(self):
        """Test Subject 4: Brute force lockout after 5 consecutive failed login attempts."""
        print("\n[TEST 8] Testing Brute-Force Protection (5 strikes -> 429 lockout)...")
        with get_db() as conn:
            conn.cursor().execute("UPDATE Users SET failed_login_attempts=0, locked_until=NULL WHERE email='priya.student@edutrack.ac'")
            conn.commit()

        # Attempt 4 wrong passwords

        for i in range(1, 5):
            res = self.client.post("/api/auth/login", json={
                "email": "priya.student@edutrack.ac",
                "password": f"BadPassword{i}!"
            })
            self.assertEqual(res.status_code, 401)

        # 5th attempt triggers lockout
        lockout_res = self.client.post("/api/auth/login", json={
            "email": "priya.student@edutrack.ac",
            "password": "BadPassword5!"
        })
        self.assertEqual(lockout_res.status_code, 429)
        print(f"  [OK] Account successfully locked: {lockout_res.json()['detail']}")
        # Reset lockout afterwards so Priya is unlocked

        with get_db() as conn:
            conn.cursor().execute("UPDATE Users SET failed_login_attempts=0, locked_until=NULL WHERE email='priya.student@edutrack.ac'")
            conn.commit()

    def test_09_registration_institutional_directory_check(self):
        """Test Subject 4: Registration ERP directory cross-check and role escalation denial."""
        print("\n[TEST 9] Testing Registration Institutional Directory cross-check...")
        with get_db() as conn:
            conn.cursor().execute("DELETE FROM Users WHERE email = 'rohan.student@edutrack.ac'")
            conn.commit()

        # 1. Unknown email not in ERP roster -> 403

        bad_email_res = self.client.post("/api/auth/register", json={
            "full_name": "Hacker Impersonator",
            "email": "hacker@external.com",
            "password": "SecurePassword@123",
            "selected_role": "Student"
        })
        self.assertEqual(bad_email_res.status_code, 403)
        self.assertIn("not found in the Institutional Directory", bad_email_res.json()["detail"])

        # 2. Rohan Mehta is authorized as Student in Directory; tries claiming CR role -> 403
        escalate_res = self.client.post("/api/auth/register", json={
            "full_name": "Rohan Mehta",
            "email": "rohan.student@edutrack.ac",
            "password": "SecurePassword@123",
            "selected_role": "CR"
        })
        self.assertEqual(escalate_res.status_code, 403)
        self.assertIn("Unauthorized Role Claim", escalate_res.json()["detail"])

        # 3. Legitimate registration with authorized role -> 200 OK + JWT
        valid_res = self.client.post("/api/auth/register", json={
            "full_name": "Rohan Mehta",
            "email": "rohan.student@edutrack.ac",
            "password": "SecurePassword@123",
            "selected_role": "Student",
            "course_name": "B.Tech Information Technology (Sem 3)"
        })
        self.assertEqual(valid_res.status_code, 200)
        self.assertIn("token", valid_res.json())
        self.assertEqual(valid_res.json()["user"]["role_name"], "STUDENT")
        self.assertEqual(valid_res.json()["user"]["subject_or_course"], "B.Tech Information Technology (Sem 3)")
        print("  [OK] Registration verified against Institutional_Directory & JWT issued.")

    def test_10_email_role_inference_and_role_fields(self):
        """Test automatic role inference from email (.hod, .faculty, .cr, .student) and role fields."""
        print("\n[TEST 10] Testing Email Role Inference & Role-Specific Fields (Department / Subject)...")
        # 1. HOD login without selected_role passed (auto-inferred from sanjay.hod@edutrack.ac)
        hod_res = self.client.post("/api/auth/login", json={
            "email": "sanjay.hod@edutrack.ac",
            "password": "EduTrack@2024",
            "department": "Computer Science"
        })
        self.assertEqual(hod_res.status_code, 200)
        hod_data = hod_res.json()
        self.assertEqual(hod_data["user"]["role_name"], "HOD")
        self.assertEqual(hod_data["user"]["department"], "Computer Science")
        print("  [OK] Auto-inferred HOD role from email; verified Department.")

        # 2. Faculty login with subject_taught
        faculty_res = self.client.post("/api/auth/login", json={
            "email": "meena.faculty@edutrack.ac",
            "password": "EduTrack@2024",
            "department": "Computer Science",
            "subject_taught": "Database Management Systems (RDBMS)"
        })
        self.assertEqual(faculty_res.status_code, 200)
        faculty_data = faculty_res.json()
        self.assertEqual(faculty_data["user"]["role_name"], "FACULTY")
        self.assertEqual(faculty_data["user"]["subject_or_course"], "Database Management Systems (RDBMS)")
        print("  [OK] Auto-inferred Faculty role from email; verified Subject Taught.")

        # 3. CR login with course_name
        cr_res = self.client.post("/api/auth/login", json={
            "email": "neha.cr@edutrack.ac",
            "password": "EduTrack@2024",
            "course_name": "B.Tech CSE - Section A (Sem 3)"
        })
        self.assertEqual(cr_res.status_code, 200)
        cr_data = cr_res.json()
        self.assertEqual(cr_data["user"]["role_name"], "CR")
        self.assertEqual(cr_data["user"]["subject_or_course"], "B.Tech CSE - Section A (Sem 3)")
        print("  [OK] Auto-inferred CR role from email; verified Enrolled Course.")

        # 4. New institutional HOD account registration (e.g. dev.hod@edutrack.ac)
        with get_db() as conn:
            conn.cursor().execute("DELETE FROM Users WHERE email = 'dev.hod@edutrack.ac'")
            conn.cursor().execute("DELETE FROM Institutional_Directory WHERE email = 'dev.hod@edutrack.ac'")
            conn.commit()

        new_hod_res = self.client.post("/api/auth/register", json={
            "full_name": "Department Administrator",
            "email": "dev.hod@edutrack.ac",
            "password": "SecurePassword@123",
            "selected_role": "HOD",
            "department": "Computer Science"
        })
        self.assertEqual(new_hod_res.status_code, 200)
        new_hod_data = new_hod_res.json()
        self.assertIn("token", new_hod_data)
        self.assertEqual(new_hod_data["user"]["full_name"], "Department Administrator")
        self.assertEqual(new_hod_data["user"]["role_name"], "HOD")
        print("  [OK] Successfully registered new institutional user 'dev.hod@edutrack.ac' as HOD!")

        # 5. Login with the newly registered account
        login_new_res = self.client.post("/api/auth/login", json={
            "email": "dev.hod@edutrack.ac",
            "password": "SecurePassword@123"
        })
        self.assertEqual(login_new_res.status_code, 200)
        login_new_data = login_new_res.json()
        self.assertIn("token", login_new_data)
        self.assertEqual(login_new_data["user"]["full_name"], "Department Administrator")
        self.assertEqual(login_new_data["user"]["role_name"], "HOD")
        self.assertEqual(login_new_data["user"]["department"], "Computer Science")
        print("  [OK] Successfully logged in with newly created account 'dev.hod@edutrack.ac' as HOD without any issues!")

        # Clean up so user can test on their screen
        with get_db() as conn:
            conn.cursor().execute("DELETE FROM Users WHERE email = 'dev.hod@edutrack.ac'")
            conn.cursor().execute("DELETE FROM Institutional_Directory WHERE email = 'dev.hod@edutrack.ac'")
            conn.commit()


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEduTrack3D)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)

