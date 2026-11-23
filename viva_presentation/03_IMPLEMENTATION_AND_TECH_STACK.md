# ⓷ Implementation & Technology Stack — ChronoXSync

---

## 1. Complete Technology Stack Matrix

| Layer / Subsystem | Technology | Version | Purpose & Strategic Rationale |
|:---|:---|:---|:---|
| **Frontend Framework** | **React** | `19.3.1` | Concurrent rendering, component reusability, modular architecture. |
| **Bundler & Tooling** | **Vite** | `8.3.4` | Sub-second HMR (Hot Module Replacement) and optimized tree-shaken production bundles. |
| **3D Graphics & Shaders** | **Three.js & R3F** | `0.186.1` / `@react-three/fiber 9.8` | WebGL hardware-accelerated 3D shaders for conflict crystal and cognitive stress rendering. |
| **Styling & Design Tokens**| **Tailwind CSS** | `4.3.3` | High-performance CSS engine with CSS variables, custom tokens, and tactile utility classes. |
| **Animation Physics** | **Framer Motion** | `14.3.0` | Declarative layout animations, tab switching morphs, and spring physics. |
| **Client-Side Routing** | **React Router** | `7.18.4` | Dynamic URL parameter resolution (`?role=faculty`, `/login`, `/signup`) with state persistence. |
| **Icons Library** | **Lucide React** | `1.58.0` | Tree-shaken, pixel-crisp SVG icons matching system aesthetics. |
| **Backend Framework** | **FastAPI** | `0.104+` | High-throughput asynchronous ASGI Python web framework with auto OpenAPI documentation. |
| **ASGI Web Server** | **Uvicorn** | `0.23+` | Blazing-fast uvloop-based asynchronous web server. |
| **Programming Language**| **Python** | `3.11+` | Native async/await concurrency, strict type hints, and robust ecosystem. |
| **Database (Local/Dev)** | **SQLite 3** | `3.40+` | Zero-configuration ACID-compliant SQL engine with in-process sub-millisecond execution. |
| **Database (Production)**| **Azure SQL / SQL Server**| Enterprise | Enterprise cloud persistence with transactional clustering via `pyodbc`. |
| **Password Hashing** | **Bcrypt** | `4.0+` | Salted 12-round key derivation function resilient against GPU rainbow table attacks. |
| **Token Authentication** | **PyJWT** | `2.8+` | Stateless HS256 signed bearer tokens with role claims and expiration guards. |
| **Document OCR** | **PyMuPDF / pytesseract** | `1.23+` | High-accuracy text and metadata extraction from uploaded assignment and syllabus PDFs. |
| **NLP Sentiment Analysis**| **VADER / TextBlob**| `3.3+` | Lexicon and rule-based sentiment scoring for anonymous student grievance polarity. |
| **Scheduling Engine** | **APScheduler** | `3.10+` | Background temporal daemon triggering automated deadline and examination notifications. |
| **Cloud Hosting (Front)**| **Vercel** | Global Edge | Global CDN distribution with automatic SSL, caching, and Git push deployments. |
| **Cloud Hosting (Back)** | **Render** | Cloud Native | Managed Linux container service hosting the FastAPI ASGI web application. |

---

## 2. Backend Module Architecture

The backend is structured into modular domains ensuring separation of concerns:

```
backend/
├── app.py              # Main ASGI application entrypoint, CORS configuration, API route registration
├── auth.py             # Bcrypt password verification, JWT token issuance, @require_role decorators
├── cache.py            # In-memory TTL caching with atomic eviction on data write mutations
├── config.py           # Environment variables, database connection strings, JWT secret resolvers
├── database.py         # DB connection pool factory (supports both SQLite and Azure SQL)
├── requirements.txt    # Frozen dependency specifications with compatible version locks
├── test_system.py      # Automated E2E verification suite testing auth, triggers, and routes
└── uploads/            # Sandboxed directory for submitted coursework PDF deliverables
```

### Key Python Implementation Highlights:

#### 1. Role-Based Access Control Middleware (`backend/auth.py`)
```python
def require_role(allowed_roles: list[int]):
    """
    Enforces institutional clearance levels:
    1 = Student, 2 = Class Representative, 3 = Faculty Professor, 4 = Head of Department
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: dict = Depends(get_current_user), **kwargs):
            if current_user.get("role_id") not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: Insufficient institutional clearance for this operation."
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
```

#### 2. HMAC SHA-256 Non-Repudiation Generation (`backend/app.py`)
```python
def generate_submission_hash(student_id: int, deadline_id: int, timestamp_ms: int, status: str) -> str:
    """
    Generates a cryptographically unforgeable digital wax seal.
    Any alteration of timestamp or IDs produces a completely divergent hash.
    """
    payload = f"{student_id}|{deadline_id}|{timestamp_ms}|{status}|{SERVER_VAULT_SECRET}".encode("utf-8")
    return hmac.new(SERVER_VAULT_SECRET.encode("utf-8"), payload, hashlib.sha256).hexdigest()
```

#### 3. In-Memory Cache with Automatic Mutation Invalidation (`backend/cache.py`)
```python
class CacheManager:
    def __init__(self, default_ttl: int = 120):
        self._store = {}
        self._default_ttl = default_ttl

    def get(self, key: str):
        entry = self._store.get(key)
        if entry and time.time() < entry["expires_at"]:
            return entry["data"]
        return None

    def invalidate_department(self, department_id: int):
        """Purges cached query views whenever a new deadline or exam is scheduled."""
        keys_to_del = [k for k in self._store if f"dept_{department_id}" in k]
        for k in keys_to_del:
            self._store.pop(k, None)
```

---

## 3. Frontend Architecture & State Management

The frontend is built as a single-page application (SPA) with reactive component architecture:

```
frontend/src/
├── App.jsx             # React Router v7 routes with ProtectedRoute and RoleBarrier guards
├── index.css           # Tactile button tokens, custom scrollbars, typography, and theme definitions
├── components/
│   ├── ExecutiveProfileHeader.jsx   # Institutional identity banner with verified social badges
│   ├── WorkloadDensityGraph.jsx     # Pure SVG cubic spline calculation for cognitive load
│   ├── TaskCard.jsx                 # Coursework deliverable card with micro-interaction hover
│   ├── ConflictModal.jsx            # 3D WebGL Three.js collision visualizer
│   └── CryptoVerifierTerminal.jsx   # Interactive forensic SHA-256 audit terminal
├── context/
│   ├── AuthContext.jsx              # User session, JWT storage, and automatic token refresh
│   └── ThemeContext.jsx             # Dual-theme switcher (Radiant Light vs. Obsidian Dark)
└── pages/
    ├── PublicDemoDashboard.jsx      # Master interactive tour showcasing all 4 roles
    ├── LoginPage.jsx                # Institutional single sign-on authentication portal
    └── SignupPage.jsx               # Multi-role account onboarding registration
```

---

## 4. Development & Build Pipelines
1. **Local Development**:
   - `start_backend.bat`: Automatic activation of Python virtualenv and Uvicorn hot-reload on port 8000.
   - `start_frontend.bat`: Vite dev server execution on port 5173 with lightning-fast HMR.
2. **Production Build & CI/CD**:
   - `cd frontend && npm run build`: Vite compiles and tree-shakes React 19 code into `/dist`, generating optimized JS and CSS bundles.
   - Git push to `origin main` automatically triggers Webhook builds on **Vercel** (Frontend Edge CDN) and **Render** (FastAPI Web Service).
