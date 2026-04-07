import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .api import auth, user, practice, progress, vocabulary, journal, chat
from .api import conference, debate, interview, anxiety, patterns, culture, dashboard, rtc

app = FastAPI(
    title="AI Communication Coach API",
    description="Full production backend for AI Communication Coach — 20 DB tables, 16 screen APIs",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://velixai.onrender.com",
        "https://velix-ai.onrender.com",
        os.getenv("FRONTEND_URL", "https://yourplaceholder.onrender.com"),
    ],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",         tags=["Auth"])
app.include_router(dashboard.router,   prefix="/api/dashboard",    tags=["Dashboard"])
app.include_router(user.router,        prefix="/api/user",         tags=["User"])
app.include_router(practice.router,    prefix="/api/practice",     tags=["Practice"])
app.include_router(progress.router,    prefix="/api/progress",     tags=["Progress"])
app.include_router(vocabulary.router,  prefix="/api/vocabulary",   tags=["Vocabulary"])
app.include_router(journal.router,     prefix="/api/journal",      tags=["Journal"])
app.include_router(conference.router,  prefix="/api/conference",   tags=["Conference"])
app.include_router(debate.router,      prefix="/api/debate",       tags=["Debate"])
app.include_router(interview.router,   prefix="/api/interview",    tags=["Interview"])
app.include_router(anxiety.router,     prefix="/api/anxiety",      tags=["Anxiety"])
app.include_router(patterns.router,    prefix="/api/patterns",     tags=["Patterns"])
app.include_router(culture.router,     prefix="/api/culture",      tags=["Culture"])
app.include_router(rtc.router,         prefix="/api/rtc",         tags=["RTC"])
app.include_router(chat.router,        prefix="/api/chat",        tags=["Chat"])

# ── Static Files (Production) ────────────────────────────────────────────────
# Path to built frontend (adjust if Render build script puts it elsewhere)
FRONTEND_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))), "frontend", "dist")

if os.path.exists(FRONTEND_PATH):
    # Serve assets folder
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_PATH, "assets")), name="static")

    # Serve index.html for all other routes (React Routing)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Skip API routes and existing static files
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None # FastAPI will continue to routers
        
        target = os.path.join(FRONTEND_PATH, full_path)
        if os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
            
        return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
