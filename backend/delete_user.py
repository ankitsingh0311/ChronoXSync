"""
ChronoSync — Administrative User Deletion CLI Utility
Safely and permanently deletes any user from the SQLite database
(including all associated submissions, delegations, notices, and syllabi)
and synchronizes with REGISTERED_USERS_DIRECTORY.md and registered_users_registry.json.

Usage:
    python backend/delete_user.py <email_or_user_id>
    OR
    python backend/delete_user.py  (Interactive menu)
"""

import sys
import os
import sqlite3
import json

backend_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(backend_dir)
db_path = os.path.join(backend_dir, "edutrack.db")

# Add backend to path so we can import helpers
sys.path.insert(0, backend_dir)
from app import _remove_registered_user_from_markdown


def get_db():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def list_users():
    if not os.path.exists(db_path):
        print(f"[!] Database file not found at: {db_path}")
        return []
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, full_name, email, role_name, department FROM Users ORDER BY user_id ASC")
        return cursor.fetchall()


def delete_user_by_identifier(identifier: str):
    identifier = identifier.strip()
    if not identifier:
        print("[!] No user specified.")
        return False

    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if identifier is user_id or email
        if identifier.isdigit():
            cursor.execute("SELECT user_id, full_name, email, role_name FROM Users WHERE user_id = ?", (int(identifier),))
        else:
            cursor.execute("SELECT user_id, full_name, email, role_name FROM Users WHERE LOWER(email) = LOWER(?)", (identifier,))
            
        row = cursor.fetchone()
        if not row:
            print(f"[X] User '{identifier}' not found in database.")
            return False

        u_id = row["user_id"]
        u_name = row["full_name"]
        u_email = row["email"]
        u_role = row["role_name"]

        print(f"\n[*] Found User: {u_name} ({u_email}) | Role: {u_role} | ID: {u_id}")
        
        # Cascade clean child tables
        cursor.execute("DELETE FROM Crypto_Verification_Logs WHERE verified_by_user_id = ?", (u_id,))
        cursor.execute("""
            DELETE FROM Crypto_Verification_Logs 
            WHERE submission_id IN (
                SELECT submission_id FROM Submissions 
                WHERE student_id = ? OR user_id = ? OR deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)
            )
        """, (u_id, u_id, u_id))

        cursor.execute("DELETE FROM Deadline_Reminders WHERE user_id = ?", (u_id,))
        cursor.execute("DELETE FROM Deadline_Reminders WHERE deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)", (u_id,))

        cursor.execute("DELETE FROM Submissions WHERE student_id = ? OR user_id = ?", (u_id, u_id))
        cursor.execute("DELETE FROM Submissions WHERE deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)", (u_id,))
        try:
            cursor.execute("DELETE FROM Submissions_old WHERE user_id = ?", (u_id,))
            cursor.execute("DELETE FROM Submissions_old WHERE deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)", (u_id,))
        except Exception:
            pass

        try:
            cursor.execute("DELETE FROM Student_Certificates WHERE user_id = ?", (u_id,))
        except Exception:
            pass

        cursor.execute("DELETE FROM Panic_Logs WHERE user_id = ? OR LOWER(student_email) = LOWER(?)", (u_id, u_email))
        cursor.execute("DELETE FROM Faculty_CR_Delegations WHERE faculty_id = ? OR cr_id = ?", (u_id, u_id))
        cursor.execute("DELETE FROM Faculty_CR_Delegations WHERE published_deadline_id IN (SELECT deadline_id FROM Deadlines WHERE posted_by = ?)", (u_id,))

        cursor.execute("SELECT syllabus_id FROM Faculty_Syllabus WHERE faculty_id = ?", (u_id,))
        syl_ids = [r[0] for r in cursor.fetchall()]
        for s_id in syl_ids:
            cursor.execute("DELETE FROM Syllabus_Units WHERE syllabus_id = ?", (s_id,))
        cursor.execute("DELETE FROM Faculty_Syllabus WHERE faculty_id = ?", (u_id,))

        cursor.execute("DELETE FROM Deadlines WHERE posted_by = ?", (u_id,))
        cursor.execute("DELETE FROM Exam_Schedules WHERE scheduled_by = ?", (u_id,))
        cursor.execute("DELETE FROM Department_Notices WHERE posted_by = ?", (u_id,))

        try:
            cursor.execute("DELETE FROM Password_Resets WHERE LOWER(email) = LOWER(?)", (u_email,))
        except Exception:
            pass

        # Delete from Users & Institutional_Directory
        cursor.execute("DELETE FROM Users WHERE user_id = ?", (u_id,))
        cursor.execute("DELETE FROM Institutional_Directory WHERE LOWER(email) = LOWER(?)", (u_email,))
        
        conn.commit()

    # Synchronize with REGISTERED_USERS_DIRECTORY.md
    _remove_registered_user_from_markdown(u_email)

    print(f"[OK] User '{u_name}' ({u_email}) successfully deleted from SQLite Database.")
    print(f"[OK] Removed from REGISTERED_USERS_DIRECTORY.md and registered_users_registry.json.")
    print(f"[OK] All tables in REGISTERED_USERS_DIRECTORY.md have been updated!")
    return True


def main():
    print("=" * 65)
    print("      ChronoSync — Administrative User Deletion Utility")
    print("=" * 65)

    if len(sys.argv) > 1:
        target = sys.argv[1]
        delete_user_by_identifier(target)
        return

    users = list_users()
    if not users:
        print("\nNo users currently in the database.")
        return

    print(f"\nActive Users in Database ({len(users)} Total):")
    print("-" * 65)
    print(f"{'ID':<4} | {'Role':<10} | {'Name':<22} | {'Email'}")
    print("-" * 65)
    for u in users:
        print(f"{u['user_id']:<4} | {u['role_name']:<10} | {u['full_name']:<22} | {u['email']}")
    print("-" * 65)

    try:
        choice = input("\nEnter User ID or Email to delete (or press Enter to cancel): ").strip()
        if choice:
            confirm = input(f"Are you sure you want to delete '{choice}'? (y/N): ").strip().lower()
            if confirm in ("y", "yes"):
                delete_user_by_identifier(choice)
            else:
                print("Deletion cancelled.")
        else:
            print("Operation cancelled.")
    except (KeyboardInterrupt, EOFError):
        print("\nOperation cancelled.")


if __name__ == "__main__":
    main()
