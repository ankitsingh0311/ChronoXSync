# =============================================================================
# EduTrack 3D — Authentication & RBAC Module (auth.py)
# =============================================================================
# SUBJECT 4 (Cloud Security): Secure Authentication and Access Control
#   - Uses bcrypt for password hashing, JWT for token handling, and RBAC decorators
#     to restrict access based on user roles.

# SUBJECT 2 (System Design): Stateless Authentication Architecture
#   - Uses JWT-based authentication to support scalability across the three-tier
#     client-server application.
# =============================================================================

import os
import time
import logging
import functools
from datetime import datetime, timedelta, timezone

import jwt
import bcrypt
import bleach
from fastapi import HTTPException, Request

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("edutrack.auth")

# --- JWT Configuration (Subject 4: Cloud Security) ---
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "edutrack_fallback_secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

# --- Role Constants (4 Distinct Roles per specification) ---
ROLE_STUDENT = 1
ROLE_CR = 2
ROLE_FACULTY = 3
ROLE_HOD = 4

ROLE_NAMES = {
    ROLE_STUDENT: "STUDENT",
    ROLE_CR: "CR",
    ROLE_FACULTY: "FACULTY",
    ROLE_HOD: "HOD"
}


def hash_password(plain_password: str) -> str:
    """
    SUBJECT 4 (Cloud Security): Hash password using bcrypt with 12 rounds
    of salting. Returns the hashed string for database storage.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    SUBJECT 4 (Cloud Security): Verify a plaintext password against its
    bcrypt hash. Returns True if match, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_jwt_token(
    user_id: int,
    full_name: str,
    role_id: int,
    email: str = "",
    department: str = "Computer Science",
    program: str = "Core CSE",
    semester: str = "Semester 3"
) -> str:
    """
    SUBJECT 4 (Cloud Security): Generate a signed JWT token containing
    user identity, role, department, program, and semester for RBAC and scoping.
    Payload: { user_id, full_name, name, email, role_id, role_name, department, program, semester, exp, iat }
    """
    role_name = ROLE_NAMES.get(role_id, "UNKNOWN")
    payload = {
        "user_id": user_id,
        "name": full_name,
        "full_name": full_name,
        "email": email,
        "role_id": role_id,
        "role_name": role_name,
        "department": department or "Computer Science",
        "program": program or "Core CSE",
        "semester": semester or "Semester 3",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    logger.info(f"JWT issued for user_id={user_id}, role={role_name}, dept={department}, prog={program}, sem={semester}")
    return token


def decode_jwt_token(token: str) -> dict:
    """
    SUBJECT 4 (Cloud Security): Decode and verify a JWT token.
    Raises HTTPException 401 if expired or invalid.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")


def get_current_user(request: Request) -> dict:
    """
    Extract and decode JWT from Authorization header.
    Expected format: 'Bearer <token>'
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = auth_header.split(" ", 1)[1]
    return decode_jwt_token(token)


def require_role(allowed_roles: list):
    """
    SUBJECT 4 (Cloud Security): RBAC decorator for FastAPI endpoints.
    Checks if the authenticated user's role_id is in the allowed_roles list.
    Returns 403 Forbidden if the user lacks the required role.

    Usage:
        @app.get("/api/protected")
        @require_role([ROLE_CR, ROLE_HOD])
        async def protected_endpoint(request: Request):
            user = request.state.user
            ...
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user = get_current_user(request)
            if user["role_id"] not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied. Required roles: {[ROLE_NAMES.get(r, r) for r in allowed_roles]}"
                )
            request.state.user = user
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


import html as _html

def sanitize_input(text: str) -> str:
    """
    SUBJECT 4 (Cloud Security): Sanitize user input against XSS and
    injection attacks using bleach.clean().
    Strips all HTML tags and attributes while preserving clean characters.
    """
    if not text:
        return ""
    cleaned = bleach.clean(text, tags=[], attributes={}, strip=True).strip()
    return _html.unescape(cleaned)
