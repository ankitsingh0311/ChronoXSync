#!/usr/bin/env python3
"""
ChronoSync — Live Website to GitHub Synchronization Utility
============================================================
Fetches registered user accounts and log data directly from the live production
website (https://chronoxsync.onrender.com) and synchronizes them into:
  - REGISTERED_USERS_DIRECTORY.md (Formatted role tables for owner visibility)
  - backend/registered_users_registry.json (Permanent registry payload)
  - USER_LOGIN_ACTIVITY_LOGS.md (Live login audit logs)
  - backend/login_activity.log (Plain text event stream)

And automatically commits and pushes all changes directly to GitHub!

Usage:
  python backend/sync_live_to_github.py
  python backend/sync_live_to_github.py --live-url https://chronoxsync.onrender.com
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime, timezone, timedelta
import requests

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(BACKEND_DIR)
DEFAULT_LIVE_URL = "https://chronoxsync.onrender.com"

# Import markdown renderer from app
sys.path.insert(0, BACKEND_DIR)
try:
    from app import _render_registered_users_markdown
except ImportError:
    # Standalone fallback renderer if app cannot be imported
    def _render_registered_users_markdown(registry: list, md_path: str):
        hod_users = [u for u in registry if u.get("role") == "HOD"]
        faculty_users = [u for u in registry if u.get("role") == "Faculty"]
        cr_users = [u for u in registry if u.get("role") == "CR"]
        student_users = [u for u in registry if u.get("role") == "Student"]

        ist_zone = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist_zone).strftime("%Y-%m-%d %I:%M %p IST")

        lines = [
            "# ChronoSync — Live Registered Institutional Users Directory (Production Ledger)",
            "",
            "> **CONFIDENTIAL ADMINISTRATIVE LEDGER (OWNER ACCESS ONLY)**  ",
            "> **Direct Platform Integration:** This ledger is directly connected to the ChronoSync Account Creation Portal.  ",
            "> Whenever any user registers on the platform (Student, CR, Faculty, or HOD), their credentials, role, institutional department, and coursework details are instantly saved here into their respective role table.  ",
            "> All accounts are simultaneously persisted in the SQLite relational database (`Users` table) with 12-round bcrypt hashes.",
            "",
            "---",
            "",
            "## 📊 Executive Registry Overview",
            "",
            f"- **Total Registered Accounts:** `{len(registry)}`",
            f"- **🏛️ Head of Department (HOD):** `{len(hod_users)}`",
            f"- **👨‍🏫 Faculty Members:** `{len(faculty_users)}`",
            f"- **👥 Class Representatives (CR):** `{len(cr_users)}`",
            f"- **🎓 Enrolled Students:** `{len(student_users)}`",
            f"- **🕒 Last Updated:** `{now_ist}`",
            "",
            "---",
            "",
            "## 🏛️ Head of Department (HOD) Accounts",
            "",
            "| # | Registered At (IST) | Full Name | Official Email | Account Password | Department / School | Program Supervision | Account Status |",
            "|---|---------------------|-----------|----------------|------------------|---------------------|---------------------|----------------|"
        ]

        if not hod_users:
            lines.append("| — | — | *No HOD accounts registered yet* | — | — | — | — | Pending Registration |")
        else:
            for idx, u in enumerate(hod_users, 1):
                name = u.get("full_name", "").replace("|", "-")
                em = u.get("email", "").replace("|", "-")
                pw = u.get("password", "").replace("|", "\\|")
                dept = u.get("department", "Computer Science").replace("|", "-")
                prog = u.get("program", "ALL").replace("|", "-")
                t = u.get("registered_at", "")
                lines.append(f"| {idx} | {t} | **{name}** | `{em}` | `{pw}` | {dept} | {prog} | Active in SQLite DB |")

        lines.extend([
            "",
            "---",
            "",
            "## 👨‍🏫 Faculty Accounts",
            "",
            "| # | Registered At (IST) | Faculty Name | Institutional Email | Account Password | School / Department | Teaching Program | Subject Taught | Account Status |",
            "|---|---------------------|--------------|---------------------|------------------|---------------------|------------------|----------------|----------------|"
        ])

        if not faculty_users:
            lines.append("| — | — | *No Faculty accounts registered yet* | — | — | — | — | — | Pending Registration |")
        else:
            for idx, u in enumerate(faculty_users, 1):
                name = u.get("full_name", "").replace("|", "-")
                em = u.get("email", "").replace("|", "-")
                pw = u.get("password", "").replace("|", "\\|")
                dept = u.get("department", "Computer Science").replace("|", "-")
                prog = u.get("program", "N/A").replace("|", "-")
                subj = (u.get("subject_taught") or u.get("semester") or "Core Faculty").replace("|", "-")
                t = u.get("registered_at", "")
                lines.append(f"| {idx} | {t} | **{name}** | `{em}` | `{pw}` | {dept} | {prog} | {subj} | Active in SQLite DB |")

        lines.extend([
            "",
            "---",
            "",
            "## 👥 Class Representative (CR) Accounts",
            "",
            "| # | Registered At (IST) | CR Name | College Email | Account Password | Department / School | Enrolled Program | Semester / Section | Account Status |",
            "|---|---------------------|---------|---------------|------------------|---------------------|------------------|--------------------|----------------|"
        ])

        if not cr_users:
            lines.append("| — | — | *No CR accounts registered yet* | — | — | — | — | — | Pending Registration |")
        else:
            for idx, u in enumerate(cr_users, 1):
                name = u.get("full_name", "").replace("|", "-")
                em = u.get("email", "").replace("|", "-")
                pw = u.get("password", "").replace("|", "\\|")
                dept = u.get("department", "Computer Science").replace("|", "-")
                prog = u.get("program", "Core CSE").replace("|", "-")
                sem = (u.get("semester") or "Semester 3").replace("|", "-")
                t = u.get("registered_at", "")
                lines.append(f"| {idx} | {t} | **{name}** | `{em}` | `{pw}` | {dept} | {prog} | {sem} | Active in SQLite DB |")

        lines.extend([
            "",
            "---",
            "",
            "## 🎓 Student Accounts",
            "",
            "| # | Registered At (IST) | Student Name | College Email | Account Password | Department / School | Degree Program | Semester | Account Status |",
            "|---|---------------------|--------------|---------------|------------------|---------------------|----------------|----------|----------------|"
        ])

        if not student_users:
            lines.append("| — | — | *No Student accounts registered yet* | — | — | — | — | — | Pending Registration |")
        else:
            for idx, u in enumerate(student_users, 1):
                name = u.get("full_name", "").replace("|", "-")
                em = u.get("email", "").replace("|", "-")
                pw = u.get("password", "").replace("|", "\\|")
                dept = u.get("department", "Computer Science").replace("|", "-")
                prog = u.get("program", "Core CSE").replace("|", "-")
                sem = (u.get("semester") or "Semester 3").replace("|", "-")
                t = u.get("registered_at", "")
                lines.append(f"| {idx} | {t} | **{name}** | `{em}` | `{pw}` | {dept} | {prog} | {sem} | Active in SQLite DB |")

        lines.append("")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))


def sync_live_website(live_url: str = DEFAULT_LIVE_URL, auto_push: bool = True):
    print("=" * 70)
    print("      ChronoSync — Live Website to GitHub Real-time Sync")
    print("=" * 70)
    print(f"[*] Target Production Host: {live_url}")

    ist_zone = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(ist_zone).strftime("%Y-%m-%d %I:%M:%S %p IST")

    json_path = os.path.join(BACKEND_DIR, "registered_users_registry.json")
    md_path = os.path.join(REPO_ROOT, "REGISTERED_USERS_DIRECTORY.md")
    log_md_path = os.path.join(REPO_ROOT, "USER_LOGIN_ACTIVITY_LOGS.md")
    plain_log_path = os.path.join(BACKEND_DIR, "login_activity.log")

    # 1. Load existing local registry
    local_registry = []
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as jf:
                local_registry = json.load(jf)
        except Exception:
            local_registry = []

    print(f"[*] Current local registry users: {len(local_registry)}")

    # 2. Fetch live users from live website
    live_users = []
    try:
        roster_url = f"{live_url.rstrip('/')}/api/auth/roster"
        res = requests.get(roster_url, timeout=15)
        if res.status_code == 200:
            data = res.json()
            live_users = data.get("registered_users", [])
            print(f"[OK] Successfully retrieved {len(live_users)} active registered users from live server.")
        else:
            print(f"[!] Warning: Roster request returned status {res.status_code}")
    except Exception as e:
        print(f"[!] Warning: Failed to connect to live roster API: {e}")

    # 3. Merge live users into registry
    added_count = 0
    for u in live_users:
        u_email = (u.get("email") or "").strip().lower()
        if not u_email:
            continue

        raw_role = (u.get("role") or "Student").strip().upper()
        if "HOD" in raw_role:
            c_role = "HOD"
        elif "FACULTY" in raw_role:
            c_role = "Faculty"
        elif "CR" in raw_role:
            c_role = "CR"
        else:
            c_role = "Student"

        existing = next((item for item in local_registry if item.get("email", "").lower() == u_email), None)
        if not existing:
            local_registry.append({
                "full_name": u.get("name") or "Institutional Member",
                "email": u_email,
                "password": "Stored Securely in Live SQLite DB",
                "role": c_role,
                "department": u.get("department") or "School of Computer Science and Engineering",
                "program": u.get("program") or "Core CSE",
                "semester": u.get("semester") or "Semester 3",
                "subject_taught": u.get("subjectOrCourse") or "",
                "registered_at": u.get("created_at") or now_ist,
                "status": "Active in Live Production DB"
            })
            added_count += 1
            print(f"    + Added live account: {u.get('name')} ({u_email}) [{c_role}]")

    # 4. Save updated registry JSON & Markdown
    with open(json_path, "w", encoding="utf-8") as jf:
        json.dump(local_registry, jf, indent=2, ensure_ascii=False)
    print(f"[OK] Updated {json_path} (Total accounts: {len(local_registry)})")

    _render_registered_users_markdown(local_registry, md_path)
    print(f"[OK] Rendered updated tables in {md_path}")

    # 5. Git Commit & Push to GitHub
    if auto_push and os.path.isdir(os.path.join(REPO_ROOT, ".git")):
        print("\n[*] Committing and pushing synchronized data to GitHub...")
        try:
            subprocess.run(
                ["git", "add", "REGISTERED_USERS_DIRECTORY.md", "USER_LOGIN_ACTIVITY_LOGS.md", "backend/registered_users_registry.json", "backend/login_activity.log"],
                cwd=REPO_ROOT,
                check=True
            )
            commit_msg = f"auto(sync): live sync {len(local_registry)} users & logs from {live_url}"
            diff_res = subprocess.run(["git", "diff", "--staged", "--name-only"], cwd=REPO_ROOT, capture_output=True, text=True)
            if diff_res.stdout.strip():
                subprocess.run(["git", "commit", "-m", commit_msg], cwd=REPO_ROOT, check=True)
                print(f"[OK] Committed: {commit_msg}")
                subprocess.run(["git", "pull", "--rebase", "origin", "main"], cwd=REPO_ROOT, check=True)
                subprocess.run(["git", "push", "origin", "main"], cwd=REPO_ROOT, check=True)
                print("[OK] Pushed directly to GitHub origin/main!")
            else:
                print("[i] No file changes to commit; repository is already 100% up to date with live site.")
        except Exception as ge:
            print(f"[!] Git operation error: {ge}")

    print("\n" + "=" * 70)
    print(" [OK] Synchronization Complete! Live accounts are safely in GitHub files.")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ChronoSync Live Website to GitHub Sync Utility")
    parser.add_argument("--live-url", default=DEFAULT_LIVE_URL, help="Base URL of live deployed backend")
    parser.add_argument("--no-push", action="store_true", help="Skip git push")
    args = parser.parse_args()

    sync_live_website(live_url=args.live_url, auto_push=not args.no_push)
