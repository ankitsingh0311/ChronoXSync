# =============================================================================
# EduTrack 3D — Faculty to CR Delegation & Batch Publishing Test Suite
# =============================================================================

import os
import unittest
from fastapi.testclient import TestClient

os.environ["DATABASE_MODE"] = "sqlite"
os.environ["SQLITE_PATH"] = "edutrack.db"
os.environ["JWT_SECRET_KEY"] = "supersecret_jwt_key_for_testing_12345678"

from app import app
from db import init_local_db


class TestFacultyCRDelegations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_local_db()
        cls.client = TestClient(app)

        # 1. Login Faculty (Dr. Meena Iyer)
        res_fac = cls.client.post("/api/auth/login", json={
            "email": "meena.faculty@edutrack.ac",
            "password": "EduTrack@2024",
            "selected_role": "Faculty"
        })
        cls.fac_token = res_fac.json()["token"]
        cls.fac_headers = {"Authorization": f"Bearer {cls.fac_token}"}

        # 2. Login CR (Neha Gupta - Core CSE, Sem 3)
        res_cr = cls.client.post("/api/auth/login", json={
            "email": "neha.cr@edutrack.ac",
            "password": "EduTrack@2024",
            "selected_role": "CR"
        })
        cls.cr_token = res_cr.json()["token"]
        cls.cr_id = res_cr.json()["user"]["user_id"]
        cls.cr_headers = {"Authorization": f"Bearer {cls.cr_token}"}

        # 3. Login Student (Ankit Singh - Core CSE, Sem 3)
        res_stud = cls.client.post("/api/auth/login", json={
            "email": "ankit.student@edutrack.ac",
            "password": "EduTrack@2024",
            "selected_role": "Student"
        })
        cls.stud_token = res_stud.json()["token"]
        cls.stud_headers = {"Authorization": f"Bearer {cls.stud_token}"}

    def test_01_faculty_can_query_crs_by_program_and_semester(self):
        """Verify faculty can retrieve CRs matching selected Program and Semester."""
        res = self.client.get(
            "/api/delegations/crs?department=Computer%20Science&program=Core%20CSE&semester=Semester%203",
            headers=self.fac_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("crs", data)
        self.assertGreater(len(data["all_crs"]), 0)
        
        # Verify Neha Gupta appears in the CR roster
        neha = next((c for c in data["all_crs"] if "neha.cr" in c["email"]), None)
        self.assertIsNotNone(neha)
        self.assertEqual(neha["full_name"], "Neha Gupta")

    def test_02_faculty_can_upload_assignment_document(self):
        """Verify document upload endpoint works for assignment documents."""
        fake_file_content = b"%PDF-1.4 Mock Lab Assignment Sheet for Distributed Database Tuning"
        res = self.client.post(
            "/api/delegations/upload",
            files={"file": ("lab4_problem_sheet.pdf", fake_file_content, "application/pdf")},
            headers=self.fac_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("/uploads/", data["url"])
        self.assertEqual(data["filename"], "lab4_problem_sheet.pdf")

    def test_03_full_delegation_and_batch_publishing_lifecycle(self):
        """
        Verify end-to-end lifecycle:
        1. Faculty assigns work to CR (Neha Gupta).
        2. Status is PENDING.
        3. CR views inbox and sees the delegated assignment.
        4. CR publishes assignment to the Student Dashboard.
        5. Enrolled students immediately receive it on their feed.
        """
        # 1. Faculty creates delegation
        due_iso = "2026-11-20T17:00:00"
        create_res = self.client.post(
            "/api/delegations",
            json={
                "cr_id": self.cr_id, # Neha Gupta
                "program": "Core CSE",
                "semester": "Semester 3",
                "subject": "Database Management Systems (RDBMS)",
                "title": "Lab 4: Distributed Index Tuning & Concurrency Control",
                "description": "Implement multi-version concurrency control in SQLite and measure throughput.",
                "document_url": "/uploads/mock_lab4.pdf",
                "document_name": "lab4_instructions.pdf",
                "due_date": due_iso,
                "urgency": "HIGH",
                "estimated_hours": 6.5
            },
            headers=self.fac_headers
        )
        self.assertEqual(create_res.status_code, 200)
        create_data = create_res.json()
        self.assertTrue(create_data["success"])
        del_id = create_data["delegation_id"]

        # 2. Faculty views history and confirms PENDING status
        fac_hist = self.client.get("/api/delegations/faculty", headers=self.fac_headers)
        self.assertEqual(fac_hist.status_code, 200)
        fac_items = fac_hist.json()["delegations"]
        my_item = next((d for d in fac_items if d["delegation_id"] == del_id), None)
        self.assertIsNotNone(my_item)
        self.assertEqual(my_item["status"], "PENDING")
        self.assertEqual(my_item["cr_name"], "Neha Gupta")

        # 3. CR checks inbox
        cr_inbox = self.client.get("/api/delegations/cr", headers=self.cr_headers)
        self.assertEqual(cr_inbox.status_code, 200)
        cr_items = cr_inbox.json()["delegations"]
        delegated_for_cr = next((d for d in cr_items if d["delegation_id"] == del_id), None)
        self.assertIsNotNone(delegated_for_cr)
        self.assertEqual(delegated_for_cr["title"], "Lab 4: Distributed Index Tuning & Concurrency Control")

        # 4. CR publishes to Student Dashboard
        pub_res = self.client.post(f"/api/delegations/{del_id}/publish", headers=self.cr_headers)
        self.assertEqual(pub_res.status_code, 200)
        pub_data = pub_res.json()
        self.assertTrue(pub_data["success"])
        new_dl_id = pub_data["deadline_id"]

        # Verify status is now PUBLISHED in delegation table
        cr_inbox_after = self.client.get("/api/delegations/cr", headers=self.cr_headers)
        published_del = next((d for d in cr_inbox_after.json()["delegations"] if d["delegation_id"] == del_id), None)
        self.assertEqual(published_del["status"], "PUBLISHED")
        self.assertEqual(published_del["published_deadline_id"], new_dl_id)

        # 5. Enrolled Student fetches deadlines feed and sees the published coursework
        stud_feed = self.client.get("/api/deadlines", headers=self.stud_headers)
        self.assertEqual(stud_feed.status_code, 200)
        dl_list = stud_feed.json()["deadlines"]
        found_dl = next((dl for dl in dl_list if dl["deadline_id"] == new_dl_id), None)
        self.assertIsNotNone(found_dl)
        self.assertEqual(found_dl["title"], "Lab 4: Distributed Index Tuning & Concurrency Control")
        self.assertIn("Prof. Dr. Meena Iyer", found_dl["description"])


if __name__ == "__main__":
    unittest.main()
