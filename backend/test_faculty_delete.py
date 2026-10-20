import db
import app
from fastapi.testclient import TestClient

client = TestClient(app.app)

def test_delete_lifecycle():
    # 1. Login as Faculty (Dr. Meena Iyer - role_id 3)
    faculty_token_res = client.post('/api/auth/login', json={'email': 'meena.faculty@edutrack.ac', 'password': 'EduTrack@2024'})
    assert faculty_token_res.status_code == 200
    fac_token = faculty_token_res.json()['token']
    fac_headers = {'Authorization': f'Bearer {fac_token}'}

    # 2. Login as Student (Ankit Singh - role_id 1)
    student_token_res = client.post('/api/auth/login', json={'email': 'ankit.student@edutrack.ac', 'password': 'EduTrack@2024'})
    assert student_token_res.status_code == 200
    stud_token = student_token_res.json()['token']
    stud_headers = {'Authorization': f'Bearer {stud_token}'}

    # 3. Login as CR (Neha Gupta - role_id 2)
    cr_token_res = client.post('/api/auth/login', json={'email': 'neha.cr@edutrack.ac', 'password': 'EduTrack@2024'})
    assert cr_token_res.status_code == 200
    cr_token = cr_token_res.json()['token']
    cr_headers = {'Authorization': f'Bearer {cr_token}'}

    # 4. Create a test assignment
    create_res = client.post('/api/deadlines', headers=fac_headers, json={
        'title': 'Test Faculty Deletion Workflow Assignment',
        'course_id': 1,
        'due_date': '2026-11-30 23:59:00',
        'urgency': 'HIGH',
        'estimated_hours': 4.0,
        'description': 'Temporary assignment to test faculty deletion propagation to CR & student dashboards'
    })
    assert create_res.status_code == 200
    task_id = create_res.json()['deadline_id']
    print(f"1. Created Assignment ID: {task_id}")

    # 5. Verify Student and CR see the assignment in active feeds
    stud_dl = client.get('/api/deadlines', headers=stud_headers).json().get('deadlines', [])
    assert any(d['deadline_id'] == task_id for d in stud_dl), "Student should see active assignment"

    cr_dl = client.get('/api/deadlines', headers=cr_headers).json().get('deadlines', [])
    assert any(d['deadline_id'] == task_id for d in cr_dl), "CR should see active assignment"
    print("2. Verified: Visible on Student and CR active feeds.")

    # 6. Faculty deletes assignment (default soft-delete)
    del_res = client.delete(f'/api/deadlines/{task_id}', headers=fac_headers)
    assert del_res.status_code == 200
    print(f"3. Faculty deleted assignment: {del_res.json()}")

    # 7. Verify it is IMMEDIATELY removed from Student, CR, and Faculty active feeds
    stud_dl_after = client.get('/api/deadlines', headers=stud_headers).json().get('deadlines', [])
    assert not any(d['deadline_id'] == task_id for d in stud_dl_after), "Student MUST NOT see deleted assignment"

    cr_dl_after = client.get('/api/deadlines', headers=cr_headers).json().get('deadlines', [])
    assert not any(d['deadline_id'] == task_id for d in cr_dl_after), "CR MUST NOT see deleted assignment"

    fac_dl_after = client.get('/api/deadlines', headers=fac_headers).json().get('deadlines', [])
    assert not any(d['deadline_id'] == task_id for d in fac_dl_after), "Faculty active feed MUST NOT see deleted assignment"
    print("4. Verified: Automatically removed from Student, CR, and Faculty active feeds!")

    # 8. Verify it REMAINS in History as proof of work
    hist_res = client.get('/api/history', headers=fac_headers).json()
    hist_tasks = hist_res.get('tasks', [])
    deleted_in_hist = next((t for t in hist_tasks if t['deadline_id'] == task_id), None)
    assert deleted_in_hist is not None, "History MUST preserve the assignment as proof of work"
    assert deleted_in_hist.get('is_deleted') == 1, "History task must have is_deleted=1"
    assert deleted_in_hist.get('status') == "ARCHIVED / DELETED", "Status must show archived/deleted"
    print(f"5. Verified: Preserved in History page proof! status={deleted_in_hist.get('status')}")

    # 9. Faculty purges the assignment permanently from History
    purge_res = client.delete(f'/api/deadlines/{task_id}?permanent=true', headers=fac_headers)
    assert purge_res.status_code == 200

    hist_tasks_after_purge = client.get('/api/history', headers=fac_headers).json().get('tasks', [])
    assert not any(t['deadline_id'] == task_id for t in hist_tasks_after_purge), "Assignment should now be permanently purged from history"
    print("6. Verified: Permanent purge from history succeeded!")
    print("\nALL DELETION WORKFLOW TESTS PASSED WITH 100% ACCURACY!")

if __name__ == '__main__':
    test_delete_lifecycle()
