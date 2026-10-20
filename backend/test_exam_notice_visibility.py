from fastapi.testclient import TestClient
import app

client = TestClient(app.app)

def test_hod_exam_scheduling_and_student_cr_visibility():
    # 1. Login as HOD
    hod_login = client.post("/api/auth/login", json={"email": "sanjay.hod@edutrack.ac", "password": "EduTrack@2024", "expected_role": "HOD"})
    assert hod_login.status_code == 200, f"HOD login failed: {hod_login.text}"
    hod_token = hod_login.json().get("token") or hod_login.json().get("access_token")
    hod_headers = {"Authorization": f"Bearer {hod_token}"}
    hod_user = hod_login.json()["user"]
    print("[1] HOD user authenticated:", hod_user.get("name"), "| Dept:", hod_user.get("department"))

    # Fetch courses to find a valid course_id
    courses_res = client.get("/api/courses", headers=hod_headers)
    assert courses_res.status_code == 200
    courses_data = courses_res.json()
    courses = courses_data.get("courses", courses_data) if isinstance(courses_data, dict) else courses_data
    assert len(courses) > 0, f"No courses found in {courses_data}"
    target_course = courses[0]
    course_id = target_course["course_id"]
    print(f"[2] Selected Course: {target_course.get('course_name')} (ID: {course_id})")

    # 2. Schedule Exam as HOD
    exam_payload = {
        "course_id": course_id,
        "exam_type": "MIDTERM",
        "exam_date": "2026-11-20T10:00:00",
        "duration_minutes": 120,
        "venue": "Hall-A",
        "program": "ALL",
        "department": hod_user.get("department") or "Computer Science"
    }
    create_res = client.post("/api/exams", json=exam_payload, headers=hod_headers)
    assert create_res.status_code == 200, f"Exam creation failed: {create_res.text}"
    created_exam = create_res.json()
    exam_id = created_exam["exam_id"]
    print(f"[3] Exam scheduled successfully with id: {exam_id}")

    # 3. Post a Notice as HOD
    notice_payload = {
        "title": "Upcoming Midterm Notice",
        "content": "All students must report to Hall-A 15 minutes before the exam.",
        "category": "EXAM",
        "target_program": "ALL"
    }
    notice_res = client.post("/api/notices", json=notice_payload, headers=hod_headers)
    assert notice_res.status_code == 200, f"Notice creation failed: {notice_res.text}"
    notice_id = notice_res.json().get("notice_id")
    print(f"[4] Notice created successfully with id: {notice_id}")

    # 4. Login as Student (Ankit)
    student_login = client.post("/api/auth/login", json={"email": "ankit.student@edutrack.ac", "password": "EduTrack@2024", "expected_role": "STUDENT"})
    assert student_login.status_code == 200, f"Student login failed: {student_login.text}"
    student_token = student_login.json().get("token") or student_login.json().get("access_token")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    student_user = student_login.json()["user"]
    print("[5] Student user authenticated:", student_user.get("name"), "| Dept:", student_user.get("department"), "| Prog:", student_user.get("program"))

    # Query exams as Student
    student_exams_res = client.get("/api/exams", headers=student_headers)
    assert student_exams_res.status_code == 200
    student_exams_data = student_exams_res.json()
    student_exams = student_exams_data.get("exams", student_exams_data) if isinstance(student_exams_data, dict) else student_exams_data
    student_exam_ids = [e["exam_id"] for e in student_exams]
    assert exam_id in student_exam_ids, f"Exam {exam_id} not visible to student! Got: {student_exam_ids}"
    print(f"[6] Verified: Exam {exam_id} is visible on Student dashboard!")

    # Query notices as Student
    student_notices_res = client.get("/api/notices", headers=student_headers)
    assert student_notices_res.status_code == 200
    student_notices_data = student_notices_res.json()
    student_notices = student_notices_data.get("notices", student_notices_data) if isinstance(student_notices_data, dict) else student_notices_data
    student_notice_ids = [n["notice_id"] for n in student_notices]
    assert notice_id in student_notice_ids, f"Notice {notice_id} not visible to student! Got: {student_notice_ids}"
    print(f"[7] Verified: Notice {notice_id} is visible on Student dashboard!")

    # 5. Login as CR (Neha)
    cr_login = client.post("/api/auth/login", json={"email": "neha.cr@edutrack.ac", "password": "EduTrack@2024", "expected_role": "CR"})
    assert cr_login.status_code == 200, f"CR login failed: {cr_login.text}"
    cr_token = cr_login.json().get("token") or cr_login.json().get("access_token")
    cr_headers = {"Authorization": f"Bearer {cr_token}"}
    cr_user = cr_login.json()["user"]
    print("[8] CR user authenticated:", cr_user.get("name"), "| Dept:", cr_user.get("department"), "| Prog:", cr_user.get("program"))

    # Query exams as CR
    cr_exams_res = client.get("/api/exams", headers=cr_headers)
    assert cr_exams_res.status_code == 200
    cr_exams_data = cr_exams_res.json()
    cr_exams = cr_exams_data.get("exams", cr_exams_data) if isinstance(cr_exams_data, dict) else cr_exams_data
    cr_exam_ids = [e["exam_id"] for e in cr_exams]
    assert exam_id in cr_exam_ids, f"Exam {exam_id} not visible to CR! Got: {cr_exam_ids}"
    print(f"[9] Verified: Exam {exam_id} is visible on CR dashboard!")

    # Query notices as CR
    cr_notices_res = client.get("/api/notices", headers=cr_headers)
    assert cr_notices_res.status_code == 200
    cr_notices_data = cr_notices_res.json()
    cr_notices = cr_notices_data.get("notices", cr_notices_data) if isinstance(cr_notices_data, dict) else cr_notices_data
    cr_notice_ids = [n["notice_id"] for n in cr_notices]
    assert notice_id in cr_notice_ids, f"Notice {notice_id} not visible to CR! Got: {cr_notice_ids}"
    print(f"[10] Verified: Notice {notice_id} is visible on CR dashboard!")

    # 6. Test Program-Specific Exam Scoping
    prog_exam_payload = {
        "course_id": course_id,
        "exam_type": "FINAL",
        "exam_date": "2026-11-25T14:00:00",
        "duration_minutes": 180,
        "venue": "Lab-3",
        "program": "AIML",
        "department": "Computer Science"
    }
    prog_res = client.post("/api/exams", json=prog_exam_payload, headers=hod_headers)
    assert prog_res.status_code == 200
    aiml_exam_id = prog_res.json()["exam_id"]

    # Student Ankit is in Core CSE / B.Tech Computer Science & Engineering -> should NOT see AIML-only exam
    s_exams_after_data = client.get("/api/exams", headers=student_headers).json()
    s_exams_after = s_exams_after_data.get("exams", s_exams_after_data) if isinstance(s_exams_after_data, dict) else s_exams_after_data
    s_exam_ids_after = [e["exam_id"] for e in s_exams_after]
    assert aiml_exam_id not in s_exam_ids_after, f"Student in Core CSE should not see AIML-only exam {aiml_exam_id}"
    print(f"[11] Verified: Program-specific scoping works! AIML-only exam {aiml_exam_id} correctly hidden from Core CSE student.")

    # 7. Test Different Department Exam Scoping
    mech_exam_payload = {
        "course_id": course_id,
        "exam_type": "QUIZ",
        "exam_date": "2026-11-28T09:00:00",
        "duration_minutes": 60,
        "venue": "Mech-101",
        "program": "ALL",
        "department": "Mechanical Engineering"
    }
    mech_res = client.post("/api/exams", json=mech_exam_payload, headers=hod_headers)
    assert mech_res.status_code == 200
    mech_exam_id = mech_res.json()["exam_id"]

    s_exams_dept_data = client.get("/api/exams", headers=student_headers).json()
    s_exams_dept = s_exams_dept_data.get("exams", s_exams_dept_data) if isinstance(s_exams_dept_data, dict) else s_exams_dept_data
    s_exam_ids_dept = [e["exam_id"] for e in s_exams_dept]
    assert mech_exam_id not in s_exam_ids_dept, f"CSE Student should not see Mechanical Engineering exam {mech_exam_id}"
    print(f"[12] Verified: Department-specific scoping works! Mechanical exam {mech_exam_id} correctly hidden from CSE student.")

if __name__ == "__main__":
    test_hod_exam_scheduling_and_student_cr_visibility()
    print("\n==========================================")
    print("ALL VERIFICATION TESTS COMPLETED WITH 100% ACCURACY!")
    print("==========================================")
