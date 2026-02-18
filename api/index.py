from contextlib import asynccontextmanager
from pathlib import Path
import sys
from fastapi import FastAPI

# Make backend/app importable as `app`.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app as backend_app  # noqa: E402

# Serve backend under /api when deployed behind root-level Vercel rewrites.
# Explicitly forward lifespan so backend startup creates tables/storage.
@asynccontextmanager
async def lifespan(_: FastAPI):
    await backend_app.router.startup()
    try:
        yield
    finally:
        await backend_app.router.shutdown()


app = FastAPI(lifespan=lifespan)
app.mount("/api", backend_app)
