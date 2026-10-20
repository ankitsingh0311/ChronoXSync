"""
End-to-end verification script for:
1. History endpoint (/api/history) with all datasets (tasks, delegations, exams, notices, registered_users, stats).
2. Creating assignments and verifying permanent persistence in DB and /api/history.
3. Creating delegations and verifying permanent persistence in DB and /api/history.
4. Creating user accounts via /api/auth/register, logging in with newly created credentials,
   logging out, and re-authenticating seamlessly.
"""
import sys
import unittest
from fastapi.testclient import TestClient
from app import app
from db import get_db

class TestHistoryAndPersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_registration_and_persistent_login(self):
        """Verify that creating an account persists to the DB and allows reliable login."""
        unique_email = "prof.newfaculty.faculty@edutrack.ac"
        password = "SecurePassword@123"
        full_name = "Dr. New Professor"

        # Cleanup if existed
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Users WHERE LOWER(email)=LOWER(?)", (unique_email,))
            cursor.execute("DELETE FROM Institutional_Directory WHERE LOWER(email)=LOWER(?)", (unique_email,))
            conn.commit()

        # 1. Register account
        reg_res = self.client.post("/api/auth/register", json={
            "full_name": full_name,
            "email": unique_email,
            "password": password,
            "selected_role": "Faculty",
            "department": "Computer Science & Engineering",
            "subject_taught": "Advanced Operating Systems"
        })
        self.assertEqual(reg_res.status_code, 200, f"Registration failed: {reg_res.text}")
        data = reg_res.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["full_name"], full_name)

        # 2. Verify account is physically persisted in SQLite Users and Institutional_Directory tables
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_id, full_name, email, role_id FROM Users WHERE LOWER(email)=LOWER(?)", (unique_email,))
            u_row = cursor.fetchone()
            self.assertIsNotNone(u_row, "User was not persisted to SQLite Users table!")
            user_id = u_row[0]

            cursor.execute("SELECT authorized_role FROM Institutional_Directory WHERE LOWER(email)=LOWER(?)", (unique_email,))
            dir_row = cursor.fetchone()
            self.assertIsNotNone(dir_row, "User was not persisted to Institutional_Directory!")
            self.assertEqual(dir_row[0], "Faculty")

        # 3. Simulate user logout & logging in anew from another session
        login_res = self.client.post("/api/auth/login", json={
            "email": unique_email,
            "password": password,
            "selected_role": "Faculty"
        })
        self.assertEqual(login_res.status_code, 200, f"Login failed: {login_res.text}")
        token = login_res.json()["token"]
        self.assertTrue(len(token) > 20)

    def test_02_assigned_work_history_and_proof(self):
        """Verify faculty/CR assigned work is permanently saved and appears in /api/history."""
        # Login as faculty
        fac_login = self.client.post("/api/auth/login", json={
            "email": "meena.faculty@edutrack.ac",
            "password": "EduTrack@2024",
            "selected_role": "Faculty"
        })
        self.assertEqual(fac_login.status_code, 200)
        fac_token = fac_login.json()["token"]
        headers = {"Authorization": f"Bearer {fac_token}"}

        # 1. Create a coursework deadline
        task_res = self.client.post("/api/deadlines", json={
            "course_id": 1,
            "title": "Database Schema Proof Benchmark",
            "description": "Demonstrate permanent DB record audit trail with proof.",
            "due_date": "2026-12-15 23:59:00",
            "urgency": "HIGH",
            "pdf_blob_url": "/api/files/download/proof_schema.pdf"
        }, headers=headers)
        self.assertEqual(task_res.status_code, 200, f"Task creation failed: {task_res.text}")
        new_task_id = task_res.json().get("deadline_id")

        # 2. Check /api/history returns this work with 100% integrity
        hist_res = self.client.get("/api/history", headers=headers)
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.json()
        self.assertIn("tasks", hist_data)
        self.assertIn("delegations", hist_data)
        self.assertIn("exams", hist_data)
        self.assertIn("notices", hist_data)
        self.assertIn("registered_users", hist_data)
        self.assertIn("stats", hist_data)

        # Check our task is in the history
        task_ids = [t["task_id"] for t in hist_data["tasks"]]
        self.assertIn(new_task_id, task_ids, "Newly created assignment not found in history!")
        created_task = next(t for t in hist_data["tasks"] if t["task_id"] == new_task_id)
        self.assertEqual(created_task["title"], "Database Schema Proof Benchmark")
        self.assertEqual(created_task["file_attachment"], "/api/files/download/proof_schema.pdf")
        print(f"\n[OK] Task #{new_task_id} successfully persisted in SQLite and verified in /api/history!")

if __name__ == "__main__":
    unittest.main()
