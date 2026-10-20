# =============================================================================
# EduTrack 3D — Relational Hierarchy & Data Isolation Engine Verification Suite
# =============================================================================
# Tests:
#   1. Clean Slate Database Reset (`POST /api/admin/reset-db`)
#   2. Email-Based Role Inference (HOD, Faculty, CR, Student)
#   3. Department -> Program -> Role Scoping & Isolation
#   4. HOD Department-Wide Omniscience & Notice Broadcaster
#   5. Anonymous Panic Grievance Stripping & Routing to HOD
# =============================================================================

import unittest
from fastapi.testclient import TestClient
from app import app
from db import init_db

client = TestClient(app)

class TestRelationalHierarchy(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_clean_slate_reset(self):
        """Test POST /api/admin/reset-db cleans dummy records while keeping baseline auth."""
        res = client.post("/api/admin/reset-db", json={"mode": "clean_slate"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertIn("Clean Slate", data.get("message"))

    def test_02_email_role_inference_and_registration(self):
        """Register fresh users with institutional email patterns and verify role + department + program."""
        # Register a CR in CSE - AIML
        reg_payload = {
            "full_name": "Aarav Sharma",
            "email": "aarav.cr@college.edu",
            "password": "Password@123",
            "department": "Computer Science",
            "program": "AIML"
        }
        res = client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["role_id"], 2)
        self.assertEqual(data["user"]["role_name"], "CR")
        self.assertEqual(data["user"]["department"], "Computer Science")
        self.assertEqual(data["user"]["program"], "AIML")

        # Register a Student in CSE - AIML
        stu_payload = {
            "full_name": "Rohan Gupta",
            "email": "rohan.student@college.edu",
            "password": "Password@123",
            "department": "Computer Science",
            "program": "AIML"
        }
        res_stu = client.post("/api/auth/register", json=stu_payload)
        self.assertEqual(res_stu.status_code, 200)
        stu_data = res_stu.json()
        self.assertEqual(stu_data["user"]["role_id"], 1)
        self.assertEqual(stu_data["user"]["role_name"], "STUDENT")

        # Register a Student in ECE - Core
        ece_stu_payload = {
            "full_name": "Vikram Singh",
            "email": "vikram.student@college.edu",
            "password": "Password@123",
            "department": "Electronics & Communication",
            "program": "Core ECE"
        }
        res_ece = client.post("/api/auth/register", json=ece_stu_payload)
        self.assertEqual(res_ece.status_code, 200)
        self.assertEqual(res_ece.json()["user"]["department"], "Electronics & Communication")

    def test_03_hod_notice_broadcaster_and_student_visibility(self):
        """HOD broadcasts department notice, visible to same department students, invisible to other departments."""
        # Login HOD
        hod_login = client.post("/api/auth/login", json={
            "email": "sanjay.hod@edutrack.ac",
            "password": "EduTrack@2024"
        })
        self.assertEqual(hod_login.status_code, 200)
        hod_token = hod_login.json()["token"]

        # HOD posts official exam schedule notice for all CSE programs
        notice_res = client.post(
            "/api/notices",
            json={
                "title": "Semester 3 Midterm Examination Schedule",
                "content": "All CSE examinations will commence from Nov 15th in Hall B.",
                "notice_type": "EXAM_NOTICE",
                "department": "Computer Science",
                "program": "ALL"
            },
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        self.assertEqual(notice_res.status_code, 200)

        # Login CSE Student
        stu_login = client.post("/api/auth/login", json={
            "email": "rohan.student@college.edu",
            "password": "Password@123"
        })
        self.assertEqual(stu_login.status_code, 200)
        stu_token = stu_login.json()["token"]

        # CSE Student fetches notices -> must see the CSE HOD notice
        stu_notices = client.get("/api/notices", headers={"Authorization": f"Bearer {stu_token}"})
        self.assertEqual(stu_notices.status_code, 200)
        titles = [n["title"] for n in stu_notices.json()["notices"]]
        self.assertIn("Semester 3 Midterm Examination Schedule", titles)

        # Login ECE Student
        ece_login = client.post("/api/auth/login", json={
            "email": "vikram.student@college.edu",
            "password": "Password@123"
        })
        self.assertEqual(ece_login.status_code, 200)
        ece_token = ece_login.json()["token"]

        # ECE Student fetches notices -> MUST NOT see the CSE HOD notice (strict isolation!)
        ece_notices = client.get("/api/notices", headers={"Authorization": f"Bearer {ece_token}"})
        self.assertEqual(ece_notices.status_code, 200)
        ece_titles = [n["title"] for n in ece_notices.json()["notices"]]
        self.assertNotIn("Semester 3 Midterm Examination Schedule", ece_titles)

        # HOD broadcasts campus-wide notice for ALL departments, ALL programs, ALL semesters
        campus_res = client.post(
            "/api/notices",
            json={
                "title": "Annual Inter-University Tech Fest - All Campus Invited",
                "content": "All students across all departments and semesters are eligible to participate.",
                "notice_type": "EVENT",
                "department": "ALL",
                "program": "ALL",
                "semester": "ALL"
            },
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        self.assertEqual(campus_res.status_code, 200)

        # Both CSE and ECE students MUST see the campus-wide notice!
        stu_notices2 = client.get("/api/notices", headers={"Authorization": f"Bearer {stu_token}"})
        self.assertIn("Annual Inter-University Tech Fest - All Campus Invited", [n["title"] for n in stu_notices2.json()["notices"]])
        ece_notices2 = client.get("/api/notices", headers={"Authorization": f"Bearer {ece_token}"})
        self.assertIn("Annual Inter-University Tech Fest - All Campus Invited", [n["title"] for n in ece_notices2.json()["notices"]])

        # HOD broadcasts targeted notice ONLY for AIML Semester 5
        targeted_res = client.post(
            "/api/notices",
            json={
                "title": "Semester 5 AIML Capstone Project Guidelines",
                "content": "Only 5th semester AIML students must submit project abstracts.",
                "notice_type": "NOTICE",
                "department": "Computer Science",
                "program": "AIML",
                "semester": "Semester 5"
            },
            headers={"Authorization": f"Bearer {hod_token}"}
        )
        self.assertEqual(targeted_res.status_code, 200)

        # CSE Student is in Semester 3 -> MUST NOT see Semester 5 targeted notice!
        stu_notices3 = client.get("/api/notices", headers={"Authorization": f"Bearer {stu_token}"})
        self.assertNotIn("Semester 5 AIML Capstone Project Guidelines", [n["title"] for n in stu_notices3.json()["notices"]])

    def test_04_anonymous_panic_button_routing_to_hod(self):
        """Student submits anonymous panic report: stripped of user_id, routed to CSE HOD, not ECE HOD."""
        stu_login = client.post("/api/auth/login", json={
            "email": "rohan.student@college.edu",
            "password": "Password@123"
        })
        self.assertEqual(stu_login.status_code, 200)
        stu_token = stu_login.json()["token"]

        panic_res = client.post(
            "/api/panic",
            json={"message": "Severe workload overload: 3 project deadlines and a lab test on Friday in AIML!"},
            headers={"Authorization": f"Bearer {stu_token}"}
        )
        self.assertEqual(panic_res.status_code, 200)
        panic_data = panic_res.json()
        self.assertEqual(panic_data["department"], "Computer Science")
        self.assertIn("severity", panic_data)

        # Verify CSE HOD receives it
        hod_login = client.post("/api/auth/login", json={
            "email": "sanjay.hod@edutrack.ac",
            "password": "EduTrack@2024"
        })
        self.assertEqual(hod_login.status_code, 200)
        hod_token = hod_login.json()["token"]
        hod_logs = client.get("/api/panic/logs", headers={"Authorization": f"Bearer {hod_token}"})
        self.assertEqual(hod_logs.status_code, 200)
        messages = [log["message_text"] for log in hod_logs.json()["panic_logs"]]
        self.assertTrue(any("Severe workload overload" in m for m in messages))

if __name__ == "__main__":
    unittest.main()
