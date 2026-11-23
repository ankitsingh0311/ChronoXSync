# ⓹ Code Quality, Logic & Architecture — ChronoXSync

---

## 1. Code Quality Principles & Engineering Standards

ChronoXSync was developed following strict software engineering principles:

| Principle | Implementation in ChronoXSync | Code Artifact / Location |
|:---|:---|:---|
| **Single Responsibility (SRP)** | Separate modules for authentication, database pooling, caching, and routing. | `backend/auth.py`, `backend/cache.py`, `backend/database.py` |
| **Open / Closed Principle (OCP)**| Role decorators and middleware allow adding new clearance levels without modifying route logic. | `@require_role` in `backend/auth.py` |
| **Liskov Substitution (LSP)** | Dual-database connection factory supporting SQLite and Azure SQL via a unified interface. | `get_db_connection()` in `backend/database.py` |
| **Interface Segregation (ISP)** | Granular REST endpoints for Deadlines, Exams, Grievances, and Calendar tokens rather than monolithic endpoints. | Separate routers in `backend/app.py` |
| **Dependency Inversion (DIP)** | Database sessions and authenticated users injected via FastAPI's `Depends()` dependency injection. | `current_user: dict = Depends(get_current_user)` |
| **DRY (Don't Repeat Yourself)** | Reusable UI components for cards, profile banners, and verification terminals. | `frontend/src/components/` |
| **ACID Integrity** | Transactions wrapped in explicit `BEGIN ... COMMIT / ROLLBACK` blocks with trigger barriers. | `database/schema.sql` (`trg_PreventExamClash`) |

---

## 2. Deep Dive: Key Logic & Algorithms

### A. The 24-Hour Conflict Guard SQL Trigger
In `database/schema.sql`, the trigger intercepts any deadline insertion and checks if an exam exists within 24 hours:
```sql
CREATE TRIGGER IF NOT EXISTS trg_PreventExamClash
BEFORE INSERT ON Deadlines
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM Exams e
            JOIN Courses c ON e.course_id = c.course_id
            WHERE c.department_id = (SELECT department_id FROM Courses WHERE course_id = NEW.course_id)
            AND ABS(strftime('%s', NEW.due_date) - strftime('%s', e.exam_date)) < 86400
        )
        THEN RAISE(ABORT, 'ACID Violation: Cannot schedule deadline within 24 hours of an examination in this department.')
    END;
END;
```

---

### B. Pure SVG Dynamic Workload Spline Interpolation
In `frontend/src/components/WorkloadDensityGraph.jsx`, study hours across 7 days are mapped to a smooth cubic Bézier spline curve:
```javascript
// Calculates smooth cubic Bézier control points between day coordinates
function getSplinePath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
```

---

### C. Safe Attendance Cut Margin Algorithm
In `frontend/src/pages/PublicDemoDashboard.jsx`, the system continuously monitors the 75% attendance threshold:
$$\text{Current Ratio} = \frac{\text{Attended Lectures}}{\text{Total Lectures}}$$
$$\text{Safe Cuts Remaining} = \max\left(0, \left\lfloor \frac{\text{Attended} - 0.75 \times \text{Total}}{0.75} \right\rfloor\right)$$
$$\text{Lectures Needed to Recover} = \max\left(0, \lceil 3 \times \text{Total} - 4 \times \text{Attended} \rceil\right)$$

---

### D. Brute-Force Rate Limiting & SIEM Defense
In `backend/app.py`, login attempts are tracked per IP and email:
```python
MAX_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 900  # 15 minutes

def record_failed_login(identifier: str):
    attempts = failed_attempts.get(identifier, 0) + 1
    failed_attempts[identifier] = attempts
    if attempts >= MAX_ATTEMPTS:
        lockout_expiry[identifier] = time.time() + LOCKOUT_WINDOW_SECONDS
        log_security_audit(f"ALERT: 5-strike account lockout triggered for {identifier}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to excessive failed password attempts. Try again in 15 minutes."
        )
```

---

## 3. Error Handling & Defensive Programming
1. **Parameterized Queries**: Every SQL query uses `:params` or `?` placeholders to guarantee 100% immunity against SQL injection.
2. **Pydantic Validation Models**: Enforces strict typing, email format checks, and min/max length constraints before data touches application logic.
3. **Graceful Degradation**: If WebGL or Three.js fails on low-end hardware, the 3D visualizers degrade gracefully to high-contrast SVG representations without throwing uncaught exceptions.
4. **CORS & Security Headers**: Strict origin policies configured in FastAPI middleware preventing unauthorized cross-origin tampering.
