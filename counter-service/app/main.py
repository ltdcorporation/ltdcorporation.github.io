from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .config import get_settings
from .db import engine, session_scope, ensure_schema
from .schemas import HitRequest, CounterResponse

app = FastAPI(title="LTD Visitor Counter", version="1.0.0")
allowed_origins = [
    "https://asiafap.com",
    "https://www.asiafap.com",
    "https://ltdcorporation.github.io",
    "https://ltdcorporation.github.io/ltdcorporation.github.io",
    "http://localhost:4173",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
settings = get_settings()
ensure_schema()

UPSERT_SQL = text(
    """
    INSERT INTO counters(namespace, count)
    VALUES (:namespace, :inc)
    ON CONFLICT (namespace)
    DO UPDATE SET count = counters.count + :inc, updated_at = NOW()
    RETURNING count;
    """
)

SELECT_SQL = text(
    "SELECT count FROM counters WHERE namespace = :namespace"
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/hit", response_model=CounterResponse)
def hit_counter(payload: HitRequest):
    namespace = payload.namespace.strip().lower()
    try:
        with engine.begin() as conn:
            row = conn.execute(UPSERT_SQL, {"namespace": namespace, "inc": payload.increment}).fetchone()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="database_error") from exc
    return CounterResponse(namespace=namespace, value=row[0] if row else payload.increment)

@app.get("/count/{namespace}", response_model=CounterResponse)
def get_counter(namespace: str):
    namespace = namespace.strip().lower()
    try:
        with session_scope() as session:
            row = session.execute(SELECT_SQL, {"namespace": namespace}).fetchone()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail="database_error") from exc
    if not row:
        raise HTTPException(status_code=404, detail="counter_not_found")
    return CounterResponse(namespace=namespace, value=row[0])

@app.get("/")
async def root():
    return JSONResponse({
        "service": app.title,
        "version": app.version,
        "endpoints": ["POST /hit", "GET /count/{namespace}", "GET /health"],
    })
