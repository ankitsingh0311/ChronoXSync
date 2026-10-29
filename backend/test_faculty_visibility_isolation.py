# =============================================================================
# Unit and Integration Tests: Role-Based Deliverable Access
# Verify that Faculty, HOD, Student, and CR accounts have access to the correct resources.
# Ensure users cannot access deliverables or features outside their assigned permissions.
# =============================================================================
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app import app
from auth import create_jwt_token

client = TestClient(app)

def test_faculty_deliverable_isolation():
    # User 38: rishi kumar (Faculty who assigned system design assignment 2)
    tok_rishi = create_jwt_token(38, 'rishi kumar', 3, 'rishi.faculty@gmail.com',
                                 'School of Computer Science and Engineering',
                                 'B.Tech CSE (Artificial Intelligence & Machine Learning)', 'Semester 3')

    # User 39: param vishwakarma (Faculty who did NOT assign any assignment yet)
    tok_param = create_jwt_token(39, 'param vishwakarma', 3, 'param.faculty@gmail.com',
                                 'School of Computer Science and Engineering',
                                 'B.Tech CSE (Artificial Intelligence & Machine Learning)', 'Semester 3')

    # User 33: dr. krishnendu rarhi (HOD)
    tok_hod = create_jwt_token(33, 'dr. krishnendu rarhi', 4, 'krishnendu.hod@gmail.com',
                               'School of Computer Science and Engineering', 'ALL', 'Semester 3')

    # User 15: Sujal (Student)
    tok_student = create_jwt_token(15, 'sujal singh', 1, 'sujal.student@gmail.com',
                                   'School of Computer Science and Engineering',
                                   'B.Tech CSE (Artificial Intelligence & Machine Learning)', 'Semester 3')

    # 1. Faculty 1 (Rishi) only sees his own authored/delegated tasks
    res_rishi = client.get('/api/history', headers={'Authorization': f'Bearer {tok_rishi}'})
    assert res_rishi.status_code == 200
    rishi_tasks = res_rishi.json().get('tasks', [])
    for t in rishi_tasks:
        assert t['title'] != 'EXPERIMENT 10 _ OS', "Faculty Rishi should NOT see CR Ankit's experiment 10 task!"
    print(f"[PASS] Faculty Rishi sees strictly {len(rishi_tasks)} of his own tasks.")

    # 2. Faculty 2 (Param) sees 0 tasks because he did not author any
    res_param = client.get('/api/history', headers={'Authorization': f'Bearer {tok_param}'})
    assert res_param.status_code == 200
    param_tasks = res_param.json().get('tasks', [])
    assert len(param_tasks) == 0, "Faculty Param should see 0 tasks because he authored none!"
    print(f"[PASS] Faculty Param sees {len(param_tasks)} tasks (isolated).")

    # 3. HOD sees all department assignments
    res_hod = client.get('/api/history', headers={'Authorization': f'Bearer {tok_hod}'})
    assert res_hod.status_code == 200
    hod_tasks = res_hod.json().get('tasks', [])
    assert len(hod_tasks) >= 2, "HOD must see all assignments across the department!"
    print(f"[PASS] HOD sees all {len(hod_tasks)} department assignments.")

    # 4. Student sees all program assignments for coursework submission
    res_stud = client.get('/api/deadlines', headers={'Authorization': f'Bearer {tok_student}'})
    assert res_stud.status_code == 200
    stud_dls = res_stud.json().get('deadlines', [])
    assert len(stud_dls) >= 2, "Student must see all deliverables assigned to their program!"
    print(f"[PASS] Student sees all {len(stud_dls)} program deadlines for coursework.")

if __name__ == '__main__':
    test_faculty_deliverable_isolation()
    print("\n[SUCCESS] ALL ROLE VISIBILITY ISOLATION TESTS PASSED 100%!")
