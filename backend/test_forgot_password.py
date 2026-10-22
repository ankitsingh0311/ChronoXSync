# =============================================================================
# EduTrack 3D — Forgot & Reset Password Test Suite (test_forgot_password.py)
# =============================================================================

from fastapi.testclient import TestClient
import app
import db

client = TestClient(app.app)

def test_forgot_password_flow():
    # 0. Ensure database tables exist
    db.init_local_db()

    # 1. Test invalid email format rejection
    res = client.post("/api/auth/forgot-password", json={"email": "invalid-email"})
    assert res.status_code == 400

    # 2. Test non-existent email rejection (404)
    res = client.post("/api/auth/forgot-password", json={"email": "nonexistent.user@edutrack.ac"})
    assert res.status_code == 404
    assert "No registered account found" in res.json()["detail"]

    # 3. Test valid request for registered user (e.g. ankit.student@edutrack.ac)
    test_email = "ankit.student@edutrack.ac"
    res = client.post("/api/auth/forgot-password", json={"email": test_email})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "preview_otp" in data
    assert len(data["preview_otp"]) == 6
    otp = data["preview_otp"]

    # 4. Test reset password with invalid OTP
    bad_otp_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp_code": "000000",
        "new_password": "NewSecretPassword@123",
        "confirm_password": "NewSecretPassword@123"
    })
    assert bad_otp_res.status_code == 400
    assert "Invalid 6-digit verification code" in bad_otp_res.json()["detail"]

    # 5. Test reset password with mismatched confirm password
    mismatch_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp_code": otp,
        "new_password": "NewSecretPassword@123",
        "confirm_password": "DifferentPassword@456"
    })
    assert mismatch_res.status_code == 400
    assert "do not match" in mismatch_res.json()["detail"]

    # 6. Test reset password with short password (< 8 chars)
    short_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp_code": otp,
        "new_password": "short",
        "confirm_password": "short"
    })
    assert short_res.status_code == 400
    assert "at least 8 characters" in short_res.json()["detail"]

    # 7. Test successful password reset
    new_password = "UpdatedPassword@2026!"
    success_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp_code": otp,
        "new_password": new_password,
        "confirm_password": new_password
    })
    assert success_res.status_code == 200
    assert success_res.json()["success"] is True

    # 8. Test logging in with the old password (MUST FAIL with 401)
    old_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "EduTrack@2024"
    })
    assert old_login.status_code == 401

    # 9. Test logging in with the newly reset password (MUST SUCCEED with 200 and issue JWT)
    new_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": new_password
    })
    assert new_login.status_code == 200
    assert "token" in new_login.json()
    assert new_login.json()["user"]["email"].lower() == test_email.lower()

    # 10. Test that already used OTP cannot be reused (replay attack prevention)
    replay_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp_code": otp,
        "new_password": "AnotherPassword@999",
        "confirm_password": "AnotherPassword@999"
    })
    assert replay_res.status_code == 400

    # 11. Reset back to EduTrack@2024 so other test suites remain consistent
    res2 = client.post("/api/auth/forgot-password", json={"email": test_email})
    otp2 = res2.json()["preview_otp"]
    restore_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp_code": otp2,
        "new_password": "EduTrack@2024",
        "confirm_password": "EduTrack@2024"
    })
    assert restore_res.status_code == 200

    print(" ALL 11 FORGOT & RESET PASSWORD TEST STEPS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_forgot_password_flow()
